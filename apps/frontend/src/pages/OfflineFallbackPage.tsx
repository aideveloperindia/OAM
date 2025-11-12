export const OfflineFallbackPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-center text-slate-700">
      <div className="max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-xl font-semibold text-slate-900">
          You are offline
        </h1>
        <p className="text-sm text-slate-600">
          CollegeAttend continues to capture attendance and store records securely on
          this device. Reconnect to sync with campus systems and regenerate reports.
        </p>
        <p className="text-xs text-slate-500">
          Once connectivity returns, use the Sync Monitor to push pending updates and
          refresh dashboards.
        </p>
      </div>
    </div>
  )
}


