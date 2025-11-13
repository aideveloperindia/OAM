import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { TENANTS } from '../data/tenants'
import { db } from '../data/db'
import type { TenantConfig, TenantKey } from '../data/tenants'

const STORAGE_KEY = 'oam::tenant'
const DEFAULT_TENANT: TenantKey = 'scit'

interface TenantContextValue {
  tenantId: TenantKey
  tenant: TenantConfig
  setTenantId: (tenant: TenantKey) => Promise<void>
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined)

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  const [tenantId, setTenantIdState] = useState<TenantKey>(DEFAULT_TENANT)
  const [isHydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as TenantKey | null
    if (stored && stored in TENANTS) {
      setTenantIdState(stored)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    window.localStorage.setItem(STORAGE_KEY, tenantId)
    db.tenantSettings
      .put({
        tenantId,
        lastSeenVersion: import.meta.env.VITE_APP_VERSION ?? 'dev'
      })
      .catch((err) => {
        console.error('Failed to persist tenant setting', err)
      })
  }, [tenantId, isHydrated])

  const setTenantId = async (next: TenantKey) => {
    if (!(next in TENANTS)) return
    setTenantIdState(next)
  }

  const value = useMemo<TenantContextValue>(
    () => ({
      tenantId,
      tenant: TENANTS[tenantId],
      setTenantId
    }),
    [tenantId]
  )

  if (!isHydrated) {
    return null
  }

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

export const useTenantContext = () => {
  const ctx = useContext(TenantContext)
  if (!ctx) {
    throw new Error('useTenantContext must be used within TenantProvider')
  }
  return ctx
}

