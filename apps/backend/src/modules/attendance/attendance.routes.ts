import { Router } from 'express'
import { z } from 'zod'
import { authenticate, authorize } from '../../middleware/authenticate'
import { validateRequest } from '../../middleware/validate'
import {
  bulkAttendanceSyncHandler,
  getActiveFacultySessionHandler
} from './attendance.controller'

const activeSessionSchema = z.object({
  query: z.object({
    tenantId: z.string().min(1, 'tenantId is required')
  })
})

const bulkSyncSchema = z.object({
  body: z.object({
    records: z
      .array(
        z.object({
          localId: z.string().min(1),
          scheduleEntryId: z.string().min(1),
          studentId: z.string().min(1),
          capturedAt: z.string().datetime(),
          status: z.enum(['present', 'absent', 'late']),
          payload: z.record(z.any()).optional()
        })
      )
      .min(1, 'records array cannot be empty')
  })
})

export const attendanceRouter = Router()

attendanceRouter.get(
  '/faculty/session/active',
  authenticate(),
  authorize('FACULTY', 'ADMIN'),
  validateRequest(activeSessionSchema),
  (req, res, next) =>
    Promise.resolve(getActiveFacultySessionHandler(req, res)).catch((error) => next(error))
)

attendanceRouter.post(
  '/attendance/bulk',
  authenticate(),
  authorize('FACULTY', 'ADMIN'),
  validateRequest(bulkSyncSchema),
  (req, res, next) =>
    Promise.resolve(bulkAttendanceSyncHandler(req, res)).catch((error) => next(error))
)


