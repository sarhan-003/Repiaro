export default function AvailabilityPill({ available, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        available ? 'bg-green-50 text-success ring-1 ring-green-200' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
      } ${className}`}
    >
      <span className={`size-1.5 rounded-full ${available ? 'bg-success' : 'bg-slate-400'}`} aria-hidden="true" />
      {available ? 'Available' : 'Unavailable'}
    </span>
  )
}
