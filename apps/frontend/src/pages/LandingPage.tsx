import { Link } from 'react-router-dom'
import { TENANT_LIST } from '../data/tenants'

export const LandingPage = () => {
  return (
    <div className="bg-background">
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-sky-50">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-4 py-16 sm:py-20">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
              Smart attendance for 4,000 students — offline-ready, parent-connected, audit-proof
            </h1>
            <p className="text-lg text-slate-600">
              Built for Sree Chaitanya Institute of Technological Sciences and sister campuses:
              lightning-fast teacher workflows, WhatsApp and SMS guardian notifications, and
              enterprise-grade reporting with biometric reconciliation.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/app/login"
                className="rounded-full bg-primary px-6 py-3 text-center text-base font-semibold text-white shadow-md transition hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Get Access
              </Link>
            </div>
          </div>
          <div className="grid w-full gap-6 rounded-3xl bg-white p-6 shadow-xl shadow-primary/10 sm:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Offline-first attendance workflows
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Capture attendance without worrying about connectivity disruptions.
                OAM syncs automatically when the device is back online,
                powered by IndexedDB (Dexie.js) and background sync cues.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Parent notifications without delay
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Teachers confirm and send pre-filled WhatsApp or SMS alerts to parents. No WhatsApp
                Business API is required and SMS routes through the college’s DLT-approved gateway
                with delivery tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {FEATURE_BULLETS.map((bullet) => (
            <FeatureCard key={bullet}>{bullet}</FeatureCard>
          ))}
        </div>
      </section>

      <section id="notifications" className="bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-14 sm:grid-cols-[2fr_3fr] sm:items-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">
              College-controlled guardian outreach
            </h2>
            <p className="text-sm text-slate-600">
              Every lecturer signs in with their dedicated account, captures attendance, and prepares
              parent communication in seconds. WhatsApp messages launch from the official SCIT number
              for consistent branding, while SMS notifications ride on the DLT-approved sender ID so
              every guardian receives timely updates.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
              <li>Lecturer-specific logins secure access to their assigned timetable and rosters.</li>
              <li>
                Set the guardian contact once per class; OAM reuses it for WhatsApp and SMS
                templates.
              </li>
              <li>
                A single college WhatsApp sender number ({TENANT_LIST.find((tenant) => tenant.id === 'scit')?.whatsappSenderNumber ?? '+91 90000 33333'})
                keeps every notification branded and traceable.
              </li>
              <li>SMS alerts include delivery receipts and are budgeted with monthly fallback credits.</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 shadow-lg shadow-primary/15">
            <h3 className="text-lg font-semibold text-primary-dark">
              Notification flow inside OAM
            </h3>
            <ol className="mt-4 space-y-3 text-sm text-slate-700">
              <li className="flex gap-3">
                <span className="mt-1 h-6 w-6 rounded-full bg-primary text-center text-xs font-semibold leading-6 text-white">
                  1
                </span>
                Mark attendance (offline friendly) and flag students for notification.
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-6 w-6 rounded-full bg-primary text-center text-xs font-semibold leading-6 text-white">
                  2
                </span>
                Enter or confirm the guardian contact for the class.
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-6 w-6 rounded-full bg-primary text-center text-xs font-semibold leading-6 text-white">
                  3
                </span>
                Choose WhatsApp click-to-chat or queue an SMS—both use college-owned sender IDs and
                record delivery status.
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section id="about" className="bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-14 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">
              Built for the twin campuses
            </h2>
            <p className="text-sm text-slate-600">
              OAM is tuned for SCIT academic workflows while still
              supporting twin-campus operations. Use the campus selector below
              whenever you need to switch contexts.
            </p>
          </div>
          <div className="grid w-full max-w-md gap-4">
            {TENANT_LIST.map((tenant) => (
              <div
                key={tenant.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
              >
                <p className="text-sm font-semibold text-slate-800">
                  {tenant.shortName}
                </p>
                <p className="text-xs text-slate-500">{tenant.name}</p>
                <p className="mt-2 text-xs text-slate-500">{tenant.address}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

const FeatureCard = ({ children }: { children: React.ReactNode }) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
    <p className="text-sm font-medium leading-relaxed text-slate-700">
      {children}
    </p>
  </article>
)

const FEATURE_BULLETS = [
  'Offline-first attendance: take attendance anywhere, sync automatically.',
  'Instant parent contact: prefilled WhatsApp or SMS alerts with delivery tracking.',
  'Secure, auditable records: role-based access, export-ready reports.'
]

