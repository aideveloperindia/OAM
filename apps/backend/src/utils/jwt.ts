import jwt from 'jsonwebtoken'
import { env } from '../config/env'

interface JwtPayload {
  sub: string
  tenantId: string
  role: string
}

export const signAccessToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.TOKEN_EXPIRY_SECONDS
  })

export const signRefreshToken = (payload: JwtPayload & { tokenId: string }) =>
  jwt.sign({ ...payload }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRY_SECONDS
  })

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_SECRET) as JwtPayload & jwt.JwtPayload

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.REFRESH_TOKEN_SECRET) as JwtPayload &
    jwt.JwtPayload & { tokenId: string }


