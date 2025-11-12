import { AttendanceStatus as PrismaAttendanceStatus, AuditAction } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/errors'

export type AttendanceRiskLevel = 'low' | 'medium' | 'high'

export interface AttendanceStudentDto {
  id: string
  rollNumber: string
  name: string
  parentPhone: string
  parentName?: string | null
  riskLevel: AttendanceRiskLevel
}

export interface AttendanceSessionDto {
  sessionId: string
  subjectId: string
  subjectName: string
  batchId: string
  batchName: string
  scheduledAt: string
  facultyId: string
  facultyName: string
  students: AttendanceStudentDto[]
}

export interface BulkAttendanceRecord {
  localId: string
  scheduleEntryId: string
  studentId: string
  capturedAt: string
  status: 'present' | 'absent' | 'late'
  payload?: Record<string, unknown>
}

export interface BulkAttendanceResult {
  localId: string
  status: 'synced' | 'failed'
  attendanceId?: string
  conflict?: boolean
  message?: string
}

const STATUS_MAP: Record<BulkAttendanceRecord['status'], PrismaAttendanceStatus> = {
  present: PrismaAttendanceStatus.PRESENT,
  absent: PrismaAttendanceStatus.ABSENT,
  late: PrismaAttendanceStatus.LATE
}

export const getActiveSessionForFaculty = async (
  tenantId: string,
  facultyId: string
): Promise<AttendanceSessionDto | null> => {
  const now = new Date()
  const windowStart = new Date(now.getTime() - 60 * 60 * 1000) // 1 hour earlier
  const windowEnd = new Date(now.getTime() + 3 * 60 * 60 * 1000) // 3 hours ahead

  const session = await prisma.scheduleEntry.findFirst({
    where: {
      tenantId,
      facultyId,
      startsAt: {
        gte: windowStart,
        lte: windowEnd
      },
      endsAt: {
        gte: now
      }
    },
    orderBy: {
      startsAt: 'asc'
    },
    include: {
      subject: true,
      batch: true,
      faculty: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  if (!session) {
    return null
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      tenantId,
      subjectId: session.subjectId,
      batchId: session.batchId,
      status: 'ACTIVE'
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          rollNumber: true,
          parentPhone: true,
          parentName: true
        }
      }
    }
  })

  const studentsBase = enrollments
    .map<AttendanceStudentDto>((enrollment) => ({
      id: enrollment.studentId,
      name: enrollment.student.name,
      rollNumber: enrollment.student.rollNumber ?? '',
      parentPhone: enrollment.student.parentPhone ?? '',
      parentName: enrollment.student.parentName,
      riskLevel: 'low'
    }))
    .sort((a, b) =>
      a.rollNumber.localeCompare(b.rollNumber, 'en', {
        numeric: true,
        sensitivity: 'base'
      })
    )

  const studentIds = studentsBase.map((student) => student.id)
  const riskMap = await buildRiskMap({
    tenantId,
    subjectId: session.subjectId,
    studentIds
  })

  const students = studentsBase.map((student) => ({
    ...student,
    riskLevel: riskMap.get(student.id) ?? 'low'
  }))

  return {
    sessionId: session.id,
    subjectId: session.subjectId,
    subjectName: session.subject.name,
    batchId: session.batchId,
    batchName: session.batch.name,
    scheduledAt: session.startsAt.toISOString(),
    facultyId: session.faculty.id,
    facultyName: session.faculty.name,
    students
  }
}

