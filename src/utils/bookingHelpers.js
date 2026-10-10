import { ALL_PROVIDERS, SERVICE_CATEGORIES } from '../data/sampleData'
import { isPastDate, isSlotPast, isValidTimeSlot, parseISODate } from './formatDate'

/**
 * Booking lifecycle, modelled on ride-hailing:
 * searching → accepted → on-the-way → arrived → in-progress (after OTP) → completed.
 * Side exits: cancelled (customer/admin) and unfulfilled (no professional found).
 */
export const BOOKING_STATUSES = ['searching', 'accepted', 'on-the-way', 'arrived', 'in-progress', 'completed', 'cancelled', 'unfulfilled']

export const STATUS_META = {
  searching: { label: 'Finding pro', tone: 'warning' },
  accepted: { label: 'Assigned', tone: 'info' },
  'on-the-way': { label: 'On the way', tone: 'info' },
  arrived: { label: 'Arrived', tone: 'primary' },
  'in-progress': { label: 'In progress', tone: 'primary' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  unfulfilled: { label: 'No pro found', tone: 'danger' },
}

/** Statuses where a professional is committed to the job. */
export const ASSIGNED_STATUSES = ['accepted', 'on-the-way', 'arrived', 'in-progress']
/** Statuses that still need attention (shown as "active"). */
export const ACTIVE_STATUSES = ['searching', ...ASSIGNED_STATUSES]

export const isUpcoming = (booking) => ACTIVE_STATUSES.includes(booking.status)

/** Only completed jobs can be rated, once. */
export const canReview = (booking) => booking.status === 'completed' && !booking.review

// Who may move a booking from one status to another. Anything not listed is refused.
const TRANSITIONS = {
  provider: {
    accepted: ['on-the-way'],
    'on-the-way': ['arrived'],
    arrived: ['in-progress'],
    'in-progress': ['completed'],
  },
  // Free cancellation until the professional arrives, as in ride-hailing.
  customer: {
    searching: ['cancelled'],
    accepted: ['cancelled'],
    'on-the-way': ['cancelled'],
    unfulfilled: ['searching'],
  },
  admin: {
    searching: ['cancelled'],
    accepted: ['cancelled', 'searching'],
    'on-the-way': ['cancelled', 'searching'],
    arrived: ['cancelled'],
    'in-progress': ['cancelled'],
    unfulfilled: ['searching', 'cancelled'],
  },
  system: {
    searching: ['accepted', 'unfulfilled'],
  },
}

export function canTransition(from, to, actor) {
  return TRANSITIONS[actor]?.[from]?.includes(to) ?? false
}

/** Next step a provider can take, with the button label for the partner app. */
export const PROVIDER_NEXT_STEP = {
  accepted: { next: 'on-the-way', label: 'Start trip — I’m on my way' },
  'on-the-way': { next: 'arrived', label: 'I’ve arrived' },
  arrived: { next: 'in-progress', label: 'Verify OTP & start job' },
  'in-progress': { next: 'completed', label: 'Complete job' },
}

function randomDigits(count, alphabet = '0123456789') {
  const bytes = new Uint8Array(count)
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes)
  else for (let i = 0; i < count; i++) bytes[i] = Math.floor(Math.random() * 256)
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

export const generateBookingId = () => `HAR-${randomDigits(6, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789')}`
export const generateOtp = () => randomDigits(4)

// ---------------------------------------------------------------------------
// Request form validation
// ---------------------------------------------------------------------------

// Indian mobile: optional +91 / 91 / 0 prefix, then 10 digits starting 6–9.
const INDIAN_MOBILE = /^(?:\+91|91|0)?[6-9]\d{9}$/
const NAME_PATTERN = /^[\p{L}][\p{L} .'-]*$/u

export const normalizePhone = (value) => value.replace(/[\s-]/g, '')
export const isValidIndianMobile = (value) => INDIAN_MOBILE.test(normalizePhone(value))

export const LIMITS = {
  name: { min: 3, max: 60 },
  description: { max: 500 },
  address: { min: 8, max: 160 },
  review: { max: 500 },
}

/** Field order matters: the first invalid field in this list receives focus. */
export const REQUEST_FIELDS = ['itemId', 'date', 'timeSlot', 'address', 'locality', 'customerName', 'phone', 'description']

/**
 * @param values form values
 * @param ctx { itemIds, localities, dates }
 */
export function validateRequest(values, ctx) {
  const errors = {}
  const name = values.customerName.trim()
  const address = values.address.trim()

  if (!ctx.itemIds.includes(values.itemId)) errors.itemId = 'Choose the service you need.'

  if (values.mode === 'scheduled') {
    if (!values.date) errors.date = 'Choose a date.'
    else if (!parseISODate(values.date) || isPastDate(values.date) || !ctx.dates.includes(values.date)) errors.date = 'Choose one of the listed dates.'
    if (!values.timeSlot) errors.timeSlot = 'Choose a time slot.'
    else if (!errors.date && (!isValidTimeSlot(values.timeSlot) || isSlotPast(values.date, values.timeSlot)))
      errors.timeSlot = 'That time has passed. Choose a later slot.'
  }

  if (!address) errors.address = 'Enter your house/flat number, building and street.'
  else if (address.length < LIMITS.address.min) errors.address = 'Add your building and street so the address is complete.'
  else if (address.length > LIMITS.address.max) errors.address = `Keep the address under ${LIMITS.address.max} characters.`

  if (!values.locality) errors.locality = 'Choose your locality.'
  else if (!ctx.localities.includes(values.locality)) errors.locality = 'Choose a locality from the list.'

  if (!name) errors.customerName = 'Enter your name.'
  else if (name.length < LIMITS.name.min) errors.customerName = `Name must be at least ${LIMITS.name.min} characters.`
  else if (name.length > LIMITS.name.max) errors.customerName = `Name must be under ${LIMITS.name.max} characters.`
  else if (!NAME_PATTERN.test(name)) errors.customerName = 'Use letters, spaces, apostrophes or hyphens only.'

  if (!values.phone.trim()) errors.phone = 'Enter a mobile number.'
  else if (!isValidIndianMobile(values.phone)) errors.phone = 'Enter a valid 10-digit Indian mobile number, e.g. 98765 43210.'

  if (values.description.trim().length > LIMITS.description.max)
    errors.description = `Keep the note under ${LIMITS.description.max} characters.`

  return errors
}

// ---------------------------------------------------------------------------
// Sanitising data read back from localStorage (treated as untrusted input)
// ---------------------------------------------------------------------------

const providerIds = new Set(ALL_PROVIDERS.map((p) => p.id))
const categoryIds = new Set(SERVICE_CATEGORIES.map((c) => c.id))
const str = (value, max) => (typeof value === 'string' ? value.slice(0, max) : null)
const isTimestamp = (value) => typeof value === 'string' && !Number.isNaN(Date.parse(value))
const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : null)

function sanitizeReview(raw) {
  if (!raw || typeof raw !== 'object') return null
  const rating = Number(raw.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !isTimestamp(raw.at)) return null
  return { rating, comment: str(raw.comment ?? '', LIMITS.review.max) ?? '', at: raw.at }
}

function sanitizeFare(raw) {
  if (!raw || typeof raw !== 'object') return null
  const fare = { item: num(raw.item), surge: num(raw.surge), surgeAmount: num(raw.surgeAmount), fee: num(raw.fee), total: num(raw.total) }
  return Object.values(fare).every((v) => v != null && v >= 0) ? fare : null
}

export function sanitizeBooking(raw) {
  if (!raw || typeof raw !== 'object') return null
  const providerId = raw.providerId == null ? null : str(raw.providerId, 40)

  const booking = {
    id: str(raw.id, 40),
    mode: raw.mode === 'scheduled' ? 'scheduled' : 'now',
    category: str(raw.category, 40),
    categoryId: str(raw.categoryId, 40),
    itemId: str(raw.itemId, 40),
    service: str(raw.service, 80),
    description: str(raw.description ?? '', LIMITS.description.max) ?? '',
    instructions: str(raw.instructions ?? '', 300) ?? '',
    customerName: str(raw.customerName, LIMITS.name.max),
    phone: str(raw.phone, 20),
    address: str(raw.address, LIMITS.address.max),
    locality: str(raw.locality, 60),
    date: str(raw.date, 10),
    timeSlot: raw.timeSlot == null ? null : str(raw.timeSlot, 5),
    payment: raw.payment === 'upi' ? 'upi' : 'cash',
    fare: sanitizeFare(raw.fare),
    price: num(raw.price),
    providerId,
    providerName: providerId ? str(raw.providerName, 80) : null,
    preferredProviderId: providerIds.has(raw.preferredProviderId) ? raw.preferredProviderId : null,
    offer:
      raw.offer && providerIds.has(raw.offer.providerId) && num(raw.offer.at) && num(raw.offer.expiresAt)
        ? { providerId: raw.offer.providerId, at: Number(raw.offer.at), expiresAt: Number(raw.offer.expiresAt) }
        : null,
    offerCount: num(raw.offerCount) ?? 0,
    declinedBy: Array.isArray(raw.declinedBy) ? raw.declinedBy.filter((id) => providerIds.has(id)).slice(0, 30) : [],
    otp: typeof raw.otp === 'string' && /^\d{4}$/.test(raw.otp) ? raw.otp : null,
    eta: raw.eta && num(raw.eta.arriveAt) ? { arriveAt: Number(raw.eta.arriveAt) } : null,
    status: raw.status,
    cancelledBy: ['customer', 'admin', 'system'].includes(raw.cancelledBy) ? raw.cancelledBy : null,
    createdAt: raw.createdAt,
    updatedAt: isTimestamp(raw.updatedAt) ? raw.updatedAt : raw.createdAt,
    isSeed: raw.isSeed === true,
    review: sanitizeReview(raw.review),
    statusHistory: Array.isArray(raw.statusHistory)
      ? raw.statusHistory
          .filter((h) => h && BOOKING_STATUSES.includes(h.status) && isTimestamp(h.at))
          .slice(0, 20)
          .map((h) => ({ status: h.status, at: h.at }))
      : [],
  }

  const required = ['id', 'category', 'service', 'customerName', 'phone', 'address', 'locality', 'otp']
  if (required.some((key) => !booking[key])) return null
  if (!categoryIds.has(booking.categoryId)) return null
  if (!BOOKING_STATUSES.includes(booking.status)) return null
  if (ASSIGNED_STATUSES.includes(booking.status) || booking.status === 'completed') {
    if (!providerIds.has(booking.providerId) || !booking.providerName) return null
  } else if (booking.providerId && !providerIds.has(booking.providerId)) return null
  if (!parseISODate(booking.date)) return null
  if (booking.timeSlot && !isValidTimeSlot(booking.timeSlot)) return null
  if (!booking.fare || booking.price == null) return null
  if (!isTimestamp(booking.createdAt)) return null
  if (booking.statusHistory.length === 0) booking.statusHistory = [{ status: booking.status, at: booking.createdAt }]
  if (booking.status !== 'completed') booking.review = null
  if (booking.status !== 'searching') booking.offer = null

  return booking
}

/** Returns a clean array, or null when the stored value is not an array at all. */
export function sanitizeBookings(raw) {
  if (!Array.isArray(raw)) return null
  const seen = new Set()
  return raw.map(sanitizeBooking).filter((b) => b && !seen.has(b.id) && seen.add(b.id))
}

/** Appends a status change with a timestamp. */
export function withStatus(booking, status, extra = {}, at = new Date().toISOString()) {
  return { ...booking, ...extra, status, updatedAt: at, statusHistory: [...booking.statusHistory, { status, at }] }
}

/** Time the booking entered its current status. */
export const lastStatusAt = (booking) => Date.parse(booking.statusHistory.at(-1)?.at ?? booking.createdAt)
