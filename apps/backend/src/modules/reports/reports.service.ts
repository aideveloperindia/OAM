import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/errors'

export interface AttendanceReportParams {
  tenantId: string
  from: Date
  to: Date
  subjectId?: string
  batchId?: string
}

export interface AttendanceAggregateRowDto {
  subjectId: string
  subjectName: string
  batchId: string
  batchName: string
  date: string
  present: number
  absent: number
  late: number
  syncedAt?: string
}

export interface AttendanceReportDto {
  aggregates: AttendanceAggregateRowDto[]
  exports: {
    csvAvailable: boolean
  }
}

const toDateRange = (from: Date, to: Date) => {
  const start = new Date(from)
  start.setUTCHours(0, 0, 0, 0)
  const end = new Date(to)
  end.setUTCHours(23, 59, 59, 999)
  return { start, end }
}

export const fetchAttendanceAggregates = async ({
  tenantId,
  from,
  to,
  subjectId,
  batchId
}: AttendanceReportParams): Promise<AttendanceAggregateRowDto[]> => {
  const { start, end } = toDateRange(from, to)

  const attendance = await prisma.attendance.findMany({
    where: {
      tenantId,
      capturedAt: {
        gte: start,
        lte: end
      },
      scheduleEntry: {
        ...(subjectId ? { subjectId } : {}),
        ...(batchId ? { batchId } : {})
      }
    },
    select: {
      status: true,
      updatedAt: true,
      scheduleEntry: {
        select: {
          id: true,
          startsAt: true,
          subjectId: true,
          batchId: true,
          subject: {
            select: {
              name: true
            }
          },
          batch: {
            select: {
              name: true
            }
          }
        }
      }
    }
  })

  const aggregatesMap = new Map<string, AttendanceAggregateRowDto>()

  attendance.forEach((record) => {
    const subject = record.scheduleEntry.subject
    const batch = record.scheduleEntry.batch
    if (!subject || !batch) {
      return
    }

    const key = `${record.scheduleEntry.subjectId}::${record.scheduleEntry.batchId}::${record.scheduleEntry.startsAt.toISOString()}`
    const existing =
      aggregatesMap.get(key) ??
      ({
        subjectId: record.scheduleEntry.subjectId,
        subjectName: subject.name,
        batchId: record.scheduleEntry.batchId,
        batchName: batch.name,
        date: record.scheduleEntry.startsAt.toISOString(),
        present: 0,
        absent: 0,
        late: 0,
        syncedAt: record.updatedAt.toISOString()
      } satisfies AttendanceAggregateRowDto)

    if (record.status === 'PRESENT') {
      existing.present += 1
    } else if (record.status === 'ABSENT') {
      existing.absent += 1
    } else if (record.status === 'LATE') {
      existing.late += 1
    }

    if (
      !existing.syncedAt ||
      (record.updatedAt && record.updatedAt.toISOString() > existing.syncedAt)
    ) {
      existing.syncedAt = record.updatedAt.toISOString()
    }

    aggregatesMap.set(key, existing)
  })

  return Array.from(aggregatesMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  )
}

export const getAttendanceReport = async (
  params: AttendanceReportParams
): Promise<AttendanceReportDto> => {
  if (params.from > params.to) {
    throw new AppError(400, '"from" date must be before "to" date')
  }

  const aggregates = await fetchAttendanceAggregates(params)

  return {
    aggregates,
    exports: {
      csvAvailable: aggregates.length > 0
    }
  }
}

export const buildAttendanceCsv = async (params: AttendanceReportParams): Promise<string> => {
  const rows = await fetchAttendanceAggregates(params)
  if (!rows.length) {
    throw new AppError(404, 'No attendance records available for export')
  }

  const header = [
    'Subject ID',
    'Subject',
    'Batch ID',
    'Batch',
    'Date',
    'Present',
    'Absent',
    'Late',
    'Last Synced'
  ]
  const csvLines = [
    header.join(','),
    ...rows.map((row) =>
      [
        row.subjectId,
        escapeCsv(row.subjectName),
        row.batchId,
        escapeCsv(row.batchName),
        row.date,
        row.present,
        row.absent,
        row.late,
        row.syncedAt ?? ''
      ].join(',')
    )
  ]

  return csvLines.join('\n')
}

const escapeCsv = (value: string) => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}


