import { useState } from 'react'
import { ChevronDown, MapPin } from 'lucide-react'
import { useCustomer } from '../../hooks/usePlatform'
import LocationDialog from './LocationDialog'

/** Current service location, shown like a ride app's pickup point. */
export default function LocationPill({ className = '', tone = 'light' }) {
  const { profile } = useCustomer()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
          tone === 'dark' ? 'bg-ink text-white hover:bg-slate-800' : 'bg-surface text-ink hover:bg-slate-100'
        } ${className}`}
        aria-label={`Service location: ${profile.locality || 'not set'}. Change location`}
      >
        <MapPin className={`size-4 shrink-0 ${tone === 'dark' ? 'text-primary' : 'text-danger'}`} aria-hidden="true" />
        <span className="truncate">{profile.locality ? `${profile.locality}, Pune` : 'Set location'}</span>
        <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden="true" />
      </button>
      <LocationDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}
