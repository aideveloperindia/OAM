import { Router } from 'express'
import { z } from 'zod'
import { authenticate, authorize } from '../../middleware/authenticate'
import { validateRequest } from '../../middleware/validate'
import { attendanceExportHandler, attendanceReportHandler } from './reports.controller'

const querySchema = z.object({
  query: z.object({
    tenantId: z.string().min(1),
    from: z.string().min(4),
    to: z.string().min(4),
    subjectId: z.string().optional(),
    batchId: z.string().optional()
  })
})

export const reportsRouter = Router()

reportsRouter.get(
  '/admin/reports/attendance',
  authenticate(),
  authorize('ADMIN'),
  validateRequest(querySchema),
  (req, res, next) =>
    Promise.resolve(attendanceReportHandler(req, res)).catch((error) => next(error))
)

reportsRouter.get(
  '/admin/reports/attendance/export',
  authenticate(),
  authorize('ADMIN'),
  validateRequest(querySchema),
  (req, res, next) =>
    Promise.resolve(attendanceExportHandler(req, res)).catch((error) => next(error))
)


