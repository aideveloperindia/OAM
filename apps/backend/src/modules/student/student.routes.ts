import { Router } from 'express'
import { z } from 'zod'
import { authenticate, authorize } from '../../middleware/authenticate'
import { validateRequest } from '../../middleware/validate'
import { studentDashboardHandler } from './student.controller'

const dashboardSchema = z.object({
  query: z.object({
    tenantId: z.string().min(1)
  })
})

export const studentRouter = Router()

studentRouter.get(
  '/student/dashboard',
  authenticate(),
  authorize('STUDENT'),
  validateRequest(dashboardSchema),
  (req, res, next) =>
    Promise.resolve(studentDashboardHandler(req, res)).catch((error) => next(error))
)


