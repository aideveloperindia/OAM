import { PrismaClient } from '@prisma/client'
import { env } from './env'
import { logger } from './logger'

export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'production' ? ['warn', 'error'] : ['query', 'warn', 'error']
})

prisma
  .$connect()
  .then(() => logger.info('Connected to PostgreSQL'))
  .catch((error) => {
    logger.error({ error }, 'Failed to connect to PostgreSQL')
  })


