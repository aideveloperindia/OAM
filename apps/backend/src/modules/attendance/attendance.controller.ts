import type { Request, Response } from 'express'
import { AppError } from '../../utils/errors'
import {
  getActiveSessionForFaculty,
  processBulkAttendance,
  BulkAttendanceRecord
} from './attendance.service'

export const getActiveFacultySessionHandler = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required')
  }

  const { tenantId } = req.query as { tenantId: string }

  if (req.user.tenantId !== tenantId) {
    throw new AppError(403, 'Tenant mismatch for authenticated user')
  }

  const session = await getActiveSessionForFaculty(tenantId, req.user.userId)
  return res.status(200).json(session)
}

export const bulkAttendanceSyncHandler = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required')
  }

  const { records } = req.body as { records: BulkAttendanceRecord[] }

  const sanitizedRecords = records.map((record) => ({
    ...record,
    // normalise to ensure tenant/faculty from access token is authoritative
    payload: record.payload ?? {}
  }))

  const results = await processBulkAttendance({
    tenantId: req.user.tenantId,
    facultyId: req.user.userId,
    records: sanitizedRecords
  })

  return res.status(200).json({ results })
}


