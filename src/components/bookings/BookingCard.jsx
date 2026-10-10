import { CalendarDays, ChevronRight, MapPin, Star, UserRound } from 'lucide-react'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDisplayDate, formatTimeSlot } from '../../utils/formatDate'
import { getCategoryByName, getProviderById } from '../../utils/providerHelpers'
import ProviderAvatar from '../common/ProviderAvatar'
import StatusBadge from '../common/StatusBadge'
import { getCategoryIcon } from '../services/categoryIcons'

function SampleTag() {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500" title="Pre-loaded example booking">
      Sample
    </span>
  )
}

/**
 * Booking row for either dashboard.
 * - customer: the whole row opens the details; extra actions (e.g. Rate) go in `children`.
 * - provider: category tile + customer details, with status actions in `children`.
 */
export default function BookingCard({ booking, perspective = 'customer', onViewDetails, children }) {
  const when = booking.timeSlot ? `${formatDisplayDate(booking.date)} at ${formatTimeSlot(booking.timeSlot)}` : `Now · ${formatDisplayDate(booking.date)}`

  if (perspective === 'customer') {
    const provider = getProviderById(booking.providerId)
    return (
      <article className="rounded-2xl border border-line bg-white transition-shadow hover:shadow-md">
        <button
          type="button"
          onClick={() => onViewDetails(booking)}
          className="flex w-full items-center gap-4 rounded-2xl p-4 text-left"
          aria-label={`${booking.category} – ${booking.service}${booking.providerName ? ` with ${booking.providerName}` : ''}, ${when}. Open booking`}
        >
          <ProviderAvatar provider={provider} name={booking.providerName} className="size-14 rounded-xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-bold sm:text-base">
                {booking.category} - {booking.service}
              </h3>
              <StatusBadge status={booking.status} />
              {booking.isSeed && <SampleTag />}
            </div>
            <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted">
              <UserRound className="size-3.5 shrink-0" aria-hidden="true" />
              {booking.providerName ?? (booking.status === 'searching' ? 'Finding a professional…' : 'No professional assigned')}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
              <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
              {when}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {booking.address}, {booking.locality}
              </span>
            </p>
          </div>
          <div className="hidden shrink-0 text-right sm:block">
            <p className="text-xs text-muted">{booking.id}</p>
            <p className="font-bold">{formatCurrency(booking.price)}</p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-slate-400" aria-hidden="true" />
        </button>
        {(children || booking.review) && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3">
            {booking.review ? (
              <p className="flex items-center gap-1.5 text-sm text-muted">
                <Star className="size-4" fill="#FFC61A" stroke="#F5B800" aria-hidden="true" />
                You rated this {booking.review.rating}/5
              </p>
            ) : (
              <span />
            )}
            <div className="flex flex-wrap gap-2">{children}</div>
          </div>
        )}
      </article>
    )
  }

  const category = getCategoryByName(booking.category)
  const Icon = getCategoryIcon(category?.icon)
  return (
    <article className="rounded-2xl border border-line bg-white p-4 transition-shadow hover:shadow-md">
      <div className="flex gap-4">
        <span className={`flex size-14 shrink-0 items-center justify-center rounded-xl ring-1 ${category?.tint ?? 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
          <Icon className="size-7" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold">{booking.service}</h3>
            <StatusBadge status={booking.status} />
            {booking.isSeed && <SampleTag />}
          </div>
          <p className="mt-0.5 text-sm text-slate-700">
            {booking.customerName} · {formatCurrency(booking.price)}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              {when}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" aria-hidden="true" />
              {booking.locality}
            </span>
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">{booking.description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        {children}
        <button
          type="button"
          onClick={() => onViewDetails(booking)}
          className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
          aria-label={`View details for booking ${booking.id}`}
        >
          View details
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}
