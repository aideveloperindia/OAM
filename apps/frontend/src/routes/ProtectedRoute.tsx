import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { ReactElement } from 'react'

export const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-primary">
        <span className="animate-pulse text-lg font-semibold">
          Loading OAM…
        </span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/app/login" replace state={{ from: location }} />
  }

  return children
}

