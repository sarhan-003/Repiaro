import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Radar } from 'lucide-react'
import { useBookings } from '../../hooks/useBookings'
import { useNow } from '../../hooks/useNow'
import { STATUS_META } from '../../utils/bookingHelpers'
import { formatTimeSlot } from '../../utils/formatDate'

/** Floating "your pro is on the way" strip, like a ride app's current-trip bar. */
export default function ActiveBookingBanner() {
  const { pathname } = useLocation()
  const { bookings } = useBookings()
  const now = useNow()
  const live = bookings
    .filter((b) => ['searching', 'on-the-way', 'arrived', 'in-progress'].includes(b.status) || (b.status === 'accepted' && b.mode === 'now'))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]

  // Hidden where the page already shows booking controls in the same spot.
  if (!live || pathname.startsWith('/track/') || pathname.startsWith('/book-now/')) return null

  const mins = live.eta ? Math.max(1, Math.ceil((live.eta.arriveAt - now) / 60000)) : null
  const text =
    live.status === 'searching'
      ? `Finding a ${live.category.toLowerCase()} professional near ${live.locality}…`
      : live.status === 'on-the-way'
        ? `${live.providerName} is on the way${mins ? ` · ${mins} min` : ''}`
        : live.status === 'accepted'
          ? `${live.providerName} accepted${live.timeSlot ? ` · ${formatTimeSlot(live.timeSlot)}` : ''}`
          : `${live.service} · ${STATUS_META[live.status].label}`

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-30 px-4 md:bottom-6">
      <Link
        to={`/track/${live.id}`}
        className="pointer-events-auto mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-2xl transition-transform hover:-translate-y-0.5"
      >
        <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-ink">
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/40 motion-reduce:hidden" aria-hidden="true" />
          <Radar className="relative size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">{text}</span>
          <span className="block text-xs text-slate-300">Tap to track · {live.id}</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-primary" aria-hidden="true" />
      </Link>
    </div>
  )
}
