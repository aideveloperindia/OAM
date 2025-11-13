import { useMemo } from 'react'
import { useQueueSummary, useQueuedAttendance, triggerManualSync } from '../features/attendance/hooks'
import { useTenant } from '../hooks/useTenant'
import { formatDisplayDate } from '../lib/date'

export const UploadStatusPage = () => {
  const { tenantId } = useTenant()
  const summary = useQueueSummary(tenantId)
  const queue = useQueuedAttendance(tenantId)

  const handleSyncNow = async () => {
    try {
      await triggerManualSync(tenantId)
      alert('Sync completed. Check the table for results.')
    } catch (error) {
      console.error('Sync failed', error)
      alert('Sync encountered errors. See the Failed column for details.')
    }
  }

  const groupedByStatus = useMemo(() => {
    const pending = queue.filter((item) => item.syncStatus === 'pending')
    const synced = queue.filter((item) => item.syncStatus === 'synced')
    const failed = queue.filter((item) => item.syncStatus === 'failed')
    return { pending, synced, failed }
  }, [queue])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-primary-dark">
          Upload Status
        </p>
        <h1 className="text-xl font-semibold text-slate-900">
          Offline attendance queue & sync history
        </h1>
        <p className="text-sm text-slate-600">
          When you save attendance offline, entries queue here until the app can upload them to the server.
          This page shows what's pending, what's already synced, and any failures that need attention.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-600">Pending</p>
          <p className="mt-2 text-3xl font-bold text-warning">{summary.pending}</p>
          <p className="mt-1 text-xs text-slate-500">
            Waiting for connection or manual sync
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-600">Synced</p>
          <p className="mt-2 text-3xl font-bold text-success">{summary.synced}</p>
          <p className="mt-1 text-xs text-slate-500">
            Successfully uploaded to server
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-600">Failed</p>
          <p className="mt-2 text-3xl font-bold text-danger">{summary.failed}</p>
          <p className="mt-1 text-xs text-slate-500">
            Errors during sync—may need retry
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSyncNow}
          disabled={summary.pending === 0}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sync now ({summary.pending} pending)
        </button>
      </div>

      <section className="space-y-4">
        {groupedByStatus.pending.length > 0 && (
          <div className="rounded-3xl border border-warning/30 bg-warning/5 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Pending ({groupedByStatus.pending.length})
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Student ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Captured At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupedByStatus.pending.map((item) => (
                    <tr key={item.localId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {item.studentId}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.status}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDisplayDate(item.capturedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {groupedByStatus.failed.length > 0 && (
          <div className="rounded-3xl border border-danger/30 bg-danger/5 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Failed ({groupedByStatus.failed.length})
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              These entries couldn't sync. Check your network or contact support if errors persist.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Student ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Captured At</th>
                    <th className="px-4 py-3">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupedByStatus.failed.map((item) => (
                    <tr key={item.localId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {item.studentId}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.status}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDisplayDate(item.capturedAt)}
                      </td>
                      <td className="px-4 py-3 text-xs text-danger">
                        Retry required – check connection and try again
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {groupedByStatus.synced.length > 0 && (
          <div className="rounded-3xl border border-success/30 bg-success/5 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Recently synced ({groupedByStatus.synced.length})
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Successfully uploaded. These records are now in the server database.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Student ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Captured At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupedByStatus.synced.map((item) => (
                    <tr key={item.localId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {item.studentId}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.status}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDisplayDate(item.capturedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {queue.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-600">
              No queued records. Attendance entries appear here when saved offline.
            </p>
          </div>
        )}
      </section>

      <footer className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        The app attempts background sync every few minutes when online. Manual "Sync now" forces an immediate upload.
      </footer>
    </div>
  )
}

