import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['production', 'development', 'test']).default('development'),
  PORT: z
    .string()
    .default('4000')
    .transform((value) => Number.parseInt(value, 10)),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(32, 'REFRESH_TOKEN_SECRET must be at least 32 characters'),
  TOKEN_EXPIRY_SECONDS: z
    .string()
    .default('900')
    .transform((value) => Number.parseInt(value, 10)),
  REFRESH_TOKEN_EXPIRY_SECONDS: z
    .string()
    .default('604800')
    .transform((value) => Number.parseInt(value, 10))
})

export const env = envSchema.parse(process.env)

export type Env = typeof env


