export const PrivacyPage = () => (
  <div className="bg-white">
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-12 text-sm leading-relaxed text-slate-700">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">Privacy & Consent</h1>
        <p>
          CollegeAttend operates under a campus-controlled tenancy model. SCIT
          administrators govern data residency, access control, and export
          policies, with twin-campus support available on request. All data
          travels over HTTPS, encrypted at rest on the managed PostgreSQL
          instance, and synchronises using signed requests.
        </p>
      </header>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">
          Consent-managed notifications
        </h2>
        <p>
          Parents opt in to WhatsApp click-to-chat notifications during student
          onboarding. Teachers preview every message before sending, confirming
          intent. No automated dispatch occurs without active confirmation.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Offline storage</h2>
        <p>
          Attendance captured offline is stored in IndexedDB (Dexie.js) within
          the faculty device. Records are encrypted using tenant-scoped keys and
          cleared after successful sync. Teachers can manually purge their queue
          from the Sync Monitor at any time.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">
          Role-based access
        </h2>
        <p>
          Role-based access control (RBAC) enforces least privilege. Faculty may
          manage class rosters and attendance, students view their personal
          dashboards, and administrators audit reports, exports, and consent
          logs. All sensitive actions emit audit trails stored in the
          attendance_audit table.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Data lifecycle</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Attendance records retain for 7 academic years.</li>
          <li>Parent contact data updates on every roster sync.</li>
          <li>
            Withdrawal requests route to campus data officers for processing
            within 14 days.
          </li>
          <li>
            Backups run nightly with point-in-time recovery configured on the
            managed PostgreSQL cluster.
          </li>
        </ul>
      </section>
    </div>
  </div>
)

