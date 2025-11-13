import fs from 'node:fs'
import { resolve } from 'node:path'
import dayjs from 'dayjs'
import PDFDocument from 'pdfkit'

const ROOT_DIR = resolve(process.cwd(), '..', '..')
const OUTPUT_DIR = resolve(ROOT_DIR, 'artifact')

const STANDARD_QUOTE = {
  filename: 'Quotation_Standard.pdf',
  title: 'Quotation — Standard PWA Attendance App (SCEE & SCIT)',
  priceLines: [{ label: 'Total Project Price (4000-student rollout, all inclusive)', value: '₹4,80,000' }],
  inclusions: [
    'Multi-tenant PWA for SCEE & SCIT (installable) sized for 4,000 students.',
    'Faculty attendance UI (offline + Dexie + sync).',
    'Student dashboard, admin reports, CSV export.',
    'WhatsApp Click-to-Chat parent notification (teacher-triggered).',
    'SMS gateway onboarding (DLT registration, 12 sender templates) + first 25,000 SMS credits.',
    'Audit logs, RBAC, basic training & 30-day support.',
    'Managed deployment landing with backup configuration and recovery drill walkthrough.'
  ],
  timeline: 'Timeline: 6 weeks',
  monthlyHeading: 'Ongoing coverage (monthly, max expected)',
  monthlyItems: [
    'Managed hosting (app, DB, CDN, monitoring stack): ₹38,000/month',
    'SMS & WhatsApp credits (25,000 message pack + DLT renewals): ₹21,500/month',
    'Automated backups & cold storage snapshots: ₹9,500/month'
  ]
}

const ADVANCED_QUOTE = {
  filename: 'Quotation_Advanced.pdf',
  title: 'Quotation — Advanced PWA + Attendance Prediction',
  priceLines: [{ label: 'Total Project Price (4000-student rollout, all inclusive)', value: '₹8,50,000' }],
  inclusions: [
    'Everything in Standard sized for 4,000 students (PWA, SMS onboarding, backups).',
    'Predictive module forecasting absenteeism per session.',
    'Risk dashboard for teachers & HODs.',
    'Suggested actions + one-click prefilled WhatsApp and SMS notify flows (teacher confirms send).',
    'Retraining pipeline, monitoring, docs with contingency hardware budget.',
    'Data requirement: Minimum 3 months attendance data (6–12 months recommended).'
  ],
  timeline: 'Timeline: Additional 5–7 weeks (total 11–13 weeks)',
  monthlyHeading: 'Monthly infra & maintenance (max expected)',
  monthlyItems: [
    'Managed hosting & autoscale (API, workers, analytics): ₹52,000/month',
    'ML retraining & inference compute allowance (GPU cluster): ₹95,000/month',
    'Observability & incident tooling (logs, APM, alerting): ₹28,000/month',
    'Messaging credits (35,000 SMS + WhatsApp templates): ₹26,000/month'
  ]
}

const ensureOutputDir = () => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }
}

const addHeader = (doc, title) => {
  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor('#0F172A')
    .text(title, { align: 'left' })
    .moveDown(0.5)
}

const addPriceLines = (doc, priceLines) => {
  priceLines.forEach(({ label, value }) => {
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor('#0F172A')
      .text(`${label}: `, { continued: true })
      .font('Helvetica')
      .fillColor('#146C94')
      .text(value)
  })
  doc.moveDown(0.5)
}

const addListSection = (doc, heading, items) => {
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#0F172A')
    .text(heading)
    .moveDown(0.2)
  doc.font('Helvetica').fontSize(11).fillColor('#334155').list(items, { bulletRadius: 2 }).moveDown(0.5)
}

const addFooter = (doc) => {
  doc.moveDown(1)
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#64748B')
    .text(
      `Issued on ${dayjs().format('DD MMM YYYY')} · OAM — Smart attendance for SCEE & SCIT`,
      { align: 'left' }
    )
}

const createQuotePdf = (config) => {
  const outputPath = resolve(OUTPUT_DIR, config.filename)
  const doc = new PDFDocument({ size: 'A4', margin: 56 })
  const stream = fs.createWriteStream(outputPath)
  doc.pipe(stream)

  addHeader(doc, config.title)
  addPriceLines(doc, config.priceLines)
  addListSection(doc, 'Includes:', config.inclusions)
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#0F172A')
    .text(config.timeline)
    .moveDown(0.5)
  addListSection(doc, config.monthlyHeading + ':', config.monthlyItems)
  addFooter(doc)

  doc.end()

  return new Promise((resolvePromise, rejectPromise) => {
    stream.on('finish', () => resolvePromise(outputPath))
    stream.on('error', (error) => rejectPromise(error))
  })
}

const run = async () => {
  ensureOutputDir()
  await Promise.all([createQuotePdf(STANDARD_QUOTE), createQuotePdf(ADVANCED_QUOTE)])
  // eslint-disable-next-line no-console
  console.log('Quotation PDFs generated in', OUTPUT_DIR)
}

run().catch((error) => {
  console.error('Failed to generate quotation PDFs', error)
  process.exitCode = 1
})



