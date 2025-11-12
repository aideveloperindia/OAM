import { Router } from 'express'
import { z } from 'zod'
import { validateRequest } from '../../middleware/validate'
import { loginHandler, logoutHandler, refreshHandler } from './auth.controller'

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    tenantId: z.string().min(1),
    password: z.string().min(6).optional()
  })
})

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10)
  })
})

const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10).optional()
  })
})

export const authRouter = Router()

authRouter.post(
  '/login',
  validateRequest(loginSchema),
  (req, res, next) => Promise.resolve(loginHandler(req, res)).catch((error) => next(error))
)

authRouter.post(
  '/refresh',
  validateRequest(refreshSchema),
  (req, res, next) => Promise.resolve(refreshHandler(req, res)).catch((error) => next(error))
)

authRouter.post(
  '/logout',
  validateRequest(logoutSchema),
  (req, res, next) => Promise.resolve(logoutHandler(req, res)).catch((error) => next(error))
)


