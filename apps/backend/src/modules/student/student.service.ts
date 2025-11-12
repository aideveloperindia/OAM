import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/errors'

interface StudentDashboardParams {
  tenantId: string
  studentId: string
}

interface AttendanceSummaryDto {
  subjectId: string
  subjectName: string
  attended: number
  total: number
  lastUpdated: string
}

interface UpcomingSessionDto {
  id: string
  subjectName: string
  facultyName: string
  scheduledAt: string
  location: string | null
}

export interface StudentDashboardDto {
  studentName: string
  rollNumber: string
  overallPercentage: number
  summaries: AttendanceSummaryDto[]
  upcomingSessions: UpcomingSessionDto[]
  syncStatus: {
    lastSyncedAt?: string
    pendingCount: number
  }
}

export const getStudentDashboard = async ({
  tenantId,
  studentId
}: StudentDashboardParams): Promise<StudentDashboardDto> => {
  const student = await prisma.user.findFirst({
    where: {
      id: studentId,
      tenantId,
      role: 'STUDENT'
    },
    select: {
      id: true,
      name: true,
      rollNumber: true
    }
  })

  if (!student) {
    throw new AppError(404, 'Student profile not found')
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      tenantId,
      studentId,
      status: 'ACTIVE'
    },
    include: {
      subject: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      tenantId,
      studentId
    },
    select: {
      status: true,
      updatedAt: true,
      scheduleEntry: {
        select: {
          id: true,
          subjectId: true,
          startsAt: true,
          location: true,
          subject: {
            select: {
              id: true,
              name: true
            }
          },
          faculty: {
            select: {
              name: true
            }
          }
        }
      },
      metadata: true
    }
  })

  const summariesMap = new Map<string, AttendanceSummaryDto>()
  let overallPresent = 0
  let overallTotal = 0
  let lastSyncedAt: string | undefined

  attendanceRecords.forEach((record) => {
    const subjectId = record.scheduleEntry.subjectId
    const subjectName = record.scheduleEntry.subject.name
    const existing = summariesMap.get(subjectId) ?? {
      subjectId,
      subjectName,
      attended: 0,
      total: 0,
      lastUpdated: record.updatedAt.toISOString()
    }

    if (record.status === 'PRESENT' || record.status === 'LATE') {
      existing.attended += 1
      overallPresent += 1
    }
    existing.total += 1
    overallTotal += 1
    if (record.updatedAt.toISOString() > existing.lastUpdated) {
      existing.lastUpdated = record.updatedAt.toISOString()
    }
    summariesMap.set(subjectId, existing)

    if (!lastSyncedAt || record.updatedAt.toISOString() > lastSyncedAt) {
      lastSyncedAt = record.updatedAt.toISOString()
    }
  })

  // ensure subjects without attendance still appear
  enrollments.forEach((enrollment) => {
    if (!summariesMap.has(enrollment.subjectId)) {
      summariesMap.set(enrollment.subjectId, {
        subjectId: enrollment.subjectId,
        subjectName: enrollment.subject.name,
        attended: 0,
        total: 0,
        lastUpdated: new Date().toISOString()
      })
    }
  })

  const summaries = Array.from(summariesMap.values()).sort((a, b) =>
    a.subjectName.localeCompare(b.subjectName)
  )

  const upcomingSessions = await prisma.scheduleEntry.findMany({
    where: {
      tenantId,
      subjectId: {
        in: enrollments.map((enrollment) => enrollment.subjectId)
      },
      startsAt: {
        gte: new Date(),
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    },
    orderBy: {
      startsAt: 'asc'
    },
    include: {
      subject: {
        select: {
          name: true
        }
      },
      faculty: {
        select: {
          name: true
        }
      }
    }
  })

  const upcomingSessionsDto: UpcomingSessionDto[] = upcomingSessions.map((session) => ({
    id: session.id,
    subjectName: session.subject.name,
    facultyName: session.faculty.name,
    scheduledAt: session.startsAt.toISOString(),
    location: session.location ?? null
  }))

  const overallPercentage = overallTotal === 0 ? 100 : Math.round((overallPresent / overallTotal) * 100)

  return {
    studentName: student.name,
    rollNumber: student.rollNumber ?? '',
    overallPercentage,
    summaries,
    upcomingSessions: upcomingSessionsDto,
    syncStatus: {
      lastSyncedAt,
      pendingCount: 0
    }
  }
}


