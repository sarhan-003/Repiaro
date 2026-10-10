import { PROVIDERS } from '../data/sampleData'
import { isPastDate, isSlotPast, isValidTimeSlot, parseISODate } from './formatDate'

export const BOOKING_STATUSES = ['pending', 'accepted', 'rejected', 'in-progress', 'completed', 'cancelled']

export const STATUS_META = {
  pending: { label: 'Pending', tone: 'warning' },
  accepted: { label: 'Accepted', tone: 'info' },
  rejected: { label: 'Rejected', tone: 'danger' },
  'in-progress': { label: 'In Progress', tone: 'primary' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

/** Statuses that still hold a provider's time slot. */
export const ACTIVE_STATUSES = ['pending', 'accepted', 'in-progress']

export const isUpcoming = (booking) => ACTIVE_STATUSES.includes(booking.status)

// Who may move a booking from one status to another. Anything not listed is rejected.
const TRANSITIONS = {
  provider: {
    pending: ['accepted', 'rejected'],
    accepted: ['in-progress'],
    'in-progress': ['completed'],
  },
  customer: {
    pending: ['cancelled'],
    accepted: ['cancelled'],
  },
}

export function canTransition(from, to, actor) {
  return TRANSITIONS[actor]?.[from]?.includes(to) ?? false
}

export function generateBookingId() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(6)
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes)
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  const suffix = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
  return `HAR-${suffix}`
}

// ---------------------------------------------------------------------------
// Form validation
// ---------------------------------------------------------------------------

