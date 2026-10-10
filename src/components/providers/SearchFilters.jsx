import { RotateCcw, Search } from 'lucide-react'
import { LOCALITIES, SERVICE_CATEGORIES } from '../../data/sampleData'
import { RATING_OPTIONS, SORT_OPTIONS } from '../../utils/providerHelpers'
import Button from '../common/Button'
import { InputField, SelectField } from '../common/FormFields'

/** Controlled filter panel. All values live in the URL; this only renders and reports changes. */
export default function SearchFilters({ filters, onChange, onClear, hasActiveFilters }) {
  return (
    <form role="search" aria-label="Filter professionals" onSubmit={(e) => e.preventDefault()} className="space-y-5">
      <div className="relative">
        <InputField
          id="q"
          type="search"
          label="Search"
          placeholder="Name, skill or service"
          value={filters.q}
          onChange={(e) => onChange('q', e.target.value)}
          autoComplete="off"
          className="[&_input]:pl-10"
        />
        <Search className="pointer-events-none absolute bottom-3.5 left-3.5 size-4 text-muted" aria-hidden="true" />
      </div>

      <SelectField id="category" label="Category" value={filters.category} onChange={(e) => onChange('category', e.target.value)}>
        <option value="">All categories</option>
        {SERVICE_CATEGORIES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </SelectField>

      <SelectField id="locality" label="Locality" value={filters.locality} onChange={(e) => onChange('locality', e.target.value)}>
        <option value="">All localities</option>
        {LOCALITIES.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </SelectField>

      <SelectField id="minRating" label="Minimum rating" value={filters.minRating} onChange={(e) => onChange('minRating', e.target.value)}>
        {RATING_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </SelectField>

      <SelectField id="sort" label="Sort by" value={filters.sort} onChange={(e) => onChange('sort', e.target.value)}>
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </SelectField>

      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-line bg-white px-3.5 py-3 text-sm font-medium">
        <input
          type="checkbox"
          checked={filters.availableOnly}
          onChange={(e) => onChange('availableOnly', e.target.checked)}
          className="size-4 rounded accent-ink"
        />
        Available now only
      </label>

      <Button variant="secondary" className="w-full" onClick={onClear} disabled={!hasActiveFilters}>
        <RotateCcw className="size-4" aria-hidden="true" />
        Clear filters
      </Button>
    </form>
  )
}
