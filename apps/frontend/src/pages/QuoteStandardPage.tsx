const inclusions = [
  'Multi-tenant PWA sized for 4,000 students (SCIT + SCEE) with offline-first faculty workflows.',
  'Faculty attendance UI with Dexie queue, background sync checks, and quick absentee toggles.',
  'Next-day absentee prediction chips inside Faculty Attendance for at-risk students.',
  'Parent communication templates via WhatsApp click-to-chat and SMS (DLT onboarding + 25,000 credits included).',
  'Managed PostgreSQL with automated nightly backups, 30-day recovery, and quarterly restore drills.',
  'Audit logs, RBAC, infrastructure-as-code deployment, documentation, and onsite onboarding.'
]

const pricingOptions = [
  {
    title: 'Option A — Fully Managed (developer absorbs 12 months of infra)',
    headline:
      'Contract includes development plus 12 months of cloud, messaging, domains, SSL, email, monitoring, and AMC handled by us.',
    bullets: [
      'One-time development and implementation fee: ₹4,80,000',
      'Recurring cloud & maintenance (₹17,000/month) included for first year: ₹2,04,000',
      'Total contract amount billed now: ₹6,84,000 (covers everything for year one)',
      'From year two onward, recurring services renew at ₹17,000/month or the service pauses.'
    ]
  },
  {
    title: 'Option B — Client pays monthly cloud/AMC directly',
    headline:
      'We deliver and hand over the platform; client keeps cloud, messaging, SSL, and monitoring subscriptions active in their own accounts.',
    bullets: [
      'One-time development and implementation fee: ₹4,80,000',
      'Client pays recurring cloud & maintenance directly: ₹17,000/month (Vercel Pro, MongoDB Atlas M10, Pusher/Ably realtime, monitoring, domain/email)',
      'If monthly services lapse, the platform is suspended until payments resume.'
    ]
  }
]

export const QuoteStandardPage = () => (
  <PrintableQuoteLayout
    title="Quotation — Standard PWA Attendance App (4,000 students)"
    priceLines={[
      { label: 'One-time development & implementation fee', value: '₹4,80,000' },
      { label: 'Recommended delivery timeline', value: '6 weeks (includes infra hardening & backup drills)' }
    ]}
    pricingOptions={pricingOptions}
    timeline="Timeline: 6 weeks (includes infra hardening & backup drills)"
    monthlyHeading="Baseline monthly stack (payable after year one or by client under Option B)"
    monthlyItems={[
      'Vercel Pro hosting (Next.js frontend + API routes): ₹4,500/month',
      'MongoDB Atlas M10 cluster (10 GB storage, backups): ₹7,500/month',
      'Realtime messaging (Pusher/Ably production tier): ₹3,000/month',
      'Monitoring & logging (Sentry + uptime): ₹1,000/month',
      'Domain & transactional email allowance: ₹1,000/month',
      'Estimated total recurring cost: ₹17,000/month'
    ]}
    inclusions={inclusions}
  />
)

interface PricingOption {
  title: string
  headline: string
  bullets: string[]
}

interface PrintableQuoteLayoutProps {
  title: string
  priceLines: Array<{ label: string; value: string }>
  inclusions: string[]
  timeline: string
  monthlyHeading: string
  monthlyItems: string[]
  pricingOptions?: PricingOption[]
}

export const PrintableQuoteLayout = ({
  title,
  priceLines,
  inclusions,
  timeline,
  monthlyHeading,
  monthlyItems,
  pricingOptions
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
          {pricingOptions?.length ? (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-900">Pricing structure</h2>
              <div className="grid gap-4">
                {pricingOptions.map((option) => (
                  <article
                    key={option.title}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                  >
                    <h3 className="text-lg font-semibold text-slate-900">{option.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{option.headline}</p>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                      {option.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
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

