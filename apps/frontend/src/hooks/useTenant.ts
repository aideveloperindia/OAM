import { useTenantContext } from '../providers/TenantProvider'

export const useTenant = () => {
  const { tenant, tenantId, setTenantId } = useTenantContext()
  return { tenant, tenantId, setTenantId }
}

