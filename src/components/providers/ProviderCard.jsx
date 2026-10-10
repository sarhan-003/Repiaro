import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { formatCurrency } from '../../utils/formatCurrency'
import { getCategoryByName } from '../../utils/providerHelpers'
import Button from '../common/Button'
import ProviderAvatar from '../common/ProviderAvatar'
import RatingDisplay from '../common/RatingDisplay'
import AvailabilityPill from './AvailabilityPill'

/** Horizontal provider list card: photo, rating, area, skills, price and Book Now. */
export default function ProviderCard({ provider, available }) {
  const profileUrl = `/providers/${provider.id}`

  return (
    <article className="flex h-full gap-4 rounded-2xl border border-line bg-white p-4 transition-shadow hover:shadow-md">
      <Link to={profileUrl} tabIndex={-1} aria-hidden="true" className="shrink-0">
        <ProviderAvatar provider={provider} className="size-24 rounded-xl sm:size-28" textClassName="text-2xl" width="112" height="112" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-col items-start gap-1 sm:flex-row sm:justify-between sm:gap-2">
          <div className="min-w-0 max-w-full">
            <h3 className="truncate text-base font-bold sm:text-lg">
              <Link to={profileUrl} className="hover:text-accent">
                {provider.name}
              </Link>
            </h3>
            <p className="text-xs font-medium text-muted">
              {provider.category} · Demo provider
            </p>
          </div>
          <AvailabilityPill available={available} className="shrink-0" />
        </div>

        <RatingDisplay rating={provider.rating} reviewCount={provider.reviewCount} reviewLabel className="mt-1.5" />

        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {provider.locality} · {provider.experience} yrs exp
          </span>
        </p>

        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Skills">
          {provider.skills.slice(0, 2).map((skill) => (
            <li key={skill} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {skill}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
          <p className="leading-tight">
            <span className="block text-lg font-extrabold text-ink">{formatCurrency(provider.price)}</span>
            <span className="text-xs text-muted">{provider.priceUnit}</span>
          </p>
          <div className="flex gap-2">
            <Button to={profileUrl} variant="secondary" size="sm" aria-label={`View profile of ${provider.name}`}>
              Profile
            </Button>
            {available ? (
              <Button to={`/book-now/${getCategoryByName(provider.category)?.id}?pro=${provider.id}`} size="sm" className="px-4" aria-label={`Book ${provider.name}`}>
                Book Now
              </Button>
            ) : (
              <Button size="sm" disabled title="Not accepting bookings right now" aria-describedby={`unavailable-${provider.id}`}>
                Book Now
              </Button>
            )}
          </div>
        </div>
        {!available && (
          <p id={`unavailable-${provider.id}`} className="mt-1.5 text-right text-xs text-muted">
            Not accepting bookings right now.
          </p>
        )}
      </div>
    </article>
  )
}
