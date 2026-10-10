import { useState } from 'react'
import { useBookings } from '../../hooks/useBookings'
import { useToast } from '../../hooks/useToast'
import { canTransition } from '../../utils/bookingHelpers'
import ConfirmDialog from '../common/ConfirmDialog'

const ACTIONS = {
  reassign: {
    label: 'Reassign',
    title: 'Reassign this booking?',
    text: (b) => `${b.providerName} will be removed and the request offered to the next nearest professional.`,
    confirm: 'Reassign',
  },
  redispatch: {
    label: 'Search again',
    title: 'Search again?',
    text: () => 'The request goes back into matching and is offered to available professionals.',
    confirm: 'Search again',
  },
  cancel: {
    label: 'Cancel',
    title: 'Cancel this booking?',
    text: (b) => `Booking ${b.id} for ${b.customerName} will be cancelled and the customer will see “Cancelled by support”.`,
    confirm: 'Cancel booking',
  },
}

/** Operational actions an admin can take on a booking; only valid ones are shown. */
export default function AdminBookingActions({ booking, compact = false }) {
  const { adminCancel, adminRedispatch } = useBookings()
  const { showToast } = useToast()
  const [pending, setPending] = useState(null)

  const available = [
    canTransition(booking.status, 'searching', 'admin') && booking.providerId && 'reassign',
    canTransition(booking.status, 'searching', 'admin') && !booking.providerId && 'redispatch',
    canTransition(booking.status, 'cancelled', 'admin') && 'cancel',
  ].filter(Boolean)

  if (!available.length) return compact ? null : <span className="text-xs text-muted">No actions</span>

  function run() {
    const result = pending === 'cancel' ? adminCancel(booking.id) : adminRedispatch(booking.id)
    showToast(result.ok ? `${ACTIONS[pending].confirm}: ${booking.id}` : result.error, result.ok ? 'success' : 'error')
    setPending(null)
  }

  return (
    <>
      <span className="inline-flex flex-wrap gap-1.5">
        {available.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setPending(key)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset transition-colors ${
              key === 'cancel' ? 'text-danger ring-red-200 hover:bg-red-50' : 'text-ink ring-line hover:bg-slate-50'
            }`}
          >
            {ACTIONS[key].label}
          </button>
        ))}
      </span>
      <ConfirmDialog
        open={pending != null}
        title={pending ? ACTIONS[pending].title : ''}
        description={pending ? ACTIONS[pending].text(booking) : ''}
        confirmLabel={pending ? ACTIONS[pending].confirm : ''}
        tone={pending === 'cancel' ? 'danger' : 'primary'}
        onConfirm={run}
        onCancel={() => setPending(null)}
      />
    </>
  )
}
