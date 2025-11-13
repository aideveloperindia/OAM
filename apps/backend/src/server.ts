import http from 'node:http'
import app from './app'
import { env } from './config/env'
import { logger } from './config/logger'
import './config/prisma'

const server = http.createServer(app)

server.listen(env.PORT, () => {
  logger.info(`OAM backend listening on port ${env.PORT}`)
})

const shutdown = (signal: string) => {
  logger.warn({ signal }, 'Received shutdown signal')
  server.close(() => {
    logger.info('HTTP server closed')
    process.exit(0)
  })
}

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => shutdown(signal))
})


