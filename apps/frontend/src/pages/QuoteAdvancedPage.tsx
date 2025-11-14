import { PrintableQuoteLayout } from './QuoteStandardPage'

const inclusions = [
  'Everything in Standard: offline-first attendance capture, notifications, admin dashboards, and managed backups.',
  'Predictive absentee analytics dashboard with explainable risk scores and per-class intervention planner.',
  'High-risk cohort alerts for lecturers/HODs with automated escalation notes and email summaries.',
  'Bulk WhatsApp & SMS flows auto-filled from predictions (lecturer approves before sending).',
  'Retraining pipeline for absentee models, scheduling, and monitoring dashboards with weekly KPI emails.',
  'Enhanced audit trail, analytics exports, and year-on-year attendance comparison reports.'
]

const pricingOptions = [
  {
    title: 'Option A — Fully Managed (developer absorbs 12 months of infra)',
    headline:
      'Contract covers development plus 12 months of the production stack (Vercel Pro, MongoDB Atlas M10, realtime service, monitoring, domains/SSL/email) handled by us.',
    bullets: [
      'One-time development and implementation fee: ₹8,50,000',
      'Recurring cloud & maintenance (₹17,000/month) included for first year: ₹2,04,000',
      'Total contract amount billed now: ₹10,54,000 (covers everything for year one)',
      'From year two onward, recurring services renew at ₹17,000/month or the service pauses.'
    ]
  },
  {
    title: 'Option B — Client pays monthly cloud/AMC directly',
    headline:
      'We deliver and hand over the advanced platform; client keeps cloud, realtime, and monitoring subscriptions active in their own accounts.',
    bullets: [
      'One-time development and implementation fee: ₹8,50,000',
      'Client pays recurring cloud & maintenance directly: ₹17,000/month (Vercel Pro, MongoDB Atlas M10, Pusher/Ably realtime, monitoring, domain/email)',
      'If monthly services lapse, predictive and notification services are suspended until payments resume.'
    ]
  }
]

export const QuoteAdvancedPage = () => (
  <PrintableQuoteLayout
    title="Quotation — Advanced PWA + Attendance Prediction (4,000 students)"
    priceLines={[
      { label: 'One-time development & implementation fee', value: '₹8,50,000' },
      { label: 'Recommended delivery timeline', value: 'Additional 5–7 weeks (total 11–13 weeks)' }
    ]}
    inclusions={inclusions}
    timeline="Timeline: Additional 5–7 weeks (total 11–13 weeks)"
    monthlyHeading="Baseline monthly stack (payable after year one or by client under Option B)"
    monthlyItems={[
      'Vercel Pro hosting (Next.js frontend + API routes): ₹4,500/month',
      'MongoDB Atlas M10 cluster (10 GB storage, backups): ₹7,500/month',
      'Realtime messaging (Pusher/Ably production tier): ₹3,000/month',
      'Monitoring & logging (Sentry + uptime): ₹1,000/month',
      'Domain & transactional email allowance: ₹1,000/month',
      'Estimated total recurring cost: ₹17,000/month'
    ]}
    pricingOptions={pricingOptions}
  />
)

