import { describe, expect, it, beforeEach, vi } from 'vitest'

vi.mock('../../../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 4000,
    DATABASE_URL: 'postgresql://localhost:5432/test',
    JWT_SECRET: 'test-secret-should-be-long-1234567890',
    REFRESH_TOKEN_SECRET: 'refresh-secret-should-be-long-1234567890',
    TOKEN_EXPIRY_SECONDS: 900,
    REFRESH_TOKEN_EXPIRY_SECONDS: 604800
  }
}))
import bcrypt from 'bcryptjs'
import { login, refreshTokens, logout } from '../auth.service'
import { signRefreshToken } from '../../../utils/jwt'

const mockPrisma = vi.hoisted(() => ({
  user: {
    findFirst: vi.fn()
  },
  refreshToken: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn()
  },
  $transaction: vi.fn()
}))

vi.mock('../../../config/prisma', () => ({
  prisma: mockPrisma
}))

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.$transaction.mockImplementation((operations: Array<Promise<unknown>>) =>
      Promise.all(operations)
    )
  })

  it('logs in with valid credentials and returns tokens', async () => {
    const passwordHash = await bcrypt.hash('StrongP@ss1', 10)
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      tenantId: 'scee',
      email: 'faculty@scee.edu.in',
      passwordHash,
      role: 'FACULTY',
      name: 'Faculty Tester'
    })
    mockPrisma.refreshToken.create.mockResolvedValue(undefined)

    const result = await login({
      email: 'faculty@scee.edu.in',
      password: 'StrongP@ss1',
      tenantId: 'scee'
    })

    expect(result.user).toEqual(
      expect.objectContaining({
        id: 'user-1',
        role: 'faculty',
        tenantId: 'scee'
      })
    )
    expect(result.accessToken).toBeDefined()
    expect(result.refreshToken).toBeDefined()
    expect(mockPrisma.refreshToken.create).toHaveBeenCalledTimes(1)
  })

  it('refreshes tokens and rotates refresh token', async () => {
    const payload = {
      sub: 'user-1',
      tenantId: 'scee',
      role: 'FACULTY' as const,
      tokenId: 'token-1'
    }
    const refreshToken = signRefreshToken(payload)
    const storedTokenHash = await bcrypt.hash(refreshToken, 10)

    mockPrisma.refreshToken.findUnique.mockResolvedValue({
      id: 'token-1',
      token: storedTokenHash,
      expiresAt: new Date(Date.now() + 60000),
      revokedAt: null,
      user: {
        id: 'user-1',
        tenantId: 'scee',
        role: 'FACULTY',
        email: 'faculty@scee.edu.in',
        name: 'Faculty Tester'
      }
    })
    mockPrisma.refreshToken.update.mockResolvedValue(undefined)
    mockPrisma.refreshToken.create.mockResolvedValue(undefined)

    mockPrisma.$transaction.mockImplementation(async (operations: Array<Promise<unknown>>) => {
      await Promise.all(operations)
      return undefined
    })

    const result = await refreshTokens(refreshToken)

    expect(result.accessToken).toBeDefined()
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
    expect(mockPrisma.refreshToken.create).toHaveBeenCalled()
  })

  it('does not throw when logout receives invalid token', async () => {
    await expect(logout('invalid-token')).resolves.toBeUndefined()
  })
})


