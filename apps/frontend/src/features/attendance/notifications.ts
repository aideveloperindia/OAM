import type { AttendanceSession, PreparedNotification } from './types'
import { formatDisplayDate } from '../../lib/date'

const absenceTemplate =
  'Your ward, <StudentName> (Roll <RollNo>), was absent for <Subject> on <DD-MMM-YYYY>. Please inform the college if this is expected. — SCIT Attendance'

const riskTemplate =
  'Dear Parent, our system indicates <StudentName> may not attend <Subject> today (high risk). Kindly check and inform us. — SCIT Attendance'

export const buildAbsenceNotification = ({
  session,
  studentName,
  rollNumber,
  parentPhone
}: {
  session: AttendanceSession
  studentName: string
  rollNumber: string
  parentPhone: string
}): PreparedNotification => ({
  studentName,
  rollNumber,
  parentPhone,
  type: 'absence',
  message: fillTemplate(absenceTemplate, {
    StudentName: studentName,
    RollNo: rollNumber,
    Subject: session.subjectName,
    'DD-MMM-YYYY': formatDisplayDate(session.scheduledAt)
  })
})

export const buildRiskNotification = ({
  session,
  studentName,
  parentPhone
}: {
  session: AttendanceSession
  studentName: string
  parentPhone: string
}): PreparedNotification => ({
  studentName,
  rollNumber: '',
  parentPhone,
  type: 'predicted-risk',
  message: fillTemplate(riskTemplate, {
    StudentName: studentName,
    Subject: session.subjectName
  })
})

const fillTemplate = (
  template: string,
  values: Record<string, string>
): string => {
  return Object.entries(values).reduce(
    (output, [token, value]) =>
      output.replaceAll(`<${token}>`, value ?? ''),
    template
  )
}

