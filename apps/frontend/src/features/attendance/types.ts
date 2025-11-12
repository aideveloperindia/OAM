import type { AttendanceStatus } from '../../data/db'

export interface AttendanceStudent {
  id: string
  rollNumber: string
  name: string
  parentPhone: string
  parentName?: string
  riskLevel?: 'low' | 'medium' | 'high'
}

export interface AttendanceSession {
  sessionId: string
  subjectId: string
  subjectName: string
  batchId: string
  batchName: string
  scheduledAt: string
  facultyId: string
  facultyName: string
  students: AttendanceStudent[]
}

export interface AttendanceMarking {
  studentId: string
  status: AttendanceStatus
  note?: string
}

export interface PreparedNotification {
  studentName: string
  rollNumber: string
  parentPhone: string
  message: string
  type: 'absence' | 'predicted-risk'
}

