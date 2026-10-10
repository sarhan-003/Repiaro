import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ALL_PROVIDERS, createSeedBookings, DEFAULT_DASHBOARD_PROVIDER_ID } from '../data/sampleData'
import {
  canReview,
  canTransition,
  generateBookingId,
  generateOtp,
  LIMITS,
  sanitizeBooking,
  sanitizeBookings,
  STATUS_META,
  withStatus,
} from '../utils/bookingHelpers'
import { assign, isBusy, tick } from '../utils/dispatch'
import { todayISO } from '../utils/formatDate'
import { isStorageAvailable, readJSON, removeKeys, STORAGE_KEYS, writeJSON } from '../utils/storage'
import { PlatformContext } from './PlatformContext'

/**
 * Bookings, provider availability and the dispatch loop.
 *
 * Phase 2: dispatch, status changes and persistence move to the server; components
 * only use the functions exposed below, so they stay unchanged.
 */
export const BookingContext = createContext(null)

const providerIds = new Set(ALL_PROVIDERS.map((p) => p.id))
const findProvider = (id) => ALL_PROVIDERS.find((p) => p.id === id) ?? null

function loadBookings() {
  const { found, value } = readJSON(STORAGE_KEYS.bookings)
  if (!found) return createSeedBookings()
  return sanitizeBookings(value) ?? createSeedBookings()
}

function sanitizeAvailability(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value).filter(([id, flag]) => providerIds.has(id) && typeof flag === 'boolean'))
}

function loadDashboardProvider() {
  const { value } = readJSON(STORAGE_KEYS.dashboardProvider)
  return providerIds.has(value) ? value : DEFAULT_DASHBOARD_PROVIDER_ID
}

