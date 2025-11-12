export const HelpPage = () => (
  <div className="bg-white">
    <div className="mx-auto w-full max-w-5xl space-y-10 px-4 py-12 text-sm text-slate-700">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">Instructions to Use</h1>
        <p>
          This walkthrough covers every major feature in OAM (Online Attendance Management)—from logging in to
          WhatsApp-ready notifications. Follow the numbered sections in order when training new
          lecturers or administrators.
        </p>
      </header>
      <InstructionSection
        number={1}
        title="Daily lecturer attendance workflow"
        summary="Designed for a 4,000-student rollout—everything defaults to present, so lecturers only deal with absentees. Works the same online or offline."
        steps={[
          'Open the OAM PWA on your phone, tablet, or kiosk. You stay signed in for 30 days per device.',
          'Today’s timetable appears automatically with the current period and subject highlighted.',
          'Scroll the roster—everyone starts as Present. Tap the toggle beside any student who is absent or late.',
          'Press Save session. Online entries sync instantly; offline entries queue locally until the connection returns.',
          'Need to alert guardians? Tap Notify Parents to launch WhatsApp or SMS templates prepared for the marked students.'
        ]}
        tips={[
          'Queued marks live in IndexedDB `CollegeAttendDB.queuedAttendance` until uploaded.',
          'Open Sync Monitor anytime to confirm pending, failed, or completed uploads.',
          'High-risk chips appear beside students who recently missed two sessions in a row or crossed the 45% absence threshold.'
        ]}
      />
      <InstructionSection
        number={2}
        title="Sign in with your lecturer account"
        summary="Lecturers and admins use their campus email to sign in. Demo mode works without a password when the API is offline."
        steps={[
          'Open https://collegeattend.local (or the hosted URL) on a mobile or desktop browser.',
          'Choose your campus in the selector (SCIT by default).',
          'Enter your campus email and press Sign In. If the backend is offline, a secure demo session is created so you can keep working.',
          'After the first login, install the app (Add to Home Screen) for one-touch access.'
        ]}
        tips={[
          'Sessions persist for 30 days offline via encrypted local storage.',
          'Admins can revoke access centrally; logging out clears the local cache.'
        ]}
      />
      <InstructionSection
        number={3}
        title="Prepare rosters before going offline"
        summary="OAM caches class data locally so lecturers can work without signal."
        steps={[
          'While connected to Wi-Fi, open Faculty Attendance. The current timetable downloads and stores rosters in IndexedDB (Dexie).',
          'Verify the class list and risk indicators. Any updates from the admin portal sync immediately.',
          'If you will be offline for long periods, open the next day’s sessions in advance so they are cached too.'
        ]}
        tips={[
          'Roster cache lives in the on-device IndexedDB database `CollegeAttendDB.rosterCache`.',
          'The cache auto-expires after the admin changes a roster; fresh data is fetched at the next login.'
        ]}
      />

      <InstructionSection
        number={4}
        title="Capture attendance during class"
        summary="Mark Present / Absent / Late even without connectivity—the data stays on the device until sync."
        steps={[
          'Tap each student’s status chips. Colour badges show the current state.',
          'Use Mark all Present / Mark all Absent for quick toggles, then adjust individuals.',
          'Press Save session (offline). Every change is written to IndexedDB `queuedAttendance` with a pending sync flag.',
          'You can close the browser—records remain stored locally until uploaded.'
        ]}
        tips={[
          'Each queued record stores faculty ID, subject, schedule entry, and timestamp for auditing.',
          'If you reopen the class, previously saved marks load from the local queue.'
        ]}
      />

      <InstructionSection
        number={5}
        title="Sync and monitor status"
        summary="When the device reconnects, OAM syncs automatically. The Upload Status page shows progress and allows manual control."
        steps={[
          'Open Sync Monitor after reconnecting to Wi-Fi/data.',
          'Review Pending, Failed, and Synced counts. Failed rows include error messages returned by the API.',
          'Press Sync now to force an upload or Clear synced records to prune your local queue.',
          'Sync history is logged in IndexedDB `syncEvents` and mirrored on the server for auditing.'
        ]}
        tips={[
          'If sync is blocked, confirm date/time is correct and your login is still valid.',
          'Escalate repeated failures to the administrator—API logs can be checked for conflicts.'
        ]}
      />

      <InstructionSection
        number={6}
        title="Send WhatsApp & SMS notifications"
        summary="Lecturers can trigger guardian messages by WhatsApp or SMS. WhatsApp uses the college sender; SMS routes through the DLT-approved gateway."
        steps={[
          'From Class Attendance, select absentees or high-risk students and open Notify Parents.',
          'Set the guardian contact once—WhatsApp and SMS use the same parent number per class.',
          'Review the prefilled templates with subject, date, and student details.',
          'Choose WhatsApp click-to-chat or Send SMS. WhatsApp opens the official college sender account; SMS queues through the DLT-registered gateway with delivery status shown in the upload queue.'
        ]}
        tips={[
          'Recipient overrides persist per campus using `collegeattend::whatsapp-recipient::<tenant>` in local storage.',
          'DLT template IDs and SMS sender codes are managed centrally; lecturers do not have to approve templates.',
          'Download the CSV for archival or escalation to the admin staff.'
        ]}
      />

      <InstructionSection
        number={7}
        title="View reports and student dashboards"
        summary="Admins audit attendance trends while students see their personal records."
        steps={[
          'Admins: navigate to Admin Reports for heatmaps, exportable CSVs, and absentee summaries by branch and semester.',
          'Students: open Student Dashboard to view attendance percentages, recent sessions, and risk insights.',
          'Use the filters to slice by date range, subject, or cohort.'
        ]}
        tips={[
          'Exports are generated server-side and respect tenant isolation.',
          'Advanced package adds predictive analytics overlaying the same dashboards.'
        ]}
      />

      <InstructionSection
        number={8}
        title="How backups and disaster recovery work"
        summary="Data is protected even if a device is lost or a connection fails."
        steps={[
          'Every attendance mark is stored locally in IndexedDB until the API confirms receipt.',
          'The backend persists records in managed PostgreSQL with nightly snapshots and 30-day point-in-time recovery.',
          'Application and database containers are deployed via Docker with Infrastructure-as-Code, so environments can be rebuilt quickly.',
          'Artifact scripts export walkthrough videos and documentation for compliance audits.'
        ]}
        tips={[
          'Standard package includes backup monitoring; advanced package adds analytics pipelines with separate storage buckets.',
          'For extra assurance, schedule weekly manual exports from Admin Reports and archive them in campus storage.'
        ]}
      />
      <InstructionSection
        number={9}
        title="Record lecturer attendance with biometrics"
        summary="Fingerprints remain the primary record; the app adds quick confirmations for audits."
        steps={[
          'Lecturers scan their fingerprint at the staff biometric kiosk when entering campus.',
          'Immediately after scanning, tick the “Checked in” confirmation on the shared tablet (or personal device).',
          'At the end of the day, repeat the fingerprint scan when leaving and confirm “Checked out” in the app.',
          'Both timestamps sync to the backend so administrators can reconcile biometric punches with manual confirmations.'
        ]}
        tips={[
          'If the kiosk is offline, the confirmation stays queued locally until the connection returns.',
          'Missed confirmations trigger alerts on the Admin Reports dashboard.'
        ]}
      />
      <InstructionSection
        number={10}
        title="Understand high-risk student flags"
        summary="Risk levels help lecturers prioritise interventions by combining absence ratios and recent behaviour."
        steps={[
          'Each roster row shows Low, Medium, or High risk next to the student name.',
          'High risk means the student missed two or more sessions in a row for the subject, or they crossed 45% absences over the last 45 days.',
          'Medium risk flags students who have 30%+ absences or 35%+ late arrivals.',
          'Low risk covers everyone else, resetting automatically as attendance improves.'
        ]}
        tips={[
          'Risk calculations refresh every time the timetable loads or sync completes.',
          'Advanced analytics plan retrains predictions monthly to keep risk labels aligned with real behaviour.'
        ]}
      />
    </div>
  </div>
)

interface InstructionSectionProps {
  number: number
  title: string
  summary: string
  steps: string[]
  tips?: string[]
}

const InstructionSection = ({
  number,
  title,
  summary,
  steps,
  tips
}: InstructionSectionProps) => (
  <section className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
    <header className="flex items-start gap-3">
      <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
        {number}
      </span>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs text-slate-600 sm:text-sm">{summary}</p>
      </div>
    </header>
    <div className="rounded-2xl border border-white bg-white p-4 shadow-inner">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-primary sm:text-sm">
        Step-by-step
      </h3>
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-xs leading-relaxed sm:text-sm">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
    {tips?.length ? (
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-primary sm:text-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wide sm:text-sm">Pro tips</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>
    ) : null}
  </section>
)

