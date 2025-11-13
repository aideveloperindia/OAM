import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/api-client'
import { useTenant } from '../hooks/useTenant'
import { formatDisplayDate } from '../lib/date'
import performanceImage from '../assets/performance.png'

interface AttendanceSummary {
  subjectId: string
  subjectName: string
  attended: number
  total: number
  lastUpdated: string
}

interface UpcomingSession {
  id: string
  subjectName: string
  facultyName: string
  scheduledAt: string
  location: string
}

interface StudentDashboardPayload {
  studentName: string
  rollNumber: string
  overallPercentage: number
  summaries: AttendanceSummary[]
  upcomingSessions: UpcomingSession[]
  syncStatus: {
    lastSyncedAt?: string
    pendingCount: number
  }
}

const percentage = (attended: number, total: number) =>
  total === 0 ? 100 : Math.round((attended / total) * 100)

export const StudentDashboardPage = () => {
  const { tenantId, tenant } = useTenant()
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-dashboard', tenantId],
    queryFn: async () => {
      try {
        const response = await apiClient.get<StudentDashboardPayload>(
          '/student/dashboard',
          {
            params: { tenantId }
          }
        )
        return response.data
      } catch (error) {
        if (tenant.demoDashboard) {
          return tenant.demoDashboard
        }
        throw error
      }
    },
    staleTime: 2 * 60 * 1000,
    retry: 1
  })

  const filteredSummaries = useMemo(() => {
    if (!data) return []
    if (selectedSubject === 'all') return data.summaries
    return data.summaries.filter(
      (summary) => summary.subjectId === selectedSubject
    )
  }, [data, selectedSubject])

  if (isLoading) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-600">
          Syncing personalised attendance dashboard…
        </p>
      </section>
    )
  }

  if (isError || !data) {
    return (
      <section className="mx-auto max-w-md rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">
          Dashboard unavailable
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Please check your connection or try syncing again later. Offline data
          remains safe on this device.
        </p>
      </section>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-primary-dark">
          Student Attendance Overview
        </p>
        <h1 className="text-xl font-semibold text-slate-900">
          Welcome back, {data.studentName}
        </h1>
        {tenant.demoDashboard ? (
          <p className="text-[11px] font-medium uppercase tracking-wide text-primary">
            Demo dataset active
          </p>
        ) : null}
        <p className="text-sm text-slate-600">
          Roll number {data.rollNumber}. Overall attendance{' '}
          <span className="font-semibold text-primary">
            {data.overallPercentage}%
          </span>
          .
        </p>
      </header>

      <div className="overflow-hidden rounded-3xl border border-primary/20 bg-white shadow-sm shadow-primary/15">
        <img
          src={performanceImage}
          alt="Student performance analytics dashboard"
          className="h-52 w-full object-cover sm:h-60"
        />
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        {data.summaries.map((summary) => (
          <article
            key={summary.subjectId}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <header className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {summary.subjectName}
                </p>
                <p className="text-xs text-slate-500">
                  Updated {formatDisplayDate(summary.lastUpdated)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {percentage(summary.attended, summary.total)}%
                </p>
                <p className="text-xs text-slate-500">
                  {summary.attended} of {summary.total} sessions
                </p>
              </div>
            </header>
            <div className="mt-4 overflow-hidden rounded-xl bg-slate-100">
              <div
                className="h-2 bg-primary transition-all"
                style={{
                  width: `${percentage(summary.attended, summary.total)}%`
                }}
                aria-hidden
              />
            </div>
            <button
              type="button"
              className="mt-4 text-xs font-semibold text-primary underline underline-offset-2"
              onClick={() => setSelectedSubject(summary.subjectId)}
            >
              Focus on this subject
            </button>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Attendance calendar
            </h2>
            <p className="text-xs text-slate-500">
              Filtered view:{' '}
              <span className="font-medium text-primary">
                {selectedSubject === 'all'
                  ? 'All subjects'
                  : data.summaries.find((item) => item.subjectId === selectedSubject)
                      ?.subjectName ?? 'All subjects'}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => setSelectedSubject('all')}
              className={[
                'rounded-full border px-3 py-1 font-semibold transition',
                selectedSubject === 'all'
                  ? 'border-primary bg-primary text-white'
                  : 'border-slate-300 bg-white text-slate-600 hover:border-primary hover:text-primary'
              ].join(' ')}
            >
              All subjects
            </button>
            {data.summaries.map((summary) => (
              <button
                key={summary.subjectId}
                type="button"
                onClick={() => setSelectedSubject(summary.subjectId)}
                className={[
                  'rounded-full border px-3 py-1 font-semibold transition',
                  selectedSubject === summary.subjectId
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-primary hover:text-primary'
                ].join(' ')}
              >
                {summary.subjectName}
              </button>
            ))}
          </div>
        </header>

        <div className="mt-4 divide-y divide-slate-100">
          {filteredSummaries.length === 0 ? (
            <p className="py-6 text-sm text-slate-600">
              No attendance records yet. Sync will populate the calendar once class
              data arrives.
            </p>
          ) : (
            filteredSummaries.map((summary) => (
              <div key={summary.subjectId} className="grid gap-3 py-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {summary.subjectName}
                  </p>
                  <p className="text-xs text-slate-500">
                    Last update {formatDisplayDate(summary.lastUpdated)}
                  </p>
                </div>
                <p className="text-sm text-slate-600">
                  {summary.attended} attended out of {summary.total} sessions.
                  Maintain at least 75% to remain in good standing.
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Upcoming sessions
            </h2>
            <p className="text-xs text-slate-500">
              Planner data is cached offline and refreshes automatically.
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Last synced:{' '}
            {data.syncStatus.lastSyncedAt
              ? formatDisplayDate(data.syncStatus.lastSyncedAt)
              : 'Pending first sync'}
          </p>
        </header>

        <ul className="mt-4 space-y-3">
          {data.upcomingSessions.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              Once the timetable syncs, upcoming classes appear here.
            </li>
          ) : (
            data.upcomingSessions.map((session) => (
              <li
                key={session.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {session.subjectName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDisplayDate(session.scheduledAt)} ·{' '}
                      {session.location}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">
                    Faculty: {session.facultyName}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      <footer className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        Pending sync items: {data.syncStatus.pendingCount}. The system attempts
        background sync every few minutes when connected.
      </footer>
    </div>
  )
}


