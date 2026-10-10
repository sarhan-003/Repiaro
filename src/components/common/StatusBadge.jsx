import { Ban, Bike, CircleCheckBig, CircleX, MapPinCheck, Radar, UserCheck, Wrench } from 'lucide-react'
import { STATUS_META } from '../../utils/bookingHelpers'

const TONES = {
  warning: 'bg-amber-50 text-warning ring-amber-200',
  info: 'bg-sky-50 text-sky-800 ring-sky-200',
  danger: 'bg-red-50 text-danger ring-red-200',
  primary: 'bg-primary-soft text-primary-ink ring-amber-200',
  success: 'bg-green-50 text-success ring-green-200',
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
}

const ICONS = {
  searching: Radar,
  accepted: UserCheck,
  'on-the-way': Bike,
  arrived: MapPinCheck,
  'in-progress': Wrench,
  completed: CircleCheckBig,
  cancelled: Ban,
  unfulfilled: CircleX,
}

/** Status pill: icon + text, so meaning never relies on colour alone. */
export default function StatusBadge({ status, className = '' }) {
  const meta = STATUS_META[status] ?? { label: status, tone: 'neutral' }
  const Icon = ICONS[status] ?? Radar
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${TONES[meta.tone]} ${className}`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {meta.label}
    </span>
  )
}
