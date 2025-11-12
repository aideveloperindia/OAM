import type { Request, Response } from 'express'
import { AppError } from '../../utils/errors'
import { buildAttendanceCsv, getAttendanceReport } from './reports.service'

const parseIsoDate = (value: string | undefined, field: string) => {
  if (!value) {
    throw new AppError(400, `"${field}" query parameter is required`)
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, `"${field}" must be a valid ISO date string`)
  }
  return date
}

export const attendanceReportHandler = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required')
  }

  const { tenantId, from, to, subjectId, batchId } = req.query as Record<string, string | undefined>

  if (tenantId !== req.user.tenantId) {
    throw new AppError(403, 'Tenant mismatch for authenticated user')
  }

  const report = await getAttendanceReport({
    tenantId,
    from: parseIsoDate(from, 'from'),
    to: parseIsoDate(to, 'to'),
    subjectId: subjectId ?? undefined,
    batchId: batchId ?? undefined
  })

  return res.status(200).json(report)
}

export const attendanceExportHandler = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required')
  }

  const { tenantId, from, to, subjectId, batchId } = req.query as Record<string, string | undefined>

  if (tenantId !== req.user.tenantId) {
    throw new AppError(403, 'Tenant mismatch for authenticated user')
  }

  const csv = await buildAttendanceCsv({
    tenantId,
    from: parseIsoDate(from, 'from'),
    to: parseIsoDate(to, 'to'),
    subjectId: subjectId ?? undefined,
    batchId: batchId ?? undefined
  })

  const safe = (value: string | undefined) =>
    (value ?? '').replace(/[^0-9A-Za-z_-]/g, '')
  res
    .status(200)
    .setHeader('Content-Type', 'text/csv;charset=utf-8')
    .setHeader(
      'Content-Disposition',
      `attachment; filename="attendance_${safe(tenantId)}_${safe(from)}_${safe(to)}.csv"`
    )
    .send(csv)
}


