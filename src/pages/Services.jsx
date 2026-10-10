import { useState } from 'react'
import { Search, SearchX } from 'lucide-react'
import Button from '../components/common/Button'
import { PageHeader } from '../components/common/Headings'
import { EmptyState } from '../components/common/States'
import PageContainer from '../components/layout/PageContainer'
import ServiceCard from '../components/services/ServiceCard'
import { SERVICE_CATEGORIES } from '../data/sampleData'
import { usePlatform } from '../hooks/usePlatform'

export default function Services() {
  const [query, setQuery] = useState('')
  const { activeProviders, isCategoryEnabled } = usePlatform()
  const term = query.trim().toLowerCase()
  const available = SERVICE_CATEGORIES.filter((c) => isCategoryEnabled(c.id))
  const results = available.filter(
    (c) => !term || c.name.toLowerCase().includes(term) || c.description.toLowerCase().includes(term),
  )

  return (
    <>
      <title>All Services — Home All-Rounder</title>
      <PageHeader
        eyebrow="Service catalogue"
        title="All home services"
        description="From a dripping tap to a full repaint — pick a category to compare local professionals who offer it."
      >
        <label className="relative block w-full lg:w-80">
          <span className="sr-only">Search services</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services, e.g. leak, fan, lawn"
            className="h-11 w-full rounded-lg border border-line bg-white pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
      </PageHeader>

      <PageContainer className="py-10 sm:py-12">
        <p className="mb-5 text-sm text-muted" aria-live="polite">
          {results.length === available.length
            ? `${results.length} service categories`
            : `${results.length} of ${available.length} categories match “${query.trim()}”`}
        </p>
        {results.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((category) => (
              <ServiceCard
                key={category.id}
                category={category}
                providerCount={activeProviders.filter((p) => p.category === category.name).length}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={SearchX}
            title="No services match your search"
            description="Try a broader word such as “repair”, “cleaning” or “garden”, or browse every professional instead."
          >
            <Button variant="secondary" onClick={() => setQuery('')}>
              Clear search
            </Button>
            <Button to="/providers">Browse all professionals</Button>
          </EmptyState>
        )}
      </PageContainer>
    </>
  )
}
