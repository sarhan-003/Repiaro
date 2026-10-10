import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Bike, CalendarClock, House, KeyRound, MessageSquare, Phone, RotateCcw, SearchX, Star } from 'lucide-react'
import BookingTimeline from '../components/bookings/BookingTimeline'
import RateServiceDialog from '../components/bookings/RateServiceDialog'
import Button from '../components/common/Button'
import ConfirmDialog from '../components/common/ConfirmDialog'
import ProviderAvatar from '../components/common/ProviderAvatar'
import RatingDisplay from '../components/common/RatingDisplay'
import { ErrorState } from '../components/common/States'
import StatusBadge from '../components/common/StatusBadge'
import PageContainer from '../components/layout/PageContainer'
import { getCategoryIcon } from '../components/services/categoryIcons'
import { useBookings } from '../hooks/useBookings'
import { useNow } from '../hooks/useNow'
import { useToast } from '../hooks/useToast'
import { canReview, canTransition } from '../utils/bookingHelpers'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDisplayDate, formatTimeSlot } from '../utils/formatDate'
import { getCategoryById, getProviderById } from '../utils/providerHelpers'

const mmss = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Pulsing radar shown while the dispatch engine looks for a professional. */
function SearchingPanel({ booking, now, onCancel }) {
  const category = getCategoryById(booking.categoryId)
  const Icon = getCategoryIcon(category?.icon)
  const offerLeft = booking.offer ? booking.offer.expiresAt - now : null
  return (
    <div className="rounded-3xl bg-white p-6 text-center shadow-sm sm:p-10">
      <div className="relative mx-auto flex size-44 items-center justify-center" aria-hidden="true">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/20 motion-reduce:animate-none" />
        <span className="absolute inset-6 animate-ping rounded-full bg-primary/30 [animation-delay:400ms] motion-reduce:animate-none" />
        <span className="relative flex size-24 items-center justify-center rounded-full bg-primary shadow-lg">
          <Icon className="size-10" />
        </span>
      </div>
      <h1 className="mt-6 text-2xl font-extrabold" aria-live="polite">
        Finding a {booking.category.toLowerCase()} pro near {booking.locality}
      </h1>
      <p className="mt-2 text-muted" aria-live="polite">
        {booking.offer
          ? `Request sent to professional ${booking.offerCount}${booking.declinedBy.length ? ` (${booking.declinedBy.length} unavailable)` : ''} · waiting ${mmss(offerLeft)}`
          : 'Looking for the nearest available professional…'}
      </p>
      <div className="mx-auto mt-5 h-1.5 max-w-xs overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-1/3 animate-[searchbar_1.4s_ease-in-out_infinite] rounded-full bg-ink motion-reduce:animate-none" />
      </div>
      <Button variant="secondary" className="mt-8" onClick={onCancel}>
        Cancel request
      </Button>
    </div>
  )
}

/** Route bar standing in for a live map: the pro moves toward your home as the ETA counts down. */
function RouteBar({ booking, now, travelMs }) {
  const remaining = booking.eta ? booking.eta.arriveAt - now : 0
  const progress = booking.status === 'on-the-way' && booking.eta ? Math.min(1, Math.max(0, 1 - remaining / travelMs)) : booking.status === 'accepted' ? 0 : 1
  return (
    <div className="rounded-2xl bg-surface p-4" aria-hidden="true">
      <div className="relative h-10">
        <div className="absolute inset-x-5 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-200" />
        <div className="absolute left-5 top-1/2 h-1 -translate-y-1/2 rounded-full bg-ink transition-all duration-1000" style={{ width: `calc((100% - 2.5rem) * ${progress})` }} />
        <span
          className="absolute top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary shadow transition-all duration-1000"
          style={{ left: `calc(1.25rem + (100% - 2.5rem) * ${progress})` }}
        >
          <Bike className="size-5" />
        </span>
        <span className="absolute right-0 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-ink bg-white">
          <House className="size-5" />
        </span>
      </div>
    </div>
  )
}

