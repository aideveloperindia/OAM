import type { Request, Response } from 'express'
import { AppError } from '../../utils/errors'
import { getStudentDashboard } from './student.service'

export const studentDashboardHandler = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required')
  }

  const { tenantId } = req.query as { tenantId: string }

  if (tenantId !== req.user.tenantId) {
    throw new AppError(403, 'Tenant mismatch for authenticated user')
  }

  const dashboard = await getStudentDashboard({
    tenantId,
    studentId: req.user.userId
  })

  return res.status(200).json(dashboard)
}


