// All booking dates are plain local calendar dates ("YYYY-MM-DD"). We never
// round-trip them through UTC, so a booking made late at night in IST does not
// shift to the previous day.

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME_SLOT = /^([01]\d|2[0-3]):([0-5]\d)$/

const pad = (n) => String(n).padStart(2, '0')

export function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseISODate(value) {
  const match = typeof value === 'string' ? ISO_DATE.exec(value) : null
  if (!match) return null
  const [, y, m, d] = match.map(Number)
  const date = new Date(y, m - 1, d)
  // Reject impossible dates such as 2026-02-31, which Date silently rolls over.
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null
  return date
}

export function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export const todayISO = () => toISODate(new Date())

export function isPastDate(isoDate, today = todayISO()) {
  return isoDate < today
}

export function isValidTimeSlot(slot) {
  return typeof slot === 'string' && TIME_SLOT.test(slot)
}

/** True when the slot on that date has already started. */
export function isSlotPast(isoDate, slot, now = new Date()) {
  const today = toISODate(now)
  if (isoDate !== today) return isoDate < today
  const [h, m] = slot.split(':').map(Number)
  return h * 60 + m <= now.getHours() * 60 + now.getMinutes()
}

const longDate = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const dateTime = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
})
const reviewDate = new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' })

export function formatDisplayDate(isoDate) {
  const date = parseISODate(isoDate)
  return date ? longDate.format(date) : '—'
}

/** Weekday / day / month parts for date chips. */
export function getDateParts(isoDate) {
  const date = parseISODate(isoDate)
  if (!date) return null
  return {
    weekday: date.toLocaleDateString('en-IN', { weekday: 'short' }),
    day: date.getDate(),
    month: date.toLocaleDateString('en-IN', { month: 'short' }),
  }
}

export function formatTimeSlot(slot) {
  if (!isValidTimeSlot(slot)) return '—'
  const [h, m] = slot.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${pad(m)} ${suffix}`
}

export function formatDateTime(isoString) {
  const date = new Date(isoString)
  return Number.isNaN(date.getTime()) ? '—' : dateTime.format(date)
}

export function formatReviewDate(isoDate) {
  const date = parseISODate(isoDate)
  return date ? reviewDate.format(date) : ''
}
