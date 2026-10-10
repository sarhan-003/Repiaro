import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchX, SlidersHorizontal, X } from 'lucide-react'
import Button from '../components/common/Button'
import DemoDataNotice from '../components/common/DemoDataNotice'
import { PageHeader } from '../components/common/Headings'
import { EmptyState } from '../components/common/States'
import PageContainer from '../components/layout/PageContainer'
import ProviderCard from '../components/providers/ProviderCard'
import SearchFilters from '../components/providers/SearchFilters'
import { LOCALITIES } from '../data/sampleData'
import { useBookings } from '../hooks/useBookings'
import { usePlatform } from '../hooks/usePlatform'
import { filterProviders, getCategoryById, RATING_OPTIONS, SORT_OPTIONS, sortProviders } from '../utils/providerHelpers'

// Filter key → URL parameter. The URL is the single source of truth for filters,
// so searches are shareable and back/forward navigation restores them.
const PARAM = { q: 'q', category: 'category', locality: 'locality', minRating: 'rating', sort: 'sort', availableOnly: 'available' }

function readFilters(params) {
  const pick = (name, valid) => {
    const value = params.get(name) ?? ''
    return valid(value) ? value : ''
  }
  return {
    q: (params.get(PARAM.q) ?? '').slice(0, 80),
    category: pick(PARAM.category, (v) => Boolean(getCategoryById(v))),
    locality: pick(PARAM.locality, (v) => LOCALITIES.includes(v)),
    minRating: pick(PARAM.minRating, (v) => RATING_OPTIONS.some((o) => o.value === v)),
    sort: pick(PARAM.sort, (v) => SORT_OPTIONS.some((o) => o.value === v)) || 'recommended',
    availableOnly: params.get(PARAM.availableOnly) === '1',
  }
}

export default function Providers() {
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { isProviderOnline } = useBookings()
  const { activeProviders } = usePlatform()
  const filters = readFilters(params)

  const results = sortProviders(filterProviders(activeProviders, filters, isProviderOnline), filters.sort, isProviderOnline)
  const category = getCategoryById(filters.category)

  function updateFilter(key, value) {
    const isDefault = value === '' || value === false || (key === 'sort' && value === 'recommended')
    // Start from the live URL rather than this render's params, so rapid successive
    // changes build on each other (React Router's updater does not queue them).
    const next = new URLSearchParams(window.location.search)
    if (isDefault) next.delete(PARAM[key])
    else next.set(PARAM[key], value === true ? '1' : value)
    // Typing should not create a history entry per keystroke.
    setParams(next, { replace: key === 'q' })
  }

  const clearFilters = () => setParams({})

  const chips = [
    filters.q && { key: 'q', label: `“${filters.q}”` },
    category && { key: 'category', label: category.name },
    filters.locality && { key: 'locality', label: filters.locality },
    filters.minRating && { key: 'minRating', label: `${filters.minRating}+ rating` },
    filters.availableOnly && { key: 'availableOnly', label: 'Available now' },
  ].filter(Boolean)
  const hasActiveFilters = chips.length > 0 || filters.sort !== 'recommended'

  // One-tap shortcuts shown as pills above the results, as in the reference list screen.
  const quickFilters = [
    {
      label: 'All',
      active: !filters.minRating && !filters.availableOnly && filters.sort === 'recommended',
      onClick: () => {
        const next = new URLSearchParams(window.location.search)
        ;[PARAM.minRating, PARAM.availableOnly, PARAM.sort].forEach((name) => next.delete(name))
        setParams(next)
      },
    },
    { label: 'Top rated', active: filters.minRating === '4.5', onClick: () => updateFilter('minRating', filters.minRating === '4.5' ? '' : '4.5') },
    { label: 'Available now', active: filters.availableOnly, onClick: () => updateFilter('availableOnly', !filters.availableOnly) },
    {
      label: 'Lowest price',
      active: filters.sort === 'price-asc',
      onClick: () => updateFilter('sort', filters.sort === 'price-asc' ? 'recommended' : 'price-asc'),
    },
  ]

  return (
    <>
      <title>{`${category ? `${category.name} professionals` : 'Find Professionals'} — Home All-Rounder`}</title>
      <PageHeader
        eyebrow="Find professionals"
        title={category ? `${category.name} professionals` : 'Local home-service professionals'}
        description="Compare skills, experience, demo ratings and indicative prices, then book a time that suits you."
      />

      <PageContainer className="py-8 sm:py-10">
        <DemoDataNotice className="mb-6" />

        <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
          <aside aria-label="Filters">
            <Button
              variant="secondary"
              className="w-full lg:hidden"
              aria-expanded={filtersOpen}
              aria-controls="provider-filters"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              {filtersOpen ? 'Hide filters' : 'Show filters'}
              {chips.length > 0 && <span className="rounded-full bg-primary px-1.5 text-xs text-on-primary">{chips.length}</span>}
            </Button>
            <div
              id="provider-filters"
              className={`${filtersOpen ? 'block' : 'hidden'} mt-4 rounded-2xl border border-line bg-white p-5 lg:sticky lg:top-24 lg:mt-0 lg:block`}
            >
              <SearchFilters filters={filters} onChange={updateFilter} onClear={clearFilters} hasActiveFilters={hasActiveFilters} />
            </div>
          </aside>

          <section aria-labelledby="results-heading">
            <ul className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="Quick filters">
              {quickFilters.map(({ label, active, onClick }) => (
                <li key={label} className="shrink-0">
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={onClick}
                    className={`h-10 rounded-full border px-4 text-sm font-semibold transition-colors ${
                      active ? 'border-primary bg-primary text-on-primary' : 'border-line bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 id="results-heading" className="text-lg font-bold" aria-live="polite">
                {results.length} {results.length === 1 ? 'professional' : 'professionals'} found
              </h2>
              {chips.length > 0 && (
                <ul className="flex flex-wrap gap-2" aria-label="Active filters">
                  {chips.map(({ key, label }) => (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => updateFilter(key, key === 'availableOnly' ? false : '')}
                        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white py-1 pl-3 pr-2 text-sm font-medium text-ink hover:bg-slate-50"
                        aria-label={`Remove filter ${label}`}
                      >
                        {label}
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {results.length > 0 ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {results.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} available={isProviderOnline(provider)} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={SearchX}
                title="No professionals match these filters"
                description="Try removing a filter, choosing a nearby locality or lowering the minimum rating."
              >
                <Button onClick={clearFilters}>Reset all filters</Button>
                <Button to="/services" variant="secondary">
                  Browse services
                </Button>
              </EmptyState>
            )}
          </section>
        </div>
      </PageContainer>
    </>
  )
}
