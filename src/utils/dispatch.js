import { ALL_PROVIDERS } from '../data/sampleData'
import { ASSIGNED_STATUSES, lastStatusAt, withStatus } from './bookingHelpers'

/**
 * Ride-hailing style dispatch, run once a second by BookingContext.
 *
 * A "searching" booking is offered to one professional at a time, nearest first.
 * If they decline or the offer times out, it moves to the next candidate. With no
 * candidates left the booking becomes "unfulfilled".
 *
 * Phase 2: this belongs on the server; keep the same rules there.
 */

/** True when the provider already holds a job that clashes with this booking. */
export function isBusy(bookings, providerId, booking) {
  return bookings.some(
    (b) =>
      b.id !== booking.id &&
      b.providerId === providerId &&
      ASSIGNED_STATUSES.includes(b.status) &&
      (booking.mode === 'now' ? b.mode === 'now' : b.mode === 'scheduled' && b.date === booking.date && b.timeSlot === booking.timeSlot),
  )
}

/**
 * Ranked candidate list. Distance proxy: providers based in the customer's locality
 * first, then those who list it as a service area, then everyone else in the
 * category ("expanding the search radius"). Ties break on rating.
 */
function rankCandidates(booking, bookings, env) {
  const distance = (p) => (p.locality === booking.locality ? 0 : p.serviceAreas.includes(booking.locality) ? 1 : 2)
  const eligible = ALL_PROVIDERS.filter(
    (p) =>
      p.category === booking.category &&
      env.isActive(p.id) &&
      env.isOnline(p) &&
      !booking.declinedBy.includes(p.id) &&
      !isBusy(bookings, p.id, booking),
  ).sort((a, b) => distance(a) - distance(b) || b.rating - a.rating)

  // A preferred professional (booked from their profile) is always offered first.
  const preferred = eligible.find((p) => p.id === booking.preferredProviderId)
  return preferred ? [preferred, ...eligible.filter((p) => p !== preferred)] : eligible
}

export const distanceLabel = (provider, locality) =>
  provider.locality === locality ? 'Nearby' : provider.serviceAreas.includes(locality) ? 'In service area' : 'Further away'

/** Assigns a booking to a provider (offer accepted). */
export function assign(booking, provider, now) {
  return withStatus(booking, 'accepted', { providerId: provider.id, providerName: provider.name, offer: null }, new Date(now).toISOString())
}

/**
 * Advances every booking by one tick. Returns the same array when nothing changed,
 * so React can skip re-rendering.
 *
 * env: { settings, isActive(id), isOnline(provider), isPartnerControlled(id) }
 */
export function tick(bookings, env, now) {
  const { settings } = env
  let changed = false

  const next = bookings.map((original) => {
    let b = original
    const iso = new Date(now).toISOString()
    const sinceStatus = now - lastStatusAt(b)
    const autopilot = settings.demoAutopilot && b.providerId && !env.isPartnerControlled(b.providerId)

    if (b.status === 'searching') {
      // Expired offer: treat as a decline and move on.
      if (b.offer && now >= b.offer.expiresAt) {
        b = { ...b, offer: null, declinedBy: [...b.declinedBy, b.offer.providerId] }
      }
      // Demo autopilot: an unattended professional accepts after a short delay.
      if (b.offer && settings.demoAutopilot && !env.isPartnerControlled(b.offer.providerId) && now - b.offer.at >= settings.autoAcceptSec * 1000) {
        const provider = ALL_PROVIDERS.find((p) => p.id === b.offer.providerId)
        b = assign(b, provider, now)
      }
      if (b.status === 'searching' && !b.offer) {
        const [candidate] = rankCandidates(b, bookings, env)
        if (candidate) {
          b = { ...b, offer: { providerId: candidate.id, at: now, expiresAt: now + settings.offerTimeoutSec * 1000 }, offerCount: b.offerCount + 1 }
        } else if (sinceStatus > 4000) {
          // Give the "searching" screen a moment before reporting no match.
          b = withStatus(b, 'unfulfilled', {}, iso)
        }
      }
    } else if (autopilot) {
      // Demo autopilot: simulate the professional's steps so the customer can watch a full job.
      const startsSoon = b.mode === 'now' || Date.parse(`${b.date}T${b.timeSlot ?? '00:00'}`) - now < 30 * 60 * 1000
      if (b.status === 'accepted' && startsSoon && sinceStatus >= 3000) {
        b = withStatus(b, 'on-the-way', { eta: { arriveAt: now + settings.travelSec * 1000 } }, iso)
      } else if (b.status === 'on-the-way' && b.eta && now >= b.eta.arriveAt) {
        b = withStatus(b, 'arrived', {}, iso)
      } else if (b.status === 'arrived' && sinceStatus >= 6000) {
        b = withStatus(b, 'in-progress', {}, iso)
      } else if (b.status === 'in-progress' && sinceStatus >= settings.jobSec * 1000) {
        b = withStatus(b, 'completed', { eta: null }, iso)
      }
    }

    if (b !== original) changed = true
    return b
  })

  return changed ? next : bookings
}
