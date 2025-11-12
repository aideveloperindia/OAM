import { TENANT_LIST } from '../../data/tenants'
import { useTenant } from '../../hooks/useTenant'

export const TenantSelector = () => {
  const { tenantId, setTenantId } = useTenant()

  return (
    <label className="flex w-full flex-col gap-1 text-sm text-slate-600 sm:w-auto">
      <span className="font-medium text-slate-700">Campus</span>
      <select
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 sm:w-56"
        value={tenantId}
        onChange={(event) => void setTenantId(event.target.value as typeof tenantId)}
        aria-label="Select campus"
      >
        {TENANT_LIST.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.shortName} — {tenant.name}
          </option>
        ))}
      </select>
    </label>
  )
}

