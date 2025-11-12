import { describe, expect, it, beforeEach, vi } from 'vitest'
vi.mock('@prisma/client', () => ({
  AttendanceStatus: {
    PRESENT: 'PRESENT',
    ABSENT: 'ABSENT',
    LATE: 'LATE'
  },
  AuditAction: {
    CREATED: 'CREATED',
    UPDATED: 'UPDATED',
    CONFLICT: 'CONFLICT'
  }
}))
import {
  getActiveSessionForFaculty,
  processBulkAttendance
} from '../attendance.service'

const mockPrisma = vi.hoisted(() => ({
  scheduleEntry: {
    findFirst: vi.fn()
  },
  enrollment: {
    findMany: vi.fn(),
    findFirst: vi.fn()
  },
  attendance: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn()
  },
  attendanceAudit: {
    create: vi.fn()
  },
  $transaction: vi.fn()
}))

vi.mock('../../../config/prisma', () => ({
  prisma: mockPrisma
}))

describe('attendance.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => unknown) =>
      callback(mockPrisma)
    )
    mockPrisma.attendance.findMany.mockResolvedValue([])
  })

  it('builds active session payload with sorted roster', async () => {
    mockPrisma.scheduleEntry.findFirst.mockResolvedValue({
      id: 'session-1',
      tenantId: 'scee',
      subjectId: 'subject-1',
      batchId: 'batch-1',
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 3600000),
      subject: {
        id: 'subject-1',
        name: 'Engineering Mathematics'
      },
      batch: {
        id: 'batch-1',
        name: 'Batch A'
      },
      faculty: {
        id: 'faculty-1',
        name: 'Prof. Rao'
      }
    })

    mockPrisma.enrollment.findMany.mockResolvedValue([
      {
        studentId: 'student-2',
        student: {
          id: 'student-2',
          name: 'Arjun',
          rollNumber: 'S002',
          parentPhone: '+919999000002',
          parentName: 'Parent 2'
        }
      },
      {
        studentId: 'student-1',
        student: {
          id: 'student-1',
          name: 'Divya',
          rollNumber: 'S001',
          parentPhone: '+919999000001',
          parentName: 'Parent 1'
        }
      }
    ])

    const session = await getActiveSessionForFaculty('scee', 'faculty-1')

    expect(session?.sessionId).toBe('session-1')
    expect(session?.students.map((s) => s.rollNumber)).toEqual(['S001', 'S002'])
    expect(session?.students.every((s) => s.riskLevel === 'low')).toBe(true)
  })

  it('processes new attendance record and returns sync result', async () => {
    mockPrisma.scheduleEntry.findFirst.mockResolvedValue({
      id: 'session-1',
      tenantId: 'scee',
      subjectId: 'subject-1',
      batchId: 'batch-1',
      facultyId: 'faculty-1',
      subject: { id: 'subject-1', name: 'Engineering Mathematics' },
      batch: { id: 'batch-1', name: 'Batch A' }
    })
    mockPrisma.enrollment.findFirst.mockResolvedValue({
      id: 'enroll-1'
    })
    mockPrisma.attendance.findUnique.mockResolvedValue(null)
    mockPrisma.attendance.create.mockResolvedValue({
      id: 'attendance-1'
    })

    const result = await processBulkAttendance({
      tenantId: 'scee',
      facultyId: 'faculty-1',
      records: [
        {
          localId: 'local-1',
          scheduleEntryId: 'session-1',
          studentId: 'student-1',
          capturedAt: new Date().toISOString(),
          status: 'present'
        }
      ]
    })

    expect(result).toEqual([
      expect.objectContaining({
        localId: 'local-1',
        status: 'synced',
        attendanceId: 'attendance-1'
      })
    ])
    expect(mockPrisma.attendanceAudit.create).toHaveBeenCalledTimes(1)
  })
})


