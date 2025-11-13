import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env'
import { errorHandler } from './middleware/error-handler'
import { router } from './routes'

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: env.NODE_ENV === 'production' ? [/oam/i] : true,
    credentials: true
  })
)
app.use(compression())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.get('/healthz', (_req, res) =>
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
)

app.use('/api/v1', router)

app.use(errorHandler)

export default app


