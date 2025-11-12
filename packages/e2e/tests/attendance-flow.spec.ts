import { expect, test } from '@playwright/test'

const API_BASE = 'http://localhost:4000/api/v1'

test.describe('CollegeAttend offline-first workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${API_BASE}/auth/login`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user-admin-1',
            name: 'Automation Admin',
            email: 'automation@scee.edu.in',
            role: 'admin',
            tenantId: 'scee'
          },
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 900
        })
      })
    })

    await page.route('**/api/v1/faculty/session/active**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: 'session-1',
          subjectId: 'subject-1',
          subjectName: 'Applied Machine Intelligence',
          batchId: 'batch-1',
          batchName: 'SCIT Year 2 Section B',
          scheduledAt: new Date().toISOString(),
          facultyId: 'user-admin-1',
          facultyName: 'Automation Admin',
          students: [
            {
              id: 'stud-1',
              rollNumber: 'AI2201',
              name: 'Navya',
              parentPhone: '+919000011111',
              parentName: 'Divya',
              riskLevel: 'high'
            },
            {
              id: 'stud-2',
              rollNumber: 'AI2202',
              name: 'Mahesh',
              parentPhone: '+919000022222',
              parentName: 'Rekha',
              riskLevel: 'low'
            }
          ]
        })
      })
    })

    await page.route(`${API_BASE}/attendance/bulk`, async (route) => {
      const request = await route.request().postDataJSON()
      const results = request.records.map((record: { localId: string }) => ({
        localId: record.localId,
        status: 'synced',
        attendanceId: `att-${record.localId}`,
        conflict: false
      }))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results })
      })
    })

    await page.route('**/api/v1/admin/reports/attendance**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          aggregates: [
            {
              subjectId: 'subject-1',
              subjectName: 'Applied Machine Intelligence',
              batchId: 'batch-1',
              batchName: 'SCIT Year 2 Section B',
              date: new Date().toISOString(),
              present: 42,
              absent: 3,
              late: 1,
              syncedAt: new Date().toISOString()
            }
          ],
          exports: {
            csvAvailable: true
          }
        })
      })
    })

    await page.route('**/api/v1/admin/reports/attendance/export**', async (route) => {
        const csv = 'Subject ID,Subject,Batch ID,Batch,Date,Present,Absent,Late,Last Synced\n' +
          'subject-1,Applied Machine Intelligence,batch-1,SCIT Year 2 Section B,2025-11-11T10:00:00Z,42,3,1,2025-11-11T10:05:00Z'
        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="attendance_subject-1.csv"'
          },
          body: csv
        })
    })

    await page.route(new RegExp(`${API_BASE}/student/dashboard\\?.*`), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          studentName: 'Navya',
          rollNumber: 'AI2201',
          overallPercentage: 88,
          summaries: [],
          upcomingSessions: [],
          syncStatus: {
            pendingCount: 0
          }
        })
      })
    })
  })

  test('login, offline capture, sync, admin export, and WhatsApp notify', async ({
    page,
    context
  }) => {
    await page.goto('/app/login')
    await page.evaluate(() => {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('CollegeAttendDB')
        request.onupgradeneeded = () => {
          const db = request.result
          if (!db.objectStoreNames.contains('queuedAttendance')) {
            const store = db.createObjectStore('queuedAttendance', { keyPath: 'localId' })
            store.createIndex('tenantId', 'tenantId')
            store.createIndex('syncStatus', 'syncStatus')
            store.createIndex('capturedAt', 'capturedAt')
          }
          if (!db.objectStoreNames.contains('rosterCache')) {
            const store = db.createObjectStore('rosterCache', { keyPath: 'id' })
            store.createIndex('tenantId', 'tenantId')
            store.createIndex('subjectId', 'subjectId')
            store.createIndex('batchId', 'batchId')
          }
          if (!db.objectStoreNames.contains('tenantSettings')) {
            db.createObjectStore('tenantSettings', { keyPath: 'tenantId' })
          }
          if (!db.objectStoreNames.contains('syncEvents')) {
            db.createObjectStore('syncEvents', { keyPath: 'id', autoIncrement: true })
          }
        }
        request.onsuccess = () => {
          const db = request.result
          const tx = db.transaction(['rosterCache'], 'readwrite')
          tx.objectStore('rosterCache').put({
            id: 'scee::offline-seed',
            tenantId: 'scee',
            subjectId: 'subject-1',
            batchId: 'batch-1',
            updatedAt: new Date().toISOString(),
            students: [
              {
                id: 'stud-1',
                rollNumber: 'AI2201',
                name: 'Navya',
                parentPhone: '+919000011111',
                parentName: 'Divya',
                riskLevel: 'high'
              },
              {
                id: 'stud-2',
                rollNumber: 'AI2202',
                name: 'Mahesh',
                parentPhone: '+919000022222',
                parentName: 'Rekha',
                riskLevel: 'low'
              }
            ]
          })
          tx.oncomplete = () => resolve()
          tx.onerror = () => reject(tx.error ?? new Error('Failed to seed roster cache'))
        }
        request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'))
      })
    })

    await page.getByLabel('Email').fill('automation@scee.edu.in')
    await page.getByLabel('Password').fill('TestPassword1!')
    await page.getByRole('button', { name: 'Sign In' }).click()

    await expect(page).toHaveURL(/app\/faculty\/attendance/)
    const rosterRow = page.locator('tbody tr').first()
    await expect(rosterRow).toBeVisible({ timeout: 20000 })

    await rosterRow.getByRole('button', { name: 'Absent' }).click()

    await context.setOffline(true)
    await page.getByRole('button', { name: 'Save session (offline)' }).click()

    await expect
      .poll(async () => {
        const text = await page.locator('header').filter({ hasText: 'Queue:' }).innerText()
        return text
      })
      .not.toContain('0 pending')

    await page.getByRole('button', { name: 'Notify Parents (WhatsApp)' }).click()
    const modal = page.getByRole('dialog', { name: 'Notify Parents (WhatsApp)' })
    await expect(modal.getByText('Predicted high-risk alert')).toBeVisible()
    await expect(modal.getByRole('link', { name: 'Open WhatsApp' }).first()).toHaveAttribute(
      'href',
      /wa\.me/
    )
    await modal.getByRole('button', { name: 'Close' }).click()

    await context.setOffline(false)

    await page.getByRole('link', { name: 'Sync Monitor' }).click()
    await page.getByRole('button', { name: 'Sync now' }).click()
    await expect(page.getByText(/Synced .* attendance records successfully/)).toBeVisible()

    await page.getByRole('link', { name: 'Admin Reports' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Apply filters' }).click()
    await expect(page.getByText('Applied Machine Intelligence')).toBeVisible()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export CSV' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('attendance_subject-1.csv')
  })
})

