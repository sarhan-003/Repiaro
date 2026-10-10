import { Link } from 'react-router-dom'

/** House-with-wrench mark used in the brand reference. */
function LogoMark({ className = 'size-9' }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#FFC61A" />
      <path d="M8 19.5 20 9l12 10.5V31a1.5 1.5 0 0 1-1.5 1.5h-21A1.5 1.5 0 0 1 8 31z" fill="#111827" />
      <path
        d="M24.6 17.2a4.2 4.2 0 0 0-5.3 5.3l-4.4 4.4a1.4 1.4 0 0 0 2 2l4.4-4.4a4.2 4.2 0 0 0 5.3-5.3l-2.3 2.3-2-.4-.4-2z"
        fill="#FFC61A"
      />
    </svg>
  )
}

export default function Logo({ inverted = false, subtitle = 'Smart Home Services', onClick }) {
  return (
    <Link to="/" onClick={onClick} className="flex items-center gap-2.5 rounded-lg" aria-label="Home All-Rounder — home">
      <LogoMark />
      <span className="leading-tight">
        <span className={`block text-base font-extrabold ${inverted ? 'text-white' : 'text-ink'}`}>Home All-Rounder</span>
        <span className={`block text-[11px] font-medium ${inverted ? 'text-slate-400' : 'text-muted'}`}>{subtitle}</span>
      </span>
    </Link>
  )
}
