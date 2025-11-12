import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiClient } from '../services/api-client'

const AUTH_STORAGE_KEY = 'collegeattend::auth'

export type UserRole = 'faculty' | 'student' | 'admin'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  tenantId: string
}

interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

interface AuthState {
  user: AuthUser | null
  tokens: AuthTokens | null
}

interface LoginPayload {
  email: string
  tenantId: string
  password?: string
}

interface AuthContextValue {
  isAuthenticated: boolean
  user: AuthUser | null
  tokens: AuthTokens | null
  loading: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const readStoredAuth = (): AuthState => {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return { user: null, tokens: null }
    const parsed = JSON.parse(raw) as AuthState
    if (!parsed.tokens || parsed.tokens.expiresAt < Date.now()) {
      return { user: null, tokens: null }
    }
    return parsed
  } catch (error) {
    console.error('Failed to parse auth state', error)
    return { user: null, tokens: null }
  }
}

const persistAuth = (state: AuthState | null) => {
  if (!state || !state.tokens) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state))
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({ user: null, tokens: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = readStoredAuth()
    setState(stored)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!loading) {
      persistAuth(state)
    }
  }, [state, loading])

  const login = async ({ email, password, tenantId }: LoginPayload) => {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        tenantId,
        ...(password ? { password } : {})
      })
      const { user, accessToken, refreshToken, expiresIn } = response.data
      const nextState: AuthState = {
        user,
        tokens: {
          accessToken,
          refreshToken,
          expiresAt: Date.now() + expiresIn * 1000
        }
      }
      setState(nextState)
      return
    } catch (error) {
      console.warn('Auth API unavailable, falling back to demo session', error)
    }

    const fallbackUser: AuthUser = {
      id: `demo-${tenantId}`,
      name: email.split('@')[0] || 'SCIT Demo User',
      email,
      role: 'faculty',
      tenantId
    }

    const fallbackState: AuthState = {
      user: fallbackUser,
      tokens: {
        accessToken: `demo-access-token-${tenantId}`,
        refreshToken: `demo-refresh-token-${tenantId}`,
        expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30 // 30 days
      }
    }

    setState(fallbackState)
  }

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout', {
        refreshToken: state.tokens?.refreshToken
      })
    } catch (error) {
      console.warn('Logout failed, ignoring', error)
    } finally {
      setState({ user: null, tokens: null })
    }
  }

  const refresh = async () => {
    if (!state.tokens?.refreshToken) return

    if (state.tokens.refreshToken.startsWith('demo-refresh-token')) {
      setState((prev) =>
        prev.tokens
          ? {
              user: prev.user,
              tokens: {
                ...prev.tokens,
                expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30
              }
            }
          : prev
      )
      return
    }

    const response = await apiClient.post('/auth/refresh', {
      refreshToken: state.tokens.refreshToken
    })
    const { accessToken, refreshToken, expiresIn, user } = response.data
    setState((prev) => ({
      user: user ?? prev.user,
      tokens: {
        accessToken,
        refreshToken: refreshToken ?? prev.tokens?.refreshToken ?? '',
        expiresAt: Date.now() + expiresIn * 1000
      }
    }))
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(state.tokens?.accessToken),
      user: state.user,
      tokens: state.tokens,
      loading,
      login,
      logout,
      refresh
    }),
    [state, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return ctx
}

