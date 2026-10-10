import { Check } from 'lucide-react'
import { formatDateTime } from '../../utils/formatDate'

const FLOW = [
  { status: 'searching', label: 'Request placed' },
  { status: 'accepted', label: 'Professional assigned' },
  { status: 'on-the-way', label: 'On the way' },
  { status: 'arrived', label: 'Arrived at your address' },
  { status: 'in-progress', label: 'Job started (OTP verified)' },
  { status: 'completed', label: 'Job completed' },
]

const TERMINAL_LABELS = {
  cancelled: (b) => (b.cancelledBy === 'admin' ? 'Cancelled by support' : 'Cancelled by you'),
  unfulfilled: () => 'No professional available',
}

/** Service tracking: the steps a booking has reached, with timestamps. */
export default function BookingTimeline({ booking }) {
  const reachedAt = new Map(booking.statusHistory.map((h) => [h.status, h.at]))
  const terminal = TERMINAL_LABELS[booking.status]?.(booking)

  // Closed bookings show only what actually happened; open ones also show what comes next.
  const steps = terminal ? [...FLOW.filter((s) => reachedAt.has(s.status)), { status: booking.status, label: terminal }] : FLOW

  return (
    <ol className="relative space-y-4">
      {steps.map((step, index) => {
        const done = reachedAt.has(step.status)
        const isCurrent = step.status === booking.status
        const isLast = index === steps.length - 1
        return (
          <li key={step.status} className="relative flex gap-3">
            {!isLast && (
              <span className={`absolute left-[11px] top-6 h-[calc(100%-0.5rem)] w-0.5 ${done ? 'bg-ink/30' : 'bg-line'}`} aria-hidden="true" />
            )}
            <span
              className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full ${
                done ? (terminal && isCurrent ? 'bg-slate-500 text-white' : 'bg-primary text-on-primary') : 'border-2 border-line bg-white'
              } ${isCurrent && !terminal && booking.status !== 'completed' ? 'ring-4 ring-primary/30' : ''}`}
              aria-hidden="true"
            >
              {done && <Check className="size-3.5" />}
            </span>
            <div className="-mt-0.5">
              <p className={`text-sm font-semibold ${done ? 'text-ink' : 'text-muted'}`}>
                {step.label}
                {isCurrent && <span className="sr-only"> (current status)</span>}
              </p>
              <p className="text-xs text-muted">{done ? formatDateTime(reachedAt.get(step.status)) : 'Not yet'}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
