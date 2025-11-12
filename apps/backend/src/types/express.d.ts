import type { UserRole } from '@prisma/client'

declare global {
  namespace Express {
    interface UserSession {
      userId: string
      tenantId: string
      role: UserRole
    }

    interface Request {
      user?: UserSession
    }
  }
}

export {}


