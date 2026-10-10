import { useState } from 'react'
import { Check, MapPin, Search } from 'lucide-react'
import { LOCALITIES } from '../../data/sampleData'
import { useCustomer } from '../../hooks/usePlatform'
import Modal from '../common/Modal'

/** "Where do you need the service?" — the locality used for matching nearby professionals. */
export default function LocationDialog({ open, onClose }) {
  const { profile, setLocality } = useCustomer()
  const [query, setQuery] = useState('')
  const matches = LOCALITIES.filter((l) => l.toLowerCase().includes(query.trim().toLowerCase()))

  function choose(locality) {
    setLocality(locality)
    setQuery('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Set your location" description="We match you with professionals nearest to this locality (Pune demo).">
      <label className="relative block">
        <span className="sr-only">Search localities</span>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your area"
          className="h-11 w-full rounded-xl border border-line pl-10 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </label>
      <ul className="mt-3 max-h-80 divide-y divide-line overflow-y-auto rounded-xl border border-line">
        {matches.map((locality) => (
          <li key={locality}>
            <button
              type="button"
              onClick={() => choose(locality)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-surface"
            >
              <MapPin className="size-4 shrink-0 text-muted" aria-hidden="true" />
              <span className="flex-1 font-medium">{locality}, Pune</span>
              {profile.locality === locality && <Check className="size-4 text-success" aria-label="Selected" />}
            </button>
          </li>
        ))}
        {matches.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">No locality matches “{query}”.</li>}
      </ul>
    </Modal>
  )
}
