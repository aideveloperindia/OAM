import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AuthProvider } from './AuthProvider'
import { TenantProvider } from './TenantProvider'
import { ServiceWorkerBridge } from './ServiceWorkerBridge'
import type { ReactNode } from 'react'

export const AppProviders = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false
          }
        }
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TenantProvider>
          <ServiceWorkerBridge />
          {children}
        </TenantProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

