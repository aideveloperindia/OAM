import type { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../utils/jwt'
import { AppError } from '../utils/errors'
import type { UserRole } from '@prisma/client'

export const authenticate =
  (requireAuth = true) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      if (requireAuth) {
        return next(new AppError(401, 'Authentication required'))
      }
      return next()
    }

    const [, token] = authHeader.split(' ')
    if (!token) {
      return next(new AppError(401, 'Authentication token missing'))
    }

    try {
      const payload = verifyAccessToken(token)
      req.user = {
        userId: payload.sub,
        tenantId: payload.tenantId,
        role: payload.role as UserRole
      }
      return next()
    } catch (error) {
      return next(new AppError(401, 'Invalid or expired token', error))
    }
  }

export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'))
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'Insufficient permissions'))
    }
    return next()
  }


