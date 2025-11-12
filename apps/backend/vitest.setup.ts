process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret-please-change'
process.env.REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET ?? 'test-refresh-secret-please-change'
process.env.TOKEN_EXPIRY_SECONDS = process.env.TOKEN_EXPIRY_SECONDS ?? '900'
process.env.REFRESH_TOKEN_EXPIRY_SECONDS = process.env.REFRESH_TOKEN_EXPIRY_SECONDS ?? '604800'
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://prisma:password@localhost:5432/collegeattend'