function headline(booking, now) {
  switch (booking.status) {
    case 'accepted':
      return booking.mode === 'scheduled'
        ? { title: `Confirmed for ${formatDisplayDate(booking.date)}`, sub: `${booking.providerName} will arrive around ${formatTimeSlot(booking.timeSlot)}.` }
        : { title: 'Professional assigned', sub: `${booking.providerName} is getting ready to leave.` }
    case 'on-the-way': {
      const left = booking.eta ? booking.eta.arriveAt - now : 0
      return { title: left > 0 ? `Arriving in ${mmss(left)}` : 'Arriving any moment', sub: `${booking.providerName} is on the way to ${booking.locality}.` }
    }
    case 'arrived':
      return { title: 'Your pro has arrived', sub: 'Share the OTP below so they can start the job.' }
    case 'in-progress':
      return { title: 'Work in progress', sub: `${booking.providerName} is working on: ${booking.service}.` }
    case 'completed':
      return { title: 'Job completed', sub: `Please pay ${formatCurrency(booking.fare.total)} by ${booking.payment === 'upi' ? 'UPI' : 'cash'} to your professional.` }
    case 'cancelled':
      return { title: 'Booking cancelled', sub: booking.cancelledBy === 'admin' ? 'This booking was cancelled by support.' : 'You cancelled this booking. No charge applies.' }
    default:
      return { title: '', sub: '' }
  }
}

