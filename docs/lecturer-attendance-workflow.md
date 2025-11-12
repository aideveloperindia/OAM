# Lecturer Attendance Workflow

## 1. Class Attendance (Online & Offline)
- Designed for a 4,000-student rollout. Lecturers sign in once per device; the app keeps them logged in for 30 days.
- The dashboard jumps straight to today’s timetable with the current period and subject.
- Student rosters load instantly. Everyone defaults to **Present**, so lecturers only flip toggles for absentees or late arrivals.
- Tap **Save session**. When online, records post to the API immediately; when offline, they stay queued locally until sync.

## 2. Offline Behaviour
- The PWA caches rosters in IndexedDB (`CollegeAttendDB.rosterCache`).
- Unsynced marks are stored in `CollegeAttendDB.queuedAttendance`, including date, subject, and lecturer ID.
- The Sync Monitor screen shows pending uploads. Once back online, the app syncs automatically or on demand via **Sync now**.

## 3. Device Flexibility
- The interface is fully responsive; lecturers can use personal phones, tablets, or staff-room kiosks.
- Tenant selection (SCEE/SCIT) persists per device, so lecturers see only their campus data.
- Add-to-home-screen installs the PWA for quick launch and background sync permissions.

## 4. Guardian Notifications
- After marking absentees, lecturers can open **Notify Parents** to generate WhatsApp click-to-chat links or queue SMS alerts.
- WhatsApp launches from the official SCIT sender account; SMS routes through the DLT-registered gateway with delivery receipts and a built-in credit buffer.
- Messages include subject, session time, and the absentee list. CSV export supports escalation and record keeping.

## 5. Lecturer Attendance Confirmation
- Biometric fingerprint scanners remain the source of truth for staff entry/exit.
- After scanning in the morning and evening, staff tap a simple checklist on the shared tablet to confirm presence.
- Confirmation timestamps pair with biometric events for audit trails and late/early alerts.

## 6. Data Storage & Resilience
- Online data lives in PostgreSQL with nightly backups and 30-day point-in-time recovery.
- Local queues survive browser refreshes or device restarts until sync completes.
- Admin exports and analytics dashboards surface synced data for compliance and reporting.

## 7. High-Risk Student Flags
- Risk levels update whenever rosters load or sync completes.
- **High risk** appears when a student misses two or more sessions consecutively for the subject, or their absences exceed 45% over the last 45 days.
- **Medium risk** highlights students with 30%+ absences or 35%+ late arrivals.
- **Low risk** covers all other students and clears automatically as attendance improves.

