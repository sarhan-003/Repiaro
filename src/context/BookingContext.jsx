import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { createSeedBookings, DEFAULT_DASHBOARD_PROVIDER_ID, PROVIDERS } from '../data/sampleData'
import {
  canTransition,
  generateBookingId,
  isSlotTaken,
  sanitizeBooking,
  sanitizeBookings,
  STATUS_META,
} from '../utils/bookingHelpers'
import { isStorageAvailable, readJSON, removeKeys, STORAGE_KEYS, writeJSON } from '../utils/storage'

/**
 * Single source of truth for demo bookings and provider availability.
 *
 * Phase 2: replace the localStorage reads/writes in this file with API calls;
 * components only talk to the functions exposed below, so they stay unchanged.
 */
export const BookingContext = createContext(null)

const providerIds = new Set(PROVIDERS.map((p) => p.id))

function loadBookings() {
  const { found, value } = readJSON(STORAGE_KEYS.bookings)
  if (!found) return createSeedBookings()
  return sanitizeBookings(value) ?? createSeedBookings()
}

function sanitizeAvailability(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value).filter(([id, flag]) => providerIds.has(id) && typeof flag === 'boolean'),
  )
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

export function BookingProvider({ children }) {
  const [bookings, setBookings] = useState(loadBookings)
  const [availability, setAvailability] = useState(() => sanitizeAvailability(readJSON(STORAGE_KEYS.availability).value))
  const [dashboardProviderId, setDashboardProviderId] = useState(loadDashboardProvider)
  const [storageAvailable] = useState(isStorageAvailable)

  // Persist demo state. localStorage is browser-only demo storage, not a database.
  useEffect(() => {
    writeJSON(STORAGE_KEYS.bookings, bookings)
  }, [bookings])
  useEffect(() => {
    writeJSON(STORAGE_KEYS.availability, availability)
  }, [availability])
  useEffect(() => {
    writeJSON(STORAGE_KEYS.dashboardProvider, dashboardProviderId)
  }, [dashboardProviderId])

  // Keep several open tabs in sync (e.g. customer view in one, provider view in another).
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

  const isProviderAvailable = useCallback(
    (provider) => availability[provider.id] ?? provider.available,
    [availability],
  )

  const setProviderAvailability = useCallback((providerId, available) => {
    if (!providerIds.has(providerId)) return
    setAvailability((prev) => ({ ...prev, [providerId]: Boolean(available) }))
  }, [])

  /** Creates a demo booking. Returns { ok, booking } or { ok: false, error }. */
  const createBooking = useCallback(
    (input, provider) => {
      if (!isProviderAvailable(provider)) {
        return { ok: false, error: `${provider.name} is not accepting bookings right now.` }
      }
      if (isSlotTaken(bookings, provider.id, input.date, input.timeSlot)) {
        return { ok: false, error: 'That time slot was just taken. Please choose another.' }
      }
      const now = new Date().toISOString()
      const booking = sanitizeBooking({
        id: generateBookingId(),
        providerId: provider.id,
        providerName: provider.name,
        category: provider.category,
        service: input.service,
        description: input.description.trim(),
        customerName: input.customerName.trim().replace(/\s+/g, ' '),
        phone: input.phone.trim(),
        address: input.address.trim(),
        locality: input.locality,
        date: input.date,
        timeSlot: input.timeSlot,
        instructions: input.instructions.trim(),
        price: provider.price,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        isSeed: false,
        statusHistory: [{ status: 'pending', at: now }],
      })
      if (!booking) return { ok: false, error: 'Some booking details were invalid. Please review the form.' }
      setBookings((prev) => [booking, ...prev])
      return { ok: true, booking }
    },
    [bookings, isProviderAvailable],
  )

  /** Moves a booking to a new status if `actor` is allowed to. */
  const updateBookingStatus = useCallback(
    (bookingId, nextStatus, actor) => {
      const current = bookings.find((b) => b.id === bookingId)
      if (!current) return { ok: false, error: 'Booking not found.' }
      if (!canTransition(current.status, nextStatus, actor)) {
        return {
          ok: false,
          error: `A ${STATUS_META[current.status].label.toLowerCase()} booking cannot be marked ${STATUS_META[nextStatus]?.label.toLowerCase() ?? nextStatus}.`,
        }
      }
      const at = new Date().toISOString()
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId && canTransition(b.status, nextStatus, actor)
            ? { ...b, status: nextStatus, updatedAt: at, statusHistory: [...b.statusHistory, { status: nextStatus, at }] }
            : b,
        ),
      )
      return { ok: true }
    },
    [bookings],
  )

  const resetDemoData = useCallback(() => {
    removeKeys(Object.values(STORAGE_KEYS))
    setBookings(createSeedBookings())
    setAvailability({})
    setDashboardProviderId(DEFAULT_DASHBOARD_PROVIDER_ID)
  }, [])

  const value = useMemo(
    () => ({
      bookings,
      storageAvailable,
      createBooking,
      updateBookingStatus,
      cancelBooking: (id) => updateBookingStatus(id, 'cancelled', 'customer'),
      isProviderAvailable,
      setProviderAvailability,
      dashboardProviderId,
      setDashboardProviderId,
      resetDemoData,
    }),
    [
      bookings,
      storageAvailable,
      createBooking,
      updateBookingStatus,
      isProviderAvailable,
      setProviderAvailability,
      dashboardProviderId,
      resetDemoData,
    ],
  )

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}
