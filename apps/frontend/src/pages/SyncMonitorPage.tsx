import { useMutation } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import {
  clearSyncedQueue,
  requestBackgroundSync,
  triggerManualSync,
  useQueuedAttendance,
  useQueueSummary
} from '../features/attendance/hooks'
import { formatDisplayDate } from '../lib/date'
import { useTenant } from '../hooks/useTenant'

export const SyncMonitorPage = () => {
  const { tenantId, tenant } = useTenant()
  const queue = useQueuedAttendance(tenantId)
  const summary = useQueueSummary(tenantId)
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null)

  useEffect(() => {
    void requestBackgroundSync()
  }, [tenantId])

  const mutation = useMutation({
    mutationFn: () => triggerManualSync(tenantId),
    onSuccess: (result) => {
      const nextMessage =
        result.failed === 0
          ? `Synced ${result.succeeded} attendance records successfully.`
          : `Synced ${result.succeeded} of ${result.total}. ${result.failed} records need review.`
      setLastSyncMessage(nextMessage)
    },
    onError: (error) => {
      setLastSyncMessage(
        error instanceof Error ? error.message : 'Manual sync failed.'
      )
    }
  })

  const effectiveQueue = useMemo(() => {
    if (queue && queue.length > 0) {
      return queue
    }
    return tenant.demoQueue ?? []
  }, [queue, tenant.demoQueue])

  const effectiveSummary = useMemo(() => {
    if (queue && queue.length > 0) {
      return summary
    }
    const counts = effectiveQueue.reduce(
      (acc, item) => {
        acc[item.syncStatus] = (acc[item.syncStatus] ?? 0) + 1
        return acc
      },
      { pending: 0, failed: 0, synced: 0 }
    )
    return {
      pending: counts.pending,
      failed: counts.failed,
      synced: counts.synced,
      total: effectiveQueue.length
    }
  }, [queue, summary, effectiveQueue])

  const groupedByStatus = useMemo(() => {
    return effectiveQueue.reduce<Record<string, number>>((acc, item) => {
      acc[item.syncStatus] = (acc[item.syncStatus] ?? 0) + 1
      return acc
    }, {})
  }, [effectiveQueue])

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-primary-dark">
          Sync Monitor
        </p>
        <h1 className="text-xl font-semibold text-slate-900">
          Offline queue and sync activity
        </h1>
        <p className="text-sm text-slate-600">
          Keep track of pending attendance submissions. CollegeAttend retries
          automatically when connectivity returns. Admins can trigger manual sync any
          time.
        </p>
        {tenant.demoQueue.length > 0 && (!queue || queue.length === 0) ? (
          <p className="text-[11px] font-medium uppercase tracking-wide text-primary">
            Demo dataset active
          </p>
        ) : null}
      </header>

      <section className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-4">
        <MetricCard label="Pending" value={effectiveSummary.pending} tone="warning" />
        <MetricCard label="Failed" value={effectiveSummary.failed} tone="danger" />
        <MetricCard label="Synced" value={effectiveSummary.synced} tone="success" />
        <MetricCard label="Total queued" value={effectiveSummary.total} tone="slate" />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Manual sync</h2>
            <p className="text-xs text-slate-500">
              Manual sync packages queued attendance into a secure batch call.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || effectiveSummary.total === 0}
              className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow hover:bg-primary-dark disabled:bg-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {mutation.isPending ? 'Syncing…' : 'Sync now'}
            </button>
            <button
              type="button"
              onClick={() => void clearSyncedQueue(tenantId)}
              className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Clear synced records
            </button>
          </div>
        </div>
        {lastSyncMessage ? (
          <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
            {lastSyncMessage}
          </p>
        ) : null}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Queue details</h2>
        <p className="text-xs text-slate-500">
          Distribution: pending {groupedByStatus.pending ?? 0} · failed{' '}
          {groupedByStatus.failed ?? 0} · synced {groupedByStatus.synced ?? 0}
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Student</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Captured</th>
                <th className="px-4 py-3 text-left">Last attempt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {effectiveQueue.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-600">
                    Queue is clear. Background sync checks every few minutes.
                  </td>
                </tr>
              ) : (
                effectiveQueue.map((item) => (
                  <tr key={item.localId}>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {item.studentId}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.syncStatus} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDisplayDate(item.capturedAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {item.lastAttemptAt
                        ? formatDisplayDate(item.lastAttemptAt)
                        : 'Pending'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        Background sync registers via the browser SyncManager when available. Manual
        sync is always offered for browsers without background sync support.
      </footer>
    </div>
  )
}

const statusTone: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  failed: 'bg-danger/10 text-danger border-danger/30',
  synced: 'bg-success/10 text-success border-success/30'
}

const StatusBadge = ({ status }: { status: string }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
        statusTone[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

const MetricCard = ({
  label,
  value,
  tone
}: {
  label: string
  value: number
  tone: 'warning' | 'danger' | 'success' | 'slate'
}) => {
  const toneMap: Record<typeof tone, string> = {
    warning: 'text-warning',
    danger: 'text-danger',
    success: 'text-success',
    slate: 'text-slate-600'
  }
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`text-2xl font-bold ${toneMap[tone]}`}>{value}</p>
    </article>
  )
}


