import { Router } from 'express'
import { authRouter } from '../modules/auth/auth.routes'
import { attendanceRouter } from '../modules/attendance/attendance.routes'
import { studentRouter } from '../modules/student/student.routes'
import { reportsRouter } from '../modules/reports/reports.routes'
import { openApiRouter } from './openapi'

export const router = Router()

router.use('/auth', authRouter)
router.use('/', attendanceRouter)
router.use('/', studentRouter)
router.use('/', reportsRouter)
router.use('/', openApiRouter)


