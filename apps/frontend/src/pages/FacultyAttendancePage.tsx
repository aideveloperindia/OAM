import { useEffect, useMemo, useState } from 'react'
import {
  useActiveAttendanceSession,
  useQueueSummary,
  useQueuedAttendance,
  saveAttendanceLocally,
  requestBackgroundSync
} from '../features/attendance/hooks'
import { useTenant } from '../hooks/useTenant'
import { useAuth } from '../hooks/useAuth'
import type { AttendanceStatus } from '../data/db'
import type { AttendanceStudent, PreparedNotification } from '../features/attendance/types'
import { NotifyParentsModal } from '../features/attendance/NotifyParentsModal'
import {
  buildAbsenceNotification,
  buildRiskNotification
} from '../features/attendance/notifications'

const statusOptions: AttendanceStatus[] = ['present', 'absent', 'late']

export const FacultyAttendancePage = () => {
  const { tenantId, tenant } = useTenant()
  const { user } = useAuth()
  const { data: session, isLoading } = useActiveAttendanceSession(tenantId)
  const queueSummary = useQueueSummary(tenantId)
  const queue = useQueuedAttendance(tenantId)
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({})
  const [selectedAbsentStudents, setSelectedAbsentStudents] = useState<Set<string>>(
    new Set()
  )
  const [selectedRiskStudents, setSelectedRiskStudents] = useState<Set<string>>(
    new Set()
  )
  const [isNotifyOpen, setNotifyOpen] = useState(false)
  const [whatsAppRecipient, setWhatsAppRecipient] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    try {
      const stored = window.localStorage.getItem(
        `oam::whatsapp-recipient::${tenantId}`
      )
      return stored ?? ''
    } catch (error) {
      console.warn('Unable to read stored WhatsApp recipient', error)
      return ''
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem(
        `oam::whatsapp-recipient::${tenantId}`
      )
      setWhatsAppRecipient(stored ?? '')
    } catch (error) {
      console.warn('Unable to hydrate WhatsApp recipient', error)
      setWhatsAppRecipient('')
    }
  }, [tenantId])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        `oam::whatsapp-recipient::${tenantId}`,
        whatsAppRecipient
      )
    } catch (error) {
      console.warn('Unable to persist WhatsApp recipient', error)
    }
  }, [tenantId, whatsAppRecipient])


  useEffect(() => {
    if (!session) return
    const initialMarks: Record<string, AttendanceStatus> = {}
    const initialAbsent = new Set<string>()
    const initialRisk = new Set<string>()
    session.students.forEach((student) => {
      const existing = marks[student.id] ?? 'present'
      initialMarks[student.id] = existing
      if (existing === 'absent') {
        initialAbsent.add(student.id)
      }
      if (student.riskLevel === 'high') {
        initialRisk.add(student.id)
      }
    })
    setMarks(initialMarks)
    setSelectedAbsentStudents(initialAbsent)
    setSelectedRiskStudents(initialRisk)
  }, [session])

  const statusByStudent = useMemo(() => {
    const map = new Map<string, AttendanceStatus>()
    Object.entries(marks).forEach(([studentId, status]) =>
      map.set(studentId, status)
    )
    return map
  }, [marks])

  const queueByStudent = useMemo(() => {
    const map = new Map<string, string>()
    queue?.forEach((item) => {
      if (!map.has(item.studentId)) {
        map.set(item.studentId, item.syncStatus)
      }
    })
    return map
  }, [queue])

  const absentStudents = useMemo(
    () =>
      session?.students.filter(
        (student) => statusByStudent.get(student.id) === 'absent'
      ) ?? [],
    [session, statusByStudent]
  )

  const highRiskStudents = useMemo(
    () =>
      session?.students.filter((student) => student.riskLevel === 'high') ?? [],
    [session]
  )

  const absenceNotifications = useMemo<PreparedNotification[]>(() => {
    if (!session) return []
    return absentStudents
      .filter((student) => selectedAbsentStudents.has(student.id))
      .map((student) =>
        buildAbsenceNotification({
          session,
          studentName: student.name,
          rollNumber: student.rollNumber,
          parentPhone: whatsAppRecipient.trim() || student.parentPhone
        })
      )
  }, [absentStudents, session, selectedAbsentStudents, whatsAppRecipient])

  const riskNotifications = useMemo<PreparedNotification[]>(() => {
    if (!session) return []
    return highRiskStudents
      .filter((student) => selectedRiskStudents.has(student.id))
      .map((student) =>
        buildRiskNotification({
          session,
          studentName: student.name,
          parentPhone: whatsAppRecipient.trim() || student.parentPhone
        })
      )
  }, [highRiskStudents, session, selectedRiskStudents, whatsAppRecipient])

  const notifications = useMemo<PreparedNotification[]>(
    () => [...absenceNotifications, ...riskNotifications],
    [absenceNotifications, riskNotifications]
  )

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: status
    }))
    setSelectedAbsentStudents((prev) => {
      const next = new Set(prev)
      if (status === 'absent') {
        next.add(studentId)
      } else {
        next.delete(studentId)
      }
      return next
    })
  }

  const toggleRiskSelected = (studentId: string) => {
    setSelectedRiskStudents((prev) => {
      const next = new Set(prev)
      if (next.has(studentId)) {
        next.delete(studentId)
      } else {
        next.add(studentId)
      }
      return next
    })
  }

  const toggleAbsentSelected = (studentId: string) => {
    setSelectedAbsentStudents((prev) => {
      const next = new Set(prev)
      if (next.has(studentId)) {
        next.delete(studentId)
      } else {
        next.add(studentId)
      }
      return next
    })
  }

  const applyBulkStatus = (status: AttendanceStatus) => {
    if (!session) return
    const next: Record<string, AttendanceStatus> = {}
    const nextSelected = new Set<string>()
    session.students.forEach((student) => {
      next[student.id] = status
      if (status === 'absent') {
        nextSelected.add(student.id)
      }
    })
    setMarks(next)
    setSelectedAbsentStudents(nextSelected)
  }

  const handleSave = async () => {
    if (!session || !user) return
    await Promise.all(
      session.students.map((student) =>
        saveAttendanceLocally({
          tenantId,
          sessionId: session.sessionId,
          subjectId: session.subjectId,
          facultyId: user.id,
          studentId: student.id,
          status: statusByStudent.get(student.id) ?? 'present'
        })
      )
    )
    await requestBackgroundSync()
  }

  const allSelected =
    absentStudents.length > 0 &&
    absentStudents.every((student) => selectedAbsentStudents.has(student.id))

  const allRiskSelected =
    highRiskStudents.length > 0 &&
    highRiskStudents.every((student) => selectedRiskStudents.has(student.id))

  const toggleAllSelected = () => {
    if (allSelected) {
      setSelectedAbsentStudents(new Set())
      return
    }
    const next = new Set(selectedAbsentStudents)
    absentStudents.forEach((student) => next.add(student.id))
    setSelectedAbsentStudents(next)
  }

  const toggleAllRiskSelected = () => {
    if (allRiskSelected) {
      setSelectedRiskStudents(new Set())
      return
    }
    const next = new Set(selectedRiskStudents)
    highRiskStudents.forEach((student) => next.add(student.id))
    setSelectedRiskStudents(next)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-600">Loading roster and local queue…</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          No active session
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          When timetable data syncs next, your upcoming class will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">
          {session.subjectName} — {session.batchName}
        </h1>
        <p className="text-sm text-slate-600">
          Queue: {queueSummary.pending} pending · {queueSummary.failed} failed ·{' '}
          {queueSummary.synced} synced
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 sm:text-sm">
        <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
          WhatsApp messaging setup
        </h2>
        <p className="mt-1">
          Messages open in WhatsApp using the official college number{' '}
          <span className="font-semibold text-primary">{tenant.whatsappSenderNumber}</span>.
          Lecturers can set or change the recipient (parent/guardian) number for this class below.
        </p>
        <label className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Recipient WhatsApp number
          </span>
          <input
            value={whatsAppRecipient}
            onChange={(event) => setWhatsAppRecipient(event.target.value)}
            placeholder="e.g. +91 98765 43210"
            className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>
        <p className="mt-2 text-xs text-slate-500">
          Leave blank to use the student’s stored parent number. Update this when you need to direct messages to a different guardian contact.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => applyBulkStatus('present')}
          className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-success hover:text-success focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Mark all Present
        </button>
        <button
          type="button"
          onClick={() => applyBulkStatus('absent')}
          className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-danger hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Mark all Absent
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Save session (offline)
        </button>
        <button
          type="button"
          onClick={() => setNotifyOpen(true)}
          disabled={notifications.length === 0}
          className="rounded-full border border-primary px-4 py-2 text-xs font-semibold text-primary transition disabled:border-slate-200 disabled:text-slate-400 hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Notify Parents (WhatsApp)
        </button>
      </div>

      {highRiskStudents.length ? (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-xs text-warning sm:text-sm">
          Predicted high-risk students flagged: {highRiskStudents.length}. Use{' '}
          <span className="font-semibold">Prepare alert</span> to confirm proactive WhatsApp
          notifications before the session.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Select</th>
              <th className="px-4 py-3 text-left">Roll</th>
              <th className="px-4 py-3 text-left">Student</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Risk</th>
              <th className="px-4 py-3 text-left">Sync</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {session.students.map((student) => (
              <StudentRow
                key={student.id}
                student={student}
                status={statusByStudent.get(student.id) ?? 'present'}
                onStatusChange={handleStatusChange}
                absentSelected={selectedAbsentStudents.has(student.id)}
                toggleAbsentSelected={toggleAbsentSelected}
                riskSelected={selectedRiskStudents.has(student.id)}
                toggleRiskSelected={toggleRiskSelected}
                syncStatus={queueByStudent.get(student.id) ?? 'pending'}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p>
            Absent selected: {selectedAbsentStudents.size} of {absentStudents.length}.{' '}
            <button
              type="button"
              onClick={toggleAllSelected}
              className="font-semibold text-primary underline underline-offset-2"
            >
              {allSelected ? 'Clear absent selection' : 'Select all absent'}
            </button>
          </p>
          <p>
            High-risk alerts ready: {selectedRiskStudents.size} of {highRiskStudents.length}.
            {highRiskStudents.length ? (
              <button
                type="button"
                onClick={toggleAllRiskSelected}
                className="ml-2 font-semibold text-primary underline underline-offset-2"
              >
                {allRiskSelected ? 'Clear high-risk alerts' : 'Select all high-risk'}
              </button>
            ) : null}
          </p>
        </div>
        <p>Offline queue auto-syncs when back online.</p>
      </div>

      <NotifyParentsModal
        open={isNotifyOpen}
        onClose={() => setNotifyOpen(false)}
        notifications={notifications}
        senderNumber={tenant.whatsappSenderNumber}
        recipientOverride={whatsAppRecipient}
      />
    </div>
  )
}

interface StudentRowProps {
  student: AttendanceStudent
  status: AttendanceStatus
  onStatusChange: (studentId: string, status: AttendanceStatus) => void
  absentSelected: boolean
  toggleAbsentSelected: (studentId: string) => void
  riskSelected: boolean
  toggleRiskSelected: (studentId: string) => void
  syncStatus: string
}

const StudentRow = ({
  student,
  status,
  onStatusChange,
  absentSelected,
  toggleAbsentSelected,
  riskSelected,
  toggleRiskSelected,
  syncStatus
}: StudentRowProps) => {
  const statusLabel = {
    present: 'Present',
    absent: 'Absent',
    late: 'Late'
  }

  const syncBadgeMap = {
    pending: 'Pending',
    synced: 'Synced',
    failed: 'Retry'
  } as const

  const syncBadge =
    syncBadgeMap[syncStatus as keyof typeof syncBadgeMap] ?? 'Pending'

  const syncStyles =
    syncStatus === 'synced'
      ? 'bg-success/20 text-success border-success/20'
      : syncStatus === 'failed'
        ? 'bg-danger/10 text-danger border-danger/20'
        : 'bg-warning/10 text-warning border-warning/20'

  const riskLevel = student.riskLevel ?? 'low'
  const riskStyles =
    riskLevel === 'high'
      ? 'bg-danger/10 text-danger border-danger/20'
      : riskLevel === 'medium'
        ? 'bg-warning/10 text-warning border-warning/20'
        : 'bg-success/10 text-success border-success/20'

  const riskLabel =
    riskLevel === 'high' ? 'High risk' : riskLevel === 'medium' ? 'Medium risk' : 'Low risk'

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={absentSelected}
          onChange={() => toggleAbsentSelected(student.id)}
          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/40"
          aria-label={`Select ${student.name}`}
        />
      </td>
      <td className="px-4 py-3 font-mono text-xs text-slate-500">
        {student.rollNumber}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-slate-800">
        {student.name}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          {statusOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onStatusChange(student.id, option)}
              className={[
                'rounded-full px-3 py-1 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                option === status
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-primary/10'
              ].join(' ')}
            >
              {statusLabel[option]}
            </button>
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${riskStyles}`}
          >
            {riskLabel}
          </span>
          {riskLevel === 'high' ? (
            <button
              type="button"
              onClick={() => toggleRiskSelected(student.id)}
              className={[
                'rounded-full px-3 py-1 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                riskSelected
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-primary text-primary hover:bg-primary/10'
              ].join(' ')}
            >
              {riskSelected ? 'Alert ready' : 'Prepare alert'}
            </button>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${syncStyles}`}
        >
          {syncBadge}
        </span>
      </td>
    </tr>
  )
}