export default function TrackBooking() {
  const { bookingId } = useParams()
  const { bookings, cancelBooking, retrySearch, addReview } = useBookings()
  const { showToast } = useToast()
  const now = useNow()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [rating, setRating] = useState(false)
  const booking = bookings.find((b) => b.id === bookingId)

  if (!booking) {
    return (
      <PageContainer className="py-16">
        <title>Booking not found — Home All-Rounder</title>
        <ErrorState title="We couldn’t find that booking" description="It may have been removed when demo data was reset.">
          <Button to="/my-bookings">Go to My Bookings</Button>
        </ErrorState>
      </PageContainer>
    )
  }

  const provider = getProviderById(booking.providerId)
  const canCancel = canTransition(booking.status, 'cancelled', 'customer')
  const showOtp = ['accepted', 'on-the-way', 'arrived'].includes(booking.status)
  const { title, sub } = headline(booking, now)

  function handleCancel() {
    const result = cancelBooking(booking.id)
    showToast(result.ok ? 'Booking cancelled. No charge applies.' : result.error, result.ok ? 'info' : 'error')
    setConfirmCancel(false)
  }

  function handleRetry() {
    const result = retrySearch(booking.id)
    if (!result.ok) showToast(result.error, 'error')
  }

  return (
    <>
      <title>{`Track ${booking.id} — Home All-Rounder`}</title>
      <PageContainer className="max-w-5xl py-6 sm:py-8">
        <Link to="/my-bookings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" />
          My bookings
        </Link>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="min-w-0 space-y-4">
            {booking.status === 'searching' && <SearchingPanel booking={booking} now={now} onCancel={() => setConfirmCancel(true)} />}

            {booking.status === 'unfulfilled' && (
              <div className="rounded-3xl bg-white p-6 text-center sm:p-10">
                <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-red-50 text-danger">
                  <SearchX className="size-8" aria-hidden="true" />
                </span>
                <h1 className="mt-4 text-2xl font-extrabold">No professionals available</h1>
                <p className="mx-auto mt-2 max-w-md text-muted">
                  All nearby {booking.category.toLowerCase()} pros are busy or offline right now. Try again, or schedule for a later time.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button onClick={handleRetry}>
                    <RotateCcw className="size-4" aria-hidden="true" />
                    Search again
                  </Button>
                  <Button to={`/book-now/${booking.categoryId}?item=${booking.itemId}`} variant="secondary">
                    <CalendarClock className="size-4" aria-hidden="true" />
                    Schedule instead
                  </Button>
                </div>
              </div>
            )}

            {!['searching', 'unfulfilled'].includes(booking.status) && (
              <>
                <div className={`rounded-3xl p-5 sm:p-6 ${booking.status === 'cancelled' ? 'bg-slate-100' : booking.status === 'completed' ? 'bg-green-50' : 'bg-primary'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h1 className="text-2xl font-extrabold sm:text-3xl" aria-live="polite">
                        {title}
                      </h1>
                      <p className="mt-1 text-slate-800">{sub}</p>
                    </div>
                    <StatusBadge status={booking.status} className="bg-white" />
                  </div>
                  {['accepted', 'on-the-way', 'arrived'].includes(booking.status) && (
                    <div className="mt-4">
                      <RouteBar booking={booking} now={now} travelMs={Math.max(1, (booking.eta?.arriveAt ?? now) - Date.parse(booking.statusHistory.at(-1).at))} />
                    </div>
                  )}
                </div>

                {provider && (
                  <div className="rounded-2xl border border-line bg-white p-4">
                    <div className="flex items-center gap-4">
                      <ProviderAvatar provider={provider} className="size-16 rounded-2xl" textClassName="text-lg" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-bold">{provider.name}</p>
                        <p className="text-sm text-muted">
                          {provider.category} · {provider.experience} yrs exp
                        </p>
                        <RatingDisplay rating={provider.rating} reviewCount={provider.reviewCount} reviewLabel />
                      </div>
                      <div className="flex gap-2">
                        <button type="button" disabled className="flex size-11 cursor-not-allowed items-center justify-center rounded-full bg-slate-100 text-slate-400" aria-label="Call (available in Phase 2)" title="Calling arrives in Phase 2">
                          <Phone className="size-5" aria-hidden="true" />
                        </button>
                        <button type="button" disabled className="flex size-11 cursor-not-allowed items-center justify-center rounded-full bg-slate-100 text-slate-400" aria-label="Chat (available in Phase 2)" title="Chat arrives in Phase 2">
                          <MessageSquare className="size-5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    {['accepted', 'on-the-way', 'arrived'].includes(booking.status) && (
                      <p className="mt-3 text-xs text-muted">Call and chat with your professional arrive in Phase 2. Demo provider profile.</p>
                    )}
                  </div>
                )}

                {showOtp && (
                  <div className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-ink/20 bg-white p-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-ink text-primary">
                      <KeyRound className="size-6" aria-hidden="true" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Start-job OTP</p>
                      <p className="text-xs text-muted">Share only when your professional is at your door.</p>
                    </div>
                    <p className="flex gap-1.5" aria-label={`OTP ${booking.otp.split('').join(' ')}`}>
                      {booking.otp.split('').map((digit, i) => (
                        <span key={i} className="flex h-12 w-9 items-center justify-center rounded-lg bg-surface text-2xl font-extrabold" aria-hidden="true">
                          {digit}
                        </span>
                      ))}
                    </p>
                  </div>
                )}

                {booking.status === 'completed' && (
                  <div className="rounded-2xl border border-line bg-white p-4">
                    {booking.review ? (
                      <p className="flex items-center gap-2 text-sm">
                        <Star className="size-5" fill="#FFC61A" stroke="#F5B800" aria-hidden="true" />
                        You rated this job {booking.review.rating}/5. Thank you!
                      </p>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-semibold">How was {booking.providerName}?</p>
                        <Button onClick={() => setRating(true)}>
                          <Star className="size-4" aria-hidden="true" />
                          Rate service
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {(booking.status === 'cancelled' || booking.status === 'completed') && (
              <Button to={`/book-now/${booking.categoryId}?item=${booking.itemId}`} variant="secondary" className="w-full">
                <RotateCcw className="size-4" aria-hidden="true" />
                Book this again
              </Button>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-line bg-white p-5">
              <p className="text-xs text-muted">Booking {booking.id}</p>
              <p className="mt-1 font-bold">{booking.service}</p>
              <p className="text-sm text-muted">
                {booking.mode === 'scheduled' ? `${formatDisplayDate(booking.date)} · ${formatTimeSlot(booking.timeSlot)}` : `Now · ${formatDisplayDate(booking.date)}`}
              </p>
              <p className="mt-2 text-sm">
                {booking.address}, {booking.locality}
              </p>
              <dl className="mt-4 space-y-1.5 border-t border-line pt-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Service fare</dt>
                  <dd>{formatCurrency(booking.fare.item + booking.fare.surgeAmount)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Convenience fee</dt>
                  <dd>{formatCurrency(booking.fare.fee)}</dd>
                </div>
                <div className="flex justify-between font-extrabold">
                  <dt>Total · {booking.payment === 'upi' ? 'UPI' : 'Cash'} after service</dt>
                  <dd>{formatCurrency(booking.fare.total)}</dd>
                </div>
              </dl>
              {canCancel && booking.status !== 'searching' && (
                <Button variant="danger-outline" className="mt-4 w-full" onClick={() => setConfirmCancel(true)}>
                  Cancel booking
                </Button>
              )}
              {canCancel && <p className="mt-2 text-center text-xs text-muted">Free cancellation until your pro arrives.</p>}
            </div>
            <div className="rounded-2xl border border-line bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">Progress</h2>
              <BookingTimeline booking={booking} />
            </div>
            <p className="text-center text-xs text-muted">Demo booking stored in this browser. Status updates are simulated.</p>
          </aside>
        </div>
      </PageContainer>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this booking?"
        description={booking.status === 'searching' ? 'We’ll stop looking for a professional.' : `${booking.providerName ?? 'Your professional'} will be notified. No charge applies before arrival.`}
        confirmLabel="Yes, cancel"
        cancelLabel="Keep booking"
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(false)}
      />
      <RateServiceDialog
        booking={rating && canReview(booking) ? booking : null}
        onClose={() => setRating(false)}
        onSubmit={(stars, comment) => {
          const result = addReview(booking.id, stars, comment)
          if (result.ok) {
            setRating(false)
            showToast('Thanks for rating your professional!')
          }
          return result
        }}
      />
    </>
  )
}
