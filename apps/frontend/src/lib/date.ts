import dayjs from './dayjs'

export const formatDisplayDate = (iso: string) =>
  dayjs(iso).tz?.('Asia/Kolkata').format('DD-MMM-YYYY') ??
  dayjs(iso).format('DD-MMM-YYYY')

export const nowIsoUtc = () => dayjs().utc?.().toISOString() ?? dayjs().toISOString()

