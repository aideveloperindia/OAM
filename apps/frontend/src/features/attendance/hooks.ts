import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../services/api-client'
import { nowIsoUtc } from '../../lib/date'
import { generateLocalId } from '../../lib/id'
import { db } from '../../data/db'
import type { TenantKey } from '../../data/tenants'
import { TENANTS } from '../../data/tenants'
import type { AttendanceStatus, QueuedAttendance } from '../../data/db'
import type { AttendanceSession } from './types'

const rosterCacheId = (tenantId: TenantKey, sessionId: string) =>
  `${tenantId}::${sessionId}`

export const useQueuedAttendance = (tenantId: TenantKey) => {
  return useLiveQuery(
    () =>
      db.queuedAttendance
        .where('tenantId')
        .equals(tenantId)
        .reverse()
        .sortBy('capturedAt'),
    [tenantId],
    []
  )
}

export const useActiveAttendanceSession = (tenantId: TenantKey) => {
  return useQuery({
    queryKey: ['attendance-session', tenantId],
    queryFn: async () => {
      try {
        const response = await apiClient.get<AttendanceSession>(
          `/faculty/session/active`,
          {
            params: { tenantId }
          }
        )
        const session = response.data
        await db.rosterCache.put({
          id: rosterCacheId(tenantId, session.sessionId),
          tenantId,
          subjectId: session.subjectId,
          batchId: session.batchId,
          updatedAt: nowIsoUtc(),
          students: session.students
        })
        return session
      } catch (error) {
        const cached = await db.rosterCache
          .where('tenantId')
          .equals(tenantId)
          .last()
        if (cached) {
          return {
            sessionId: 'offline-session',
            subjectId: cached.subjectId,
            subjectName: 'Offline session',
            batchId: cached.batchId,
            batchName: 'Offline batch',
            scheduledAt: nowIsoUtc(),
            facultyId: 'offline',
            facultyName: 'Offline capture',
            students: cached.students
          }
        }
        const tenant = TENANTS[tenantId]
        if (tenant?.demoRoster?.length) {
          const demoSessionId = `demo-session-${tenantId}`
          const demoSubjectId = tenantId === 'scit' ? 'scit-demo-subject' : 'scee-demo-subject'
          const demoSubjectName =
            tenantId === 'scit'
              ? 'Applied Machine Intelligence (Demo)'
              : 'Structural Analysis (Demo)'
          const demoBatchId = tenantId === 'scit' ? 'scit-demo-batch' : 'scee-demo-batch'
          const demoBatchName =
            tenantId === 'scit' ? 'SCIT Year 2 Section B (Demo)' : 'SCEE Year 3 Section A (Demo)'

          await db.rosterCache.put({
            id: rosterCacheId(tenantId, demoSessionId),
            tenantId,
            subjectId: demoSubjectId,
            batchId: demoBatchId,
            updatedAt: nowIsoUtc(),
            students: tenant.demoRoster
          })

          return {
            sessionId: demoSessionId,
            subjectId: demoSubjectId,
            subjectName: demoSubjectName,
            batchId: demoBatchId,
            batchName: demoBatchName,
            scheduledAt: nowIsoUtc(),
            facultyId: `faculty-${tenantId}`,
            facultyName: tenantId === 'scit' ? 'Dr. Anusha Priya' : 'Prof. Sai Teja',
            students: tenant.demoRoster
          }
        }
        throw error
      }
    },
    gcTime: 10 * 60 * 1000,
    retry: 1
  })
}

export const saveAttendanceLocally = async ({
  tenantId,
  sessionId,
  subjectId,
  facultyId,
  studentId,
  status,
  note
}: {
  tenantId: TenantKey
  sessionId: string
  subjectId: string
  facultyId: string
  studentId: string
  status: AttendanceStatus
  note?: string
}) => {
  const localId = generateLocalId()
  const record: QueuedAttendance = {
    localId,
    tenantId,
    facultyId,
    subjectId,
    scheduleEntryId: sessionId,
    capturedAt: nowIsoUtc(),
    status,
    studentId,
    payload: { note },
    syncStatus: 'pending'
  }
  await db.queuedAttendance.put(record)
  return record
}

export const markQueuedAsSynced = async (
  localId: string,
  status: 'synced' | 'failed'
) => {
  await db.queuedAttendance.update(localId, {
    syncStatus: status,
    lastAttemptAt: nowIsoUtc()
  })
}

export const clearSyncedQueue = async (tenantId: TenantKey) => {
  await db.queuedAttendance
    .where({
      tenantId,
      syncStatus: 'synced'
    })
    .delete()
}

export const useQueueSummary = (tenantId: TenantKey) => {
  const queue = useQueuedAttendance(tenantId)
  return useMemo(() => {
    const pending = queue?.filter((item) => item.syncStatus === 'pending').length ?? 0
    const failed = queue?.filter((item) => item.syncStatus === 'failed').length ?? 0
    const synced = queue?.filter((item) => item.syncStatus === 'synced').length ?? 0
    return { pending, failed, synced, total: queue?.length ?? 0 }
  }, [queue])
}

export const BACKGROUND_SYNC_TAG = 'oam-attendance-sync'

interface BulkSyncResponseItem {
  localId: string
  status: 'synced' | 'failed'
  attendanceId?: string
  conflict?: boolean
  message?: string
}

export const triggerManualSync = async (tenantId: TenantKey) => {
  const records = await db.queuedAttendance.where('tenantId').equals(tenantId).toArray()
  if (records.length === 0) {
    return { total: 0, succeeded: 0, failed: 0 }
  }

  const payload = records.map((item) => ({
    localId: item.localId,
    tenantId: item.tenantId,
    facultyId: item.facultyId,
    subjectId: item.subjectId,
    scheduleEntryId: item.scheduleEntryId,
    capturedAt: item.capturedAt,
    status: item.status,
    studentId: item.studentId,
    payload: item.payload
  }))

  const response = await apiClient.post<{
    results: BulkSyncResponseItem[]
  }>('/attendance/bulk', {
    records: payload
  })

  const results: BulkSyncResponseItem[] =
    Array.isArray(response.data?.results) ? response.data.results : []

  let succeeded = 0
  let failed = 0

  const resultsByLocalId = new Map(results.map((item) => [item.localId, item]))

  await Promise.all(
    records.map(async (record) => {
      const result = resultsByLocalId.get(record.localId)
      const status = result?.status === 'synced' ? 'synced' : 'failed'
      if (status === 'synced') {
        succeeded += 1
      } else {
        failed += 1
      }
      await markQueuedAsSynced(record.localId, status)
    })
  )

  return { total: records.length, succeeded, failed }
}

export const requestBackgroundSync = async () => {
  if (!('serviceWorker' in navigator)) return
  if (!('SyncManager' in window)) return

  try {
    const registration = await navigator.serviceWorker.ready
    const extendedRegistration = registration as ServiceWorkerRegistration & {
      sync?: SyncManager
    }
    if (extendedRegistration.sync) {
      await extendedRegistration.sync.register(BACKGROUND_SYNC_TAG)
    }
  } catch (error) {
    console.warn('Background sync registration failed', error)
  }
}

