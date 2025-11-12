import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { prisma } from '../../config/prisma'
import { env } from '../../config/env'
import { AppError } from '../../utils/errors'
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from '../../utils/jwt'
import type { User, UserRole } from '@prisma/client'

export interface AuthUserDto {
  id: string
  name: string
  email: string
  role: 'faculty' | 'student' | 'admin'
  tenantId: string
}

export interface LoginPayload {
  email: string
  tenantId: string
  password?: string
}

export interface LoginResult {
  user: AuthUserDto
  accessToken: string
  refreshToken: string
  expiresIn: number
}

const mapRole = (role: UserRole): AuthUserDto['role'] => {
  switch (role) {
    case 'FACULTY':
      return 'faculty'
    case 'STUDENT':
      return 'student'
    case 'ADMIN':
    default:
      return 'admin'
  }
}

const buildAuthUser = (user: User): AuthUserDto => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: mapRole(user.role),
  tenantId: user.tenantId
})

export const login = async ({ email, password, tenantId }: LoginPayload): Promise<LoginResult> => {
  const user = await prisma.user.findFirst({
    where: {
      email,
      tenantId
    }
  })

  if (!user) {
    throw new AppError(401, 'Invalid credentials')
  }

  const shouldValidatePassword =
    typeof password === 'string' && password.trim().length > 0

  if (shouldValidatePassword) {
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      throw new AppError(401, 'Invalid credentials')
    }
  }

  const tokenPayload = {
    sub: user.id,
    tenantId: user.tenantId,
    role: user.role
  }

  const accessToken = signAccessToken(tokenPayload)

  const refreshTokenId = randomUUID()
  const refreshToken = signRefreshToken({
    ...tokenPayload,
    tokenId: refreshTokenId
  })

  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10)

  await prisma.refreshToken.create({
    data: {
      id: refreshTokenId,
      userId: user.id,
      token: hashedRefreshToken,
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_EXPIRY_SECONDS * 1000)
    }
  })

  return {
    user: buildAuthUser(user),
    accessToken,
    refreshToken,
    expiresIn: env.TOKEN_EXPIRY_SECONDS
  }
}

export const refreshTokens = async (refreshToken: string) => {
  const payload = verifyRefreshToken(refreshToken)

  const storedToken = await prisma.refreshToken.findUnique({
    where: {
      id: payload.tokenId
    },
    include: {
      user: true
    }
  })

  if (!storedToken || storedToken.revokedAt) {
    throw new AppError(401, 'Refresh token is not valid')
  }

  if (storedToken.expiresAt.getTime() < Date.now()) {
    throw new AppError(401, 'Refresh token expired')
  }

  const isMatch = await bcrypt.compare(refreshToken, storedToken.token)
  if (!isMatch) {
    throw new AppError(401, 'Refresh token mismatch')
  }

  const user = storedToken.user
  const tokenPayload = {
    sub: user.id,
    tenantId: user.tenantId,
    role: user.role
  }

  const accessToken = signAccessToken(tokenPayload)

  const nextRefreshTokenId = randomUUID()
  const nextRefreshToken = signRefreshToken({
    ...tokenPayload,
    tokenId: nextRefreshTokenId
  })
  const hashedRefreshToken = await bcrypt.hash(nextRefreshToken, 10)

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        revokedAt: new Date()
      }
    }),
    prisma.refreshToken.create({
      data: {
        id: nextRefreshTokenId,
        userId: user.id,
        token: hashedRefreshToken,
        expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_EXPIRY_SECONDS * 1000)
      }
    })
  ])

  return {
    user: buildAuthUser(user),
    accessToken,
    refreshToken: nextRefreshToken,
    expiresIn: env.TOKEN_EXPIRY_SECONDS
  }
}

export const logout = async (refreshToken?: string) => {
  if (!refreshToken) {
    return
  }

  try {
    const payload = verifyRefreshToken(refreshToken)
    await prisma.refreshToken.updateMany({
      where: {
        id: payload.tokenId
      },
      data: {
        revokedAt: new Date()
      }
    })
  } catch (error) {
    // ignore invalid tokens during logout to keep UX smooth
  }
}


