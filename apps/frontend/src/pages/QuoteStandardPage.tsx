const inclusions = [
  'Multi-tenant PWA sized for 4,000 students (SCIT + SCEE) with offline-first faculty workflows.',
  'Faculty attendance UI with Dexie queue, background sync checks, and quick absentee toggles.',
  'Next-day absentee prediction chips inside Faculty Attendance for at-risk students.',
  'Parent communication templates via WhatsApp click-to-chat and SMS (DLT onboarding + 25,000 credits included).',
  'Managed PostgreSQL with automated nightly backups, 30-day recovery, and quarterly restore drills.',
  'Audit logs, RBAC, infrastructure-as-code deployment, documentation, and onsite onboarding.'
]

export const QuoteStandardPage = () => (
  <PrintableQuoteLayout
    title="Quotation — Standard PWA Attendance App (4,000 students)"
    priceLines={[
      { label: 'Total Project Price (all-inclusive)', value: '₹4,80,000' }
    ]}
    timeline="Timeline: 6 weeks (includes infra hardening & backup drills)"
    monthlyHeading="Ongoing coverage (monthly, max expected)"
    monthlyItems={[
      'Managed hosting (app, DB, CDN, monitoring stack): ₹38,000/month',
      'SMS & WhatsApp credits (25,000 message pack + DLT renewals): ₹21,500/month',
      'Automated backups & cold storage snapshots: ₹9,500/month'
    ]}
    inclusions={inclusions}
  />
)

interface PrintableQuoteLayoutProps {
  title: string
  priceLines: Array<{ label: string; value: string }>
  inclusions: string[]
  timeline: string
  monthlyHeading: string
  monthlyItems: string[]
}

export const PrintableQuoteLayout = ({
  title,
  priceLines,
  inclusions,
  timeline,
  monthlyHeading,
  monthlyItems
}: PrintableQuoteLayoutProps) => {
  const onPrint = () => window.print()

  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 print:px-0">
        <div className="flex flex-col items-start gap-4 border-b border-slate-200 pb-6 print:border-none">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <button
            type="button"
            onClick={onPrint}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary print:hidden"
          >
            Download / Print PDF
          </button>
        </div>
        <section className="mt-6 space-y-6 text-sm leading-relaxed text-slate-700 print:space-y-4">
          <div className="space-y-2">
            {priceLines.map((line) => (
              <PriceLine key={line.label} label={line.label} value={line.value} />
            ))}
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Includes:</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {inclusions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <p className="font-semibold text-slate-900">{timeline}</p>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {monthlyHeading}:
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {monthlyItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}

export const PriceLine = ({ label, value }: { label: string; value: string }) => (
  <p className="text-base font-semibold text-slate-900">
    {label}: <span className="text-primary-dark">{value}</span>
  </p>
)

