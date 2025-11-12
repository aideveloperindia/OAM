import { describe, expect, it } from 'vitest'
import { buildAbsenceNotification, buildRiskNotification } from '../notifications'
import type { AttendanceSession } from '../types'

const mockSession: AttendanceSession = {
  sessionId: 'session-1',
  subjectId: 'subject-1',
  subjectName: 'Applied Machine Intelligence',
  batchId: 'batch-1',
  batchName: 'SCIT Year 2 Section B',
  scheduledAt: '2025-11-11T09:00:00.000Z',
  facultyId: 'faculty-1',
  facultyName: 'Prof. Sai Teja',
  students: []
}

describe('attendance notifications', () => {
  it('builds absence notification with formatted date', () => {
    const notification = buildAbsenceNotification({
      session: mockSession,
      studentName: 'Navya',
      rollNumber: 'AI2201',
      parentPhone: '+919000011111'
    })

    expect(notification.type).toBe('absence')
    expect(notification.message).toContain('Navya')
    expect(notification.message).toContain('Roll AI2201')
    expect(notification.message).toMatch(/11-Nov-2025/)
  })

  it('builds predicted high-risk notification', () => {
    const notification = buildRiskNotification({
      session: mockSession,
      studentName: 'Mahesh',
      parentPhone: '+919000022222'
    })

    expect(notification.type).toBe('predicted-risk')
    expect(notification.rollNumber).toBe('')
    expect(notification.message).toContain('may not attend Applied Machine Intelligence today')
  })
})


