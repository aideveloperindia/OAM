import { useEffect } from 'react'
import { triggerManualSync } from '../features/attendance/hooks'
import { useTenant } from '../hooks/useTenant'
import { useAuth } from '../hooks/useAuth'

const MESSAGE_TYPE = 'SYNC_ATTENDANCE'

export const ServiceWorkerBridge = () => {
  const { tenantId } = useTenant()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handler = (event: MessageEvent) => {
      if (!event.data || event.data.type !== MESSAGE_TYPE) return
      if (!isAuthenticated) return
      void triggerManualSync(tenantId)
    }

    navigator.serviceWorker.addEventListener('message', handler)
    return () => {
      navigator.serviceWorker.removeEventListener('message', handler)
    }
  }, [tenantId, isAuthenticated])

  return null
}


