import { formatCurrency } from '../../utils/formatCurrency'
import { formatDateTime, formatDisplayDate, formatTimeSlot } from '../../utils/formatDate'
import { getProviderById } from '../../utils/providerHelpers'
import Button from '../common/Button'
import Modal from '../common/Modal'
import ProviderAvatar from '../common/ProviderAvatar'
import StatusBadge from '../common/StatusBadge'
import BookingTimeline from './BookingTimeline'

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 py-2 text-sm sm:grid-cols-[10rem_1fr]">
      <dt className="text-muted">{label}</dt>
      <dd className="break-words font-medium text-ink">{children}</dd>
    </div>
  )
}

/** Full booking record with tracking timeline (used in the consoles). Actions go in `actions`. */
export default function BookingDetailsDialog({ booking, onClose, actions }) {
  const provider = booking ? getProviderById(booking.providerId) : null

  return (
    <Modal
      open={booking != null}
      onClose={onClose}
      size="lg"
      title={booking ? `Booking ${booking.id}` : ''}
      description={booking?.isSeed ? 'Pre-loaded sample booking (demo data).' : 'Demo booking stored in this browser only.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {actions}
        </>
      }
    >
      {booking && (
        <div className="grid gap-6 md:grid-cols-[1fr_14rem]">
          <div>
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-surface p-3">
              {provider ? (
                <ProviderAvatar provider={provider} className="size-12 rounded-lg" />
              ) : (
                <span className="flex size-12 items-center justify-center rounded-lg bg-white text-xs font-semibold text-muted">None</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{booking.providerName ?? 'No professional assigned'}</p>
                <p className="text-sm text-muted">
                  {booking.category}
                  {booking.status === 'searching' && ` · offered to ${booking.offerCount} so far`}
                </p>
              </div>
              <StatusBadge status={booking.status} />
            </div>
            <dl className="divide-y divide-line">
              <Row label="Service">{booking.service}</Row>
              <Row label="When">{booking.mode === 'scheduled' ? `${formatDisplayDate(booking.date)} · ${formatTimeSlot(booking.timeSlot)}` : `Now · ${formatDisplayDate(booking.date)}`}</Row>
              <Row label="Customer">{booking.customerName}</Row>
              <Row label="Mobile">{booking.phone}</Row>
              <Row label="Address">
                {booking.address}, {booking.locality}
              </Row>
              {booking.description && <Row label="Note">{booking.description}</Row>}
              <Row label="Fare">
                {formatCurrency(booking.fare.total)}
                {booking.fare.surge > 1 && ` (incl. ${booking.fare.surge}× demand)`} · {booking.payment === 'upi' ? 'UPI' : 'Cash'} after service
              </Row>
              {booking.declinedBy.length > 0 && <Row label="Declined / timed out">{booking.declinedBy.map((id) => getProviderById(id)?.name ?? id).join(', ')}</Row>}
              <Row label="Requested">{formatDateTime(booking.createdAt)}</Row>
              {booking.review && (
                <Row label="Customer review">
                  <span className="text-amber-400" aria-hidden="true">
                    {'★'.repeat(booking.review.rating)}
                  </span>
                  <span className="text-slate-300" aria-hidden="true">
                    {'★'.repeat(5 - booking.review.rating)}
                  </span>
                  <span className="sr-only"> {booking.review.rating} out of 5</span>
                  {booking.review.comment && <span className="mt-1 block font-normal text-slate-700">{booking.review.comment}</span>}
                </Row>
              )}
            </dl>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">Tracking</h3>
            <BookingTimeline booking={booking} />
          </div>
        </div>
      )}
    </Modal>
  )
}
