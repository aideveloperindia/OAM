import Dexie from 'dexie'
import type { Table } from 'dexie'
import type { TenantKey } from './tenants'

export type AttendanceStatus = 'present' | 'absent' | 'late'

export interface QueuedAttendance {
  localId: string
  tenantId: TenantKey
  facultyId: string
  subjectId: string
  scheduleEntryId: string
  capturedAt: string
  status: AttendanceStatus
  studentId: string
  payload: Record<string, unknown>
  syncStatus: 'pending' | 'synced' | 'failed'
  lastAttemptAt?: string
}

export interface RosterCache {
  id: string
  tenantId: TenantKey
  subjectId: string
  batchId: string
  updatedAt: string
  students: Array<{
    id: string
    rollNumber: string
    name: string
    parentPhone: string
    parentName?: string
      riskLevel?: 'low' | 'medium' | 'high'
  }>
}

export interface TenantSetting {
  tenantId: TenantKey
  lastSyncAt?: string
  lastSeenVersion?: string
}

export interface SyncEvent {
  id?: number
  tenantId: TenantKey
  startedAt: string
  finishedAt?: string
  status: 'pending' | 'success' | 'error'
  errorMessage?: string
  processed?: number
  succeeded?: number
  failed?: number
}

class CollegeAttendDB extends Dexie {
  queuedAttendance!: Table<QueuedAttendance, string>
  rosterCache!: Table<RosterCache, string>
  tenantSettings!: Table<TenantSetting, TenantKey>
  syncEvents!: Table<SyncEvent, number>

  constructor() {
    super('CollegeAttendDB')
    this.version(1).stores({
      queuedAttendance: '&localId, tenantId, syncStatus, capturedAt',
      rosterCache: '&id, tenantId, subjectId, batchId',
      tenantSettings: '&tenantId',
      syncEvents: '++id, tenantId, status, startedAt'
    })
  }
}

export const db = new CollegeAttendDB()

