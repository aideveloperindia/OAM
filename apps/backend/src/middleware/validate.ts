import type { NextFunction, Request, Response } from 'express'
import type { AnyZodObject } from 'zod'
import { ZodError } from 'zod'
import { AppError } from '../utils/errors'

export const validateRequest =
  (schema: AnyZodObject) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      const payload = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      })

      req.body = payload.body ?? req.body
      req.query = payload.query ?? req.query
      req.params = payload.params ?? req.params

      return next()
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
        return next(new AppError(422, 'Validation failed', issues))
      }

      return next(error)
    }
  }


