import type { Request, Response } from 'express'
import { login, logout, refreshTokens } from './auth.service'

export const loginHandler = async (req: Request, res: Response) => {
  const result = await login(req.body)
  return res.status(200).json(result)
}

export const refreshHandler = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken: string }
  const result = await refreshTokens(refreshToken)
  return res.status(200).json(result)
}

export const logoutHandler = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string }
  await logout(refreshToken)
  return res.status(204).send()
}