// Indian mobile: optional +91 / 91 / 0 prefix, then 10 digits starting 6–9.
const INDIAN_MOBILE = /^(?:\+91|91|0)?[6-9]\d{9}$/
const NAME_PATTERN = /^[\p{L}][\p{L} .'-]*$/u

export const normalizePhone = (value) => value.replace(/[\s-]/g, '')

export const isValidIndianMobile = (value) => INDIAN_MOBILE.test(normalizePhone(value))

export const LIMITS = {
  name: { min: 3, max: 60 },
  description: { min: 15, max: 500 },
  address: { min: 8, max: 160 },
  instructions: { max: 300 },
}

/** Field order matters: the first invalid field in this list receives focus. */
export const BOOKING_FIELDS = ['service', 'description', 'customerName', 'phone', 'address', 'locality', 'date', 'timeSlot', 'instructions']

/**
 * @param values form values
 * @param ctx { services, localities, dates, isSlotOpen(date, slot) }
 */
export function validateBookingForm(values, ctx) {
  const errors = {}
  const name = values.customerName.trim()
  const description = values.description.trim()
  const address = values.address.trim()

  if (!values.service) errors.service = 'Choose the service you need.'
  else if (!ctx.services.includes(values.service)) errors.service = 'Choose a service this professional offers.'

  if (!description) errors.description = 'Describe the problem so the professional can prepare.'
  else if (description.length < LIMITS.description.min)
    errors.description = `Add a little more detail (at least ${LIMITS.description.min} characters).`
  else if (description.length > LIMITS.description.max)
    errors.description = `Keep the description under ${LIMITS.description.max} characters.`

  if (!name) errors.customerName = 'Enter your full name.'
  else if (name.length < LIMITS.name.min) errors.customerName = `Name must be at least ${LIMITS.name.min} characters.`
  else if (name.length > LIMITS.name.max) errors.customerName = `Name must be under ${LIMITS.name.max} characters.`
  else if (!NAME_PATTERN.test(name)) errors.customerName = 'Use letters, spaces, apostrophes or hyphens only.'

  if (!values.phone.trim()) errors.phone = 'Enter a mobile number.'
  else if (!isValidIndianMobile(values.phone))
    errors.phone = 'Enter a valid 10-digit Indian mobile number, e.g. 98765 43210 or +91 98765 43210.'

  if (!address) errors.address = 'Enter your house/flat number, building and street.'
  else if (address.length < LIMITS.address.min) errors.address = 'Add your building and street so the address is complete.'
  else if (address.length > LIMITS.address.max) errors.address = `Keep the address under ${LIMITS.address.max} characters.`

  if (!values.locality) errors.locality = 'Choose your locality.'
  else if (!ctx.localities.includes(values.locality)) errors.locality = 'Choose a locality from the list.'

  if (!values.date) errors.date = 'Choose a preferred date.'
  else if (!parseISODate(values.date)) errors.date = 'Choose a valid date.'
  else if (isPastDate(values.date)) errors.date = 'The date cannot be in the past.'
  else if (!ctx.dates.includes(values.date)) errors.date = 'Choose one of the professional’s available dates.'

  if (!values.timeSlot) errors.timeSlot = 'Choose a preferred time slot.'
  else if (!errors.date && !ctx.isSlotOpen(values.date, values.timeSlot))
    errors.timeSlot = 'That slot is no longer available. Choose another.'

  if (values.instructions.trim().length > LIMITS.instructions.max)
    errors.instructions = `Keep instructions under ${LIMITS.instructions.max} characters.`

  return errors
}

// ---------------------------------------------------------------------------
// Sanitising data read back from localStorage (treated as untrusted input)
// ---------------------------------------------------------------------------

const providerIds = new Set(PROVIDERS.map((p) => p.id))
const str = (value, max) => (typeof value === 'string' ? value.slice(0, max) : null)
const isValidTimestamp = (value) => typeof value === 'string' && !Number.isNaN(Date.parse(value))

export function sanitizeBooking(raw) {
  if (!raw || typeof raw !== 'object') return null

  const booking = {
    id: str(raw.id, 40),
    providerId: str(raw.providerId, 40),
    providerName: str(raw.providerName, 80),
    category: str(raw.category, 40),
    service: str(raw.service, 80),
    description: str(raw.description, LIMITS.description.max),
    customerName: str(raw.customerName, LIMITS.name.max),
    phone: str(raw.phone, 20),
    address: str(raw.address, LIMITS.address.max),
    locality: str(raw.locality, 60),
    date: str(raw.date, 10),
    timeSlot: str(raw.timeSlot, 5),
    instructions: str(raw.instructions ?? '', LIMITS.instructions.max),
    price: Number(raw.price),
    status: raw.status,
    createdAt: raw.createdAt,
    updatedAt: isValidTimestamp(raw.updatedAt) ? raw.updatedAt : raw.createdAt,
    isSeed: raw.isSeed === true,
    statusHistory: Array.isArray(raw.statusHistory)
      ? raw.statusHistory
          .filter((h) => h && BOOKING_STATUSES.includes(h.status) && isValidTimestamp(h.at))
          .slice(0, 10)
          .map((h) => ({ status: h.status, at: h.at }))
      : [],
  }

  const required = ['id', 'providerName', 'category', 'service', 'customerName', 'phone', 'address', 'locality']
  if (required.some((key) => !booking[key])) return null
  if (!providerIds.has(booking.providerId)) return null
  if (!BOOKING_STATUSES.includes(booking.status)) return null
  if (!parseISODate(booking.date) || !isValidTimeSlot(booking.timeSlot)) return null
  if (!Number.isFinite(booking.price) || booking.price < 0) return null
  if (!isValidTimestamp(booking.createdAt)) return null
  if (booking.statusHistory.length === 0) booking.statusHistory = [{ status: booking.status, at: booking.createdAt }]

  return booking
}

/** Returns a clean array, or null when the stored value is not an array at all. */
export function sanitizeBookings(raw) {
  if (!Array.isArray(raw)) return null
  const seen = new Set()
  return raw.map(sanitizeBooking).filter((b) => b && !seen.has(b.id) && seen.add(b.id))
}

/** Upcoming slot check that ignores bookings no longer holding the slot. */
export function isSlotTaken(bookings, providerId, date, slot, ignoreId) {
  return bookings.some(
    (b) =>
      b.id !== ignoreId &&
      b.providerId === providerId &&
      b.date === date &&
      b.timeSlot === slot &&
      ACTIVE_STATUSES.includes(b.status),
  )
}

export function isSlotBookable(bookings, provider, date, slot) {
  return (
    provider.availableSlots.includes(slot) &&
    !isSlotPast(date, slot) &&
    !isSlotTaken(bookings, provider.id, date, slot)
  )
}
