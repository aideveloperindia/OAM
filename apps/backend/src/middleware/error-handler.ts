import type { NextFunction, Request, Response } from 'express'
import { logger } from '../config/logger'
import { AppError } from '../utils/errors'

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof AppError) {
    if (error.status >= 500) {
      logger.error({ error }, 'Application error')
    }
    return res.status(error.status).json({
      error: error.message,
      details: error.details ?? null
    })
  }

  logger.error({ error }, 'Unhandled error')
  return res.status(500).json({
    error: 'Internal Server Error'
  })
}


