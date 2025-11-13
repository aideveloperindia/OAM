import { useEffect, useMemo, useState } from 'react'
import {
  useActiveAttendanceSession,
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

export const ClassAttendancePage = () => {
  const { tenantId, tenant } = useTenant()
  const senderNumber = tenant?.whatsappSenderNumber ?? ''
  const { user } = useAuth()
  const { data: session, isLoading } = useActiveAttendanceSession(tenantId)
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
    if (!session) {
      setMarks({})
      setSelectedAbsentStudents(new Set())
      setSelectedRiskStudents(new Set())
      return
    }
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
    queue.forEach((item) => {
      map.set(item.studentId, item.syncStatus)
    })
    return map
  }, [queue])

  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    setMarks((prev) => ({ ...prev, [studentId]: newStatus }))
    if (newStatus === 'absent') {
      setSelectedAbsentStudents((prev) => new Set(prev).add(studentId))
    } else {
      setSelectedAbsentStudents((prev) => {
        const next = new Set(prev)
        next.delete(studentId)
        return next
      })
    }
  }

  const handleMarkAll = (status: AttendanceStatus) => {
    if (!session) return
    const updated: Record<string, AttendanceStatus> = {}
    session.students.forEach((student) => {
      updated[student.id] = status
    })
    setMarks(updated)
    if (status === 'absent') {
      setSelectedAbsentStudents(new Set(session.students.map((s) => s.id)))
    } else {
      setSelectedAbsentStudents(new Set())
    }
  }

  const handleSaveSession = async () => {
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
    alert('Session saved locally. Will sync when online.')
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

  const absentStudents = useMemo(
    () =>
      session?.students.filter(
        (student) => statusByStudent.get(student.id) === 'absent'
      ) ?? [],
    [session, statusByStudent]
  )

  const highRiskStudents = useMemo(
    () => session?.students.filter((student) => student.riskLevel === 'high') ?? [],
    [session]
  )

  const allSelected =
    absentStudents.length > 0 &&
    absentStudents.every((student) => selectedAbsentStudents.has(student.id))

  const toggleAllSelected = () => {
    if (allSelected) {
      setSelectedAbsentStudents(new Set())
    } else {
      setSelectedAbsentStudents(new Set(absentStudents.map((s) => s.id)))
    }
  }

  const allRiskSelected =
    highRiskStudents.length > 0 &&
    highRiskStudents.every((student) => selectedRiskStudents.has(student.id))

  const toggleAllRiskSelected = () => {
    if (allRiskSelected) {
      setSelectedRiskStudents(new Set())
    } else {
      setSelectedRiskStudents(new Set(highRiskStudents.map((s) => s.id)))
    }
  }

  const absenceNotifications: PreparedNotification[] = useMemo(() => {
    if (!session) return []
    return Array.from(selectedAbsentStudents)
      .map((studentId) => {
        const student = session.students.find((s) => s.id === studentId)
        if (!student) return null
        return buildAbsenceNotification({
          session,
          studentName: student.name,
          rollNumber: student.rollNumber,
          parentPhone: whatsAppRecipient.trim() || student.parentPhone
        })
      })
      .filter((n): n is PreparedNotification => n !== null)
  }, [selectedAbsentStudents, session, whatsAppRecipient])

  const riskNotifications: PreparedNotification[] = useMemo(() => {
    if (!session) return []
    return Array.from(selectedRiskStudents)
      .map((studentId) => {
        const student = session.students.find((s) => s.id === studentId)
        if (!student || student.riskLevel !== 'high') return null
        return buildRiskNotification({
          session,
          studentName: student.name,
          parentPhone: whatsAppRecipient.trim() || student.parentPhone
        })
      })
      .filter((n): n is PreparedNotification => n !== null)
  }, [selectedRiskStudents, session, whatsAppRecipient])

  const allNotifications = [...absenceNotifications, ...riskNotifications]

  if (isLoading) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-600">
          Loading today's class schedule and student rosters…
        </p>
      </section>
    )
  }

  if (!session) {
    return (
      <section className="mx-auto max-w-md rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">
          No active class right now
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          The system shows classes scheduled for the current hour. Check back when your next session begins.
        </p>
      </section>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-primary-dark">
          Class Attendance
        </p>
        <h1 className="text-xl font-semibold text-slate-900">
          {session.subjectName} — {session.batchName}
        </h1>
        <p className="text-sm text-slate-600">
          Faculty: {session.facultyName}. Total students: {session.students.length}.
          Everyone starts as Present; toggle only the absentees.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleMarkAll('present')}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
        >
          Mark all Present
        </button>
        <button
          type="button"
          onClick={() => handleMarkAll('absent')}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-danger hover:text-danger"
        >
          Mark all Absent
        </button>
        <button
          type="button"
          onClick={handleSaveSession}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          Save session (offline)
        </button>
        <button
          type="button"
          onClick={() => setNotifyOpen(true)}
          disabled={allNotifications.length === 0}
          className="rounded-full border border-primary bg-white px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Notify Parents ({allNotifications.length})
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-1 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">
                  <span className="sr-only">Select for notification</span>
                </th>
                <th className="px-4 py-3">Roll</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Sync</th>
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
        notifications={senderNumber ? allNotifications : []}
        senderNumber={senderNumber || 'Sender number not configured'}
        recipientOverride={whatsAppRecipient}
      />
    </div>
  )
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
}: {
  student: AttendanceStudent
  status: AttendanceStatus
  onStatusChange: (studentId: string, newStatus: AttendanceStatus) => void
  absentSelected: boolean
  toggleAbsentSelected: (studentId: string) => void
  riskSelected: boolean
  toggleRiskSelected: (studentId: string) => void
  syncStatus: string
}) => {
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
          checked={absentSelected || riskSelected}
          onChange={() => {
            if (status === 'absent') {
              toggleAbsentSelected(student.id)
            } else if (riskLevel === 'high') {
              toggleRiskSelected(student.id)
            }
          }}
          disabled={status !== 'absent' && riskLevel !== 'high'}
          className="h-4 w-4 rounded border-slate-300 text-primary transition focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-30"
        />
      </td>
      <td className="px-4 py-3 font-mono text-xs text-slate-600">
        {student.rollNumber}
      </td>
      <td className="px-4 py-3 font-medium text-slate-900">{student.name}</td>
      <td className="px-4 py-3">
        <select
          value={status}
          onChange={(e) =>
            onStatusChange(student.id, e.target.value as AttendanceStatus)
          }
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary"
        >
          {statusOptions.map((opt) => (
            <option key={opt} value={opt}>
              {statusLabel[opt]}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${riskStyles}`}
        >
          {riskLabel}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${syncStyles}`}
        >
          {syncBadge}
        </span>
      </td>
    </tr>
  )
}


