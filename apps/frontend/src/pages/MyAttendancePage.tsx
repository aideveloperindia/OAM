import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { formatDisplayDate } from '../lib/date'
import facultyBackground from '../assets/faculty-attendance.png'

interface AttendanceRecord {
  id: string
  date: string
  checkIn: string | null
  checkOut: string | null
  status: 'present' | 'absent' | 'late'
}

export const MyAttendancePage = () => {
  const { user } = useAuth()
  const [records] = useState<AttendanceRecord[]>([
    {
      id: '1',
      date: new Date().toISOString(),
      checkIn: '09:15 AM',
      checkOut: null,
      status: 'present'
    },
    {
      id: '2',
      date: new Date(Date.now() - 86400000).toISOString(),
      checkIn: '09:05 AM',
      checkOut: '05:30 PM',
      status: 'present'
    },
    {
      id: '3',
      date: new Date(Date.now() - 2 * 86400000).toISOString(),
      checkIn: '09:45 AM',
      checkOut: '05:20 PM',
      status: 'late'
    }
  ])

  const handleCheckIn = () => {
    alert('Biometric check-in confirmed! Timestamp recorded.')
  }

  const handleCheckOut = () => {
    alert('Biometric check-out confirmed! Timestamp recorded.')
  }

  const todayRecord = records.find(
    (r) =>
      new Date(r.date).toDateString() === new Date().toDateString()
  )

  return (
    <div className="relative overflow-hidden">
      <img
        src={facultyBackground}
        alt="Faculty attendance dashboard"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-slate-900/45" />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 text-white">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-white">
          My Attendance
        </p>
        <h1 className="text-xl font-semibold text-white">
          Peddi Kishore
        </h1>
        <p className="text-sm text-slate-100">
          Biometric punch records and manual confirmations. After scanning your fingerprint at the kiosk, confirm your check-in or check-out here.
        </p>
      </header>

      <section className="rounded-3xl border border-white/20 bg-white/95 p-6 text-slate-900 shadow-xl shadow-primary/20">
        <h2 className="text-lg font-semibold text-slate-900">Today's Status</h2>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-slate-600">
              Check-in:{' '}
              <span className="font-semibold text-primary">
                {todayRecord?.checkIn ?? 'Not yet'}
              </span>
            </p>
            <p className="text-sm text-slate-600">
              Check-out:{' '}
              <span className="font-semibold text-primary">
                {todayRecord?.checkOut ?? 'Not yet'}
              </span>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCheckIn}
              disabled={!!todayRecord?.checkIn}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirm Check-in
            </button>
            <button
              type="button"
              onClick={handleCheckOut}
              disabled={!todayRecord?.checkIn || !!todayRecord?.checkOut}
              className="rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirm Check-out
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/20 bg-white/95 p-6 text-slate-900 shadow-xl shadow-primary/20">
        <h2 className="text-lg font-semibold text-slate-900">Recent History</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Check-in</th>
                <th className="px-4 py-3">Check-out</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((record) => {
                const statusStyles =
                  record.status === 'present'
                    ? 'bg-success/10 text-success border-success/20'
                    : record.status === 'late'
                      ? 'bg-warning/10 text-warning border-warning/20'
                      : 'bg-danger/10 text-danger border-danger/20'

                return (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {formatDisplayDate(record.date)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {record.checkIn ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {record.checkOut ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles}`}
                      >
                        {record.status.charAt(0).toUpperCase() +
                          record.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="rounded-3xl border border-white/20 bg-slate-900/70 p-4 text-xs text-slate-100">
        Biometric timestamps are recorded at the kiosk. Manual confirmations here pair with those punches for audit and reporting.
      </footer>
      </div>
    </div>
  )
}




