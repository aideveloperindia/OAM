import { PrintableQuoteLayout } from './QuoteStandardPage'

const inclusions = [
  'Everything in Standard (4,000-student deployment, SMS onboarding, backups).',
  'Next-day absentee prediction module with explainable alerts inside Faculty Attendance.',
  'Intervention planner for lecturers/HODs with high-risk student summaries.',
  'WhatsApp + SMS bulk notify flows auto-filled from predictions (lecturer confirms send).',
  'Retraining pipeline, monitoring dashboards, and ML documentation.',
  'Data requirement: Minimum 3 months attendance data (6–12 months recommended).'
]

export const QuoteAdvancedPage = () => (
  <PrintableQuoteLayout
    title="Quotation — Advanced PWA + Attendance Prediction (4,000 students)"
    priceLines={[
      { label: 'Total Project Price (all-inclusive)', value: '₹8,50,000' }
    ]}
    inclusions={inclusions}
    timeline="Timeline: Additional 5–7 weeks (total 11–13 weeks)"
    monthlyHeading="Monthly infra & maintenance (max expected)"
    monthlyItems={[
      'Managed hosting & autoscale (API, workers, analytics): ₹52,000/month',
      'ML retraining & inference compute allowance (GPU cluster): ₹95,000/month',
      'Observability & incident tooling (logs, APM, alerting): ₹28,000/month',
      'Messaging credits (35,000 SMS + WhatsApp templates): ₹26,000/month'
    ]}
  />
)