function parseOrNull(raw) {
  try {
    return raw == null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

/** Is a partner app currently open (in any tab) for this provider? Then autopilot stays out of the way. */
function readPartnerLive() {
  const { value } = readJSON(STORAGE_KEYS.partnerLive)
  return value && typeof value.providerId === 'string' && Number.isFinite(value.at) ? value : null
}

/** Admin reassign: drop the current professional and search again, skipping them. */
const restartSearch = (b) => ({ offer: null, offerCount: 0, declinedBy: b.providerId ? [b.providerId] : [], providerId: null, providerName: null, eta: null })

const ok = { ok: true }
const fail = (error) => ({ ok: false, error })

export function BookingProvider({ children }) {
  const platform = useContext(PlatformContext)
  const [bookings, setBookings] = useState(loadBookings)
  const [availability, setAvailability] = useState(() => sanitizeAvailability(readJSON(STORAGE_KEYS.availability).value))
  const [dashboardProviderId, setDashboardProviderId] = useState(loadDashboardProvider)
  const [storageAvailable] = useState(isStorageAvailable)

  useEffect(() => {
    writeJSON(STORAGE_KEYS.bookings, bookings)
  }, [bookings])
  useEffect(() => {
    writeJSON(STORAGE_KEYS.availability, availability)
  }, [availability])
  useEffect(() => {
    writeJSON(STORAGE_KEYS.dashboardProvider, dashboardProviderId)
  }, [dashboardProviderId])

  // Keep open tabs in sync (customer site, partner app and consoles side by side).
  useEffect(() => {
    function handleStorage(event) {
      if (event.key === STORAGE_KEYS.bookings) {
        const next = sanitizeBookings(parseOrNull(event.newValue))
        if (next) setBookings(next)
      } else if (event.key === STORAGE_KEYS.availability) {
        setAvailability(sanitizeAvailability(parseOrNull(event.newValue)))
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const isProviderOnline = useCallback(
    (provider) => platform.isProviderActive(provider.id) && (availability[provider.id] ?? provider.available),
    [availability, platform],
  )

  // The dispatch loop reads the latest platform state through a ref so the interval never restarts.
  const envRef = useRef(null)
  envRef.current = {
    settings: platform.settings,
    isActive: (id) => platform.isProviderActive(id),
    isOnline: isProviderOnline,
  }

  useEffect(() => {
    const id = setInterval(() => {
      const live = readPartnerLive()
      const now = Date.now()
      const env = {
        ...envRef.current,
        isPartnerControlled: (providerId) => live?.providerId === providerId && now - live.at < 6000,
      }
      setBookings((prev) => tick(prev, env, now))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const setProviderAvailability = useCallback((providerId, available) => {
    if (!providerIds.has(providerId)) return
    setAvailability((prev) => ({ ...prev, [providerId]: Boolean(available) }))
  }, [])

  /** Customer request: starts in "searching" and the dispatch loop takes over. */
  const requestService = useCallback((input) => {
    const now = new Date().toISOString()
    const booking = sanitizeBooking({
      id: generateBookingId(),
      mode: input.mode,
      category: input.category,
      categoryId: input.categoryId,
      itemId: input.itemId,
      service: input.service,
      description: input.description.trim(),
      customerName: input.customerName.trim().replace(/\s+/g, ' '),
      phone: input.phone.trim(),
      address: input.address.trim(),
      locality: input.locality,
      date: input.mode === 'scheduled' ? input.date : todayISO(),
      timeSlot: input.mode === 'scheduled' ? input.timeSlot : null,
      payment: input.payment,
      fare: input.fare,
      price: input.fare.total,
      providerId: null,
      providerName: null,
      preferredProviderId: input.preferredProviderId ?? null,
      offer: null,
      offerCount: 0,
      declinedBy: [],
      otp: generateOtp(),
      eta: null,
      status: 'searching',
      createdAt: now,
      updatedAt: now,
      isSeed: false,
      review: null,
      statusHistory: [{ status: 'searching', at: now }],
    })
    if (!booking) return fail('Some booking details were invalid. Please review the form.')
    setBookings((prev) => [booking, ...prev])
    return { ok: true, booking }
  }, [])

  /** Partner app: accept or decline the offer currently shown to this provider. */
  const respondToOffer = useCallback(
    (bookingId, providerId, accept) => {
      const current = bookings.find((b) => b.id === bookingId)
      if (!current || current.status !== 'searching' || current.offer?.providerId !== providerId)
        return fail('This request is no longer available.')
      if (accept && isBusy(bookings, providerId, current)) return fail('Finish your current job before accepting another.')
      const now = Date.now()
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id !== bookingId || b.status !== 'searching' || b.offer?.providerId !== providerId) return b
          return accept ? assign(b, findProvider(providerId), now) : { ...b, offer: null, declinedBy: [...b.declinedBy, providerId] }
        }),
      )
      return ok
    },
    [bookings],
  )

  /** Partner app: move an assigned job forward. Starting the job requires the customer's OTP. */
  const advanceJob = useCallback(
    (bookingId, providerId, next, otp) => {
      const current = bookings.find((b) => b.id === bookingId)
      if (!current || current.providerId !== providerId) return fail('Booking not found.')
      if (!canTransition(current.status, next, 'provider')) return fail(`Cannot mark a ${STATUS_META[current.status].label.toLowerCase()} job as ${STATUS_META[next].label.toLowerCase()}.`)
      if (next === 'in-progress' && otp !== current.otp) return fail('Incorrect OTP. Ask the customer for the 4-digit code on their screen.')
      const extra = next === 'on-the-way' ? { eta: { arriveAt: Date.now() + platform.settings.travelSec * 1000 } } : next === 'completed' ? { eta: null } : {}
      setBookings((prev) => prev.map((b) => (b.id === bookingId && canTransition(b.status, next, 'provider') ? withStatus(b, next, extra) : b)))
      return ok
    },
    [bookings, platform.settings.travelSec],
  )

  const updateAs = useCallback(
    (actor, bookingId, next, extra = {}) => {
      const current = bookings.find((b) => b.id === bookingId)
      if (!current) return fail('Booking not found.')
      if (!canTransition(current.status, next, actor)) return fail(`This booking can no longer be changed (${STATUS_META[current.status].label.toLowerCase()}).`)
      const patch = typeof extra === 'function' ? extra(current) : extra
      setBookings((prev) => prev.map((b) => (b.id === bookingId && canTransition(b.status, next, actor) ? withStatus(b, next, patch) : b)))
      return ok
    },
    [bookings],
  )

  const cancelBooking = useCallback((id) => updateAs('customer', id, 'cancelled', { cancelledBy: 'customer', offer: null, eta: null }), [updateAs])
  const retrySearch = useCallback((id) => updateAs('customer', id, 'searching', { offer: null, offerCount: 0, declinedBy: [] }), [updateAs])

  const adminCancel = useCallback(
    (id) => {
      const result = updateAs('admin', id, 'cancelled', { cancelledBy: 'admin', offer: null, eta: null })
      if (result.ok) platform.logAction(`Cancelled booking ${id}`)
      return result
    },
    [updateAs, platform],
  )
  const adminRedispatch = useCallback(
    (id) => {
      const result = updateAs('admin', id, 'searching', restartSearch)
      if (result.ok) platform.logAction(`Re-dispatched booking ${id} to find another professional`)
      return result
    },
    [updateAs, platform],
  )

  const addReview = useCallback(
    (bookingId, rating, comment) => {
      const current = bookings.find((b) => b.id === bookingId)
      if (!current || !canReview(current)) return fail('Only completed bookings can be rated, once.')
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail('Choose a rating from 1 to 5 stars.')
      const review = { rating, comment: comment.trim().slice(0, LIMITS.review.max), at: new Date().toISOString() }
      setBookings((prev) => prev.map((b) => (b.id === bookingId && canReview(b) ? { ...b, review } : b)))
      return ok
    },
    [bookings],
  )

  const resetDemoData = useCallback(() => {
    removeKeys([STORAGE_KEYS.bookings, STORAGE_KEYS.availability, STORAGE_KEYS.dashboardProvider])
    setBookings(createSeedBookings())
    setAvailability({})
    setDashboardProviderId(DEFAULT_DASHBOARD_PROVIDER_ID)
  }, [])

  const value = useMemo(
    () => ({
      bookings,
      storageAvailable,
      requestService,
      respondToOffer,
      advanceJob,
      cancelBooking,
      retrySearch,
      adminCancel,
      adminRedispatch,
      addReview,
      isProviderOnline,
      setProviderAvailability,
      dashboardProviderId,
      setDashboardProviderId,
      resetDemoData,
    }),
    [
      bookings,
      storageAvailable,
      requestService,
      respondToOffer,
      advanceJob,
      cancelBooking,
      retrySearch,
      adminCancel,
      adminRedispatch,
      addReview,
      isProviderOnline,
      setProviderAvailability,
      dashboardProviderId,
      resetDemoData,
    ],
  )

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}