export const processBulkAttendance = async ({
  tenantId,
  facultyId,
  records
}: {
  tenantId: string
  facultyId: string
  records: BulkAttendanceRecord[]
}): Promise<BulkAttendanceResult[]> => {
  if (!records.length) {
    return []
  }

  return prisma.$transaction(async (tx) => {
    const results: BulkAttendanceResult[] = []

    for (const record of records) {
      try {
        const scheduleEntry = await tx.scheduleEntry.findFirst({
          where: {
            id: record.scheduleEntryId,
            tenantId
          },
          include: {
            subject: true,
            batch: true
          }
        })

        if (!scheduleEntry) {
          throw new AppError(400, 'Schedule entry not found for record')
        }

        if (scheduleEntry.facultyId !== facultyId) {
          throw new AppError(403, 'Faculty is not assigned to this schedule entry')
        }

        const enrollment = await tx.enrollment.findFirst({
          where: {
            tenantId,
            studentId: record.studentId,
            subjectId: scheduleEntry.subjectId,
            batchId: scheduleEntry.batchId
          }
        })

        if (!enrollment) {
          throw new AppError(404, 'Student enrollment not found for subject/batch')
        }

        const capturedAt = new Date(record.capturedAt)
        if (Number.isNaN(capturedAt.getTime())) {
          throw new AppError(400, 'Invalid capturedAt timestamp')
        }

        const status = STATUS_MAP[record.status]

        const existingAttendance = await tx.attendance.findUnique({
          where: {
            scheduleEntryId_studentId: {
              scheduleEntryId: record.scheduleEntryId,
              studentId: record.studentId
            }
          }
        })

        if (existingAttendance) {
          const conflict =
            existingAttendance.updatedAt.getTime() > capturedAt.getTime() ||
            existingAttendance.status !== status

          const updated = await tx.attendance.update({
            where: {
              id: existingAttendance.id
            },
            data: {
              status,
              capturedAt,
              capturedAtLocal: capturedAt,
              metadata: record.payload ?? {},
              localId: record.localId
            }
          })

          await tx.attendanceAudit.create({
            data: {
              tenantId,
              attendanceId: updated.id,
              actorId: facultyId,
              action: conflict ? AuditAction.CONFLICT : AuditAction.UPDATED,
              payload: {
                previousStatus: existingAttendance.status,
                nextStatus: status,
                localId: record.localId,
                capturedAt: record.capturedAt,
                metadata: record.payload ?? null
              }
            }
          })

          results.push({
            localId: record.localId,
            status: 'synced',
            attendanceId: updated.id,
            conflict
          })

          continue
        }

        const created = await tx.attendance.create({
          data: {
            tenantId,
            scheduleEntryId: record.scheduleEntryId,
            studentId: record.studentId,
            facultyId,
            status,
            capturedAt,
            capturedAtLocal: capturedAt,
            metadata: record.payload ?? {},
            localId: record.localId
          }
        })

        await tx.attendanceAudit.create({
          data: {
            tenantId,
            attendanceId: created.id,
            actorId: facultyId,
            action: AuditAction.CREATED,
            payload: {
              status,
              localId: record.localId,
              capturedAt: record.capturedAt,
              metadata: record.payload ?? null
            }
          }
        })

        results.push({
          localId: record.localId,
          status: 'synced',
          attendanceId: created.id,
          conflict: false
        })
      } catch (error) {
        const message = error instanceof AppError ? error.message : 'Attendance sync failed'
        results.push({
          localId: record.localId,
          status: 'failed',
          message
        })
      }
    }

    return results
  })
}

const buildRiskMap = async ({
  tenantId,
  subjectId,
  studentIds
}: {
  tenantId: string
  subjectId: string
  studentIds: string[]
}): Promise<Map<string, AttendanceRiskLevel>> => {
  const riskMap = new Map<string, AttendanceRiskLevel>()
  if (studentIds.length === 0) {
    return riskMap
  }

  const lookbackWindow = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)

  const history = await prisma.attendance.findMany({
    where: {
      tenantId,
      studentId: {
        in: studentIds
      },
      scheduleEntry: {
        subjectId
      },
      capturedAt: {
        gte: lookbackWindow
      }
    },
    orderBy: {
      capturedAt: 'desc'
    },
    select: {
      studentId: true,
      status: true,
      capturedAt: true
    }
  })

  const grouped = new Map<
    string,
    {
      total: number
      absent: number
      late: number
      recentAbsenceStreak: number
    }
  >()

  for (const record of history) {
    const current =
      grouped.get(record.studentId) ?? {
        total: 0,
        absent: 0,
        late: 0,
        recentAbsenceStreak: 0
      }

    current.total += 1
    if (record.status === PrismaAttendanceStatus.ABSENT) {
      current.absent += 1
      if (current.recentAbsenceStreak >= 0) {
        current.recentAbsenceStreak += 1
      }
    } else {
      current.recentAbsenceStreak = 0
    }

    if (record.status === PrismaAttendanceStatus.LATE) {
      current.late += 1
    }

    grouped.set(record.studentId, current)
  }

  const determineRisk = (metrics: {
    total: number
    absent: number
    late: number
    recentAbsenceStreak: number
  }): AttendanceRiskLevel => {
    if (metrics.total === 0) {
      return 'low'
    }
    const absentRatio = metrics.absent / metrics.total
    const lateRatio = metrics.late / metrics.total
    if (metrics.recentAbsenceStreak >= 2 || absentRatio >= 0.45) {
      return 'high'
    }
    if (absentRatio >= 0.3 || lateRatio >= 0.35) {
      return 'medium'
    }
    return 'low'
  }

  studentIds.forEach((studentId) => {
    const metrics =
      grouped.get(studentId) ?? {
        total: 0,
        absent: 0,
        late: 0,
        recentAbsenceStreak: 0
      }
    riskMap.set(studentId, determineRisk(metrics))
  })

  return riskMap
}


