import { Link, useParams } from 'react-router-dom'
import { BriefcaseBusiness, CalendarCheck, ChevronRight, MapPin, MessageSquareText, Star } from 'lucide-react'
import Button from '../components/common/Button'
import DemoDataNotice from '../components/common/DemoDataNotice'
import PriceDisplay from '../components/common/PriceDisplay'
import ProviderAvatar from '../components/common/ProviderAvatar'
import RatingDisplay from '../components/common/RatingDisplay'
import { ErrorState } from '../components/common/States'
import PageContainer from '../components/layout/PageContainer'
import AvailabilityPill from '../components/providers/AvailabilityPill'
import { getCategoryIcon } from '../components/services/categoryIcons'
import { useBookings } from '../hooks/useBookings'
import { usePlatform } from '../hooks/usePlatform'
import { formatCurrency } from '../utils/formatCurrency'
import { formatReviewDate } from '../utils/formatDate'
import { getCategoryByName, getProviderById } from '../utils/providerHelpers'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function Card({ title, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-line bg-white p-5 sm:p-6 ${className}`}>
      {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
      {children}
    </section>
  )
}

/** Request card: ride-hailing style — no slot hunting here, the request flow handles timing. */
function RequestPanel({ provider, available, categoryId }) {
  return (
    <Card title={available ? 'Request this professional' : 'Currently offline'}>
      <p className="text-sm text-muted">
        {available
          ? `Your request is offered to ${provider.name.split(' ')[0]} first. If they can’t take it, we match the next nearest pro automatically.`
          : `${provider.name} is offline right now. You can schedule a visit, or get matched with another available pro.`}
      </p>
      <div className="mt-5 border-t border-line pt-5">
        <PriceDisplay price={provider.price} unit={provider.priceUnit} />
        <Button to={`/book-now/${categoryId}?pro=${provider.id}`} size="lg" className="mt-4 w-full">
          <CalendarCheck className="size-5" aria-hidden="true" />
          {available ? 'Book Now' : 'Schedule with this pro'}
        </Button>
        <Button to={`/book-now/${categoryId}`} variant="secondary" className="mt-2 w-full">
          Match me with any nearby pro
        </Button>
      </div>
    </Card>
  )
}

export default function ProviderDetails() {
  const { id } = useParams()
  const { isProviderOnline } = useBookings()
  const { isProviderActive } = usePlatform()
  const found = getProviderById(id)
  const provider = found && isProviderActive(found.id) ? found : null

  if (!provider) {
    return (
      <PageContainer className="py-16">
        <title>Professional not found — Home All-Rounder</title>
        <ErrorState
          title="We couldn’t find that professional"
          description="The profile link may be mistyped or the profile is no longer listed in this demo."
        >
          <Button to="/providers">Back to provider search</Button>
          <Button to="/" variant="secondary">
            Go to Home
          </Button>
        </ErrorState>
      </PageContainer>
    )
  }

  const available = isProviderOnline(provider)
  const category = getCategoryByName(provider.category)
  const CategoryIcon = getCategoryIcon(category?.icon)
  const workingDays = DAY_NAMES.filter((_, i) => !provider.offDays.includes(i))

  return (
    <>
      <title>{`${provider.name} · ${provider.category} — Home All-Rounder`}</title>
      <PageContainer className="py-8 sm:py-10">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
            <li>
              <Link to="/providers" className="hover:text-accent">
                Professionals
              </Link>
            </li>
            {category && (
              <li className="flex items-center gap-1">
                <ChevronRight className="size-4" aria-hidden="true" />
                <Link to={`/providers?category=${category.id}`} className="hover:text-accent">
                  {category.name}
                </Link>
              </li>
            )}
            <li className="flex items-center gap-1 font-medium text-ink" aria-current="page">
              <ChevronRight className="size-4 text-muted" aria-hidden="true" />
              {provider.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="min-w-0 space-y-6">
            <section className="overflow-hidden rounded-2xl border border-line bg-white">
              <div className="relative">
                <ProviderAvatar
                  provider={{ ...provider, image: provider.image.replace(/w=\d+/, 'w=1100') }}
                  name={provider.name}
                  className="h-64 w-full object-[center_30%] sm:h-80"
                  textClassName="text-5xl"
                  loading="eager"
                />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <AvailabilityPill available={available} className="bg-white" />
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Demo provider
                  </span>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <h1 className="text-2xl font-extrabold sm:text-3xl">{provider.name}</h1>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <CategoryIcon className="size-4" aria-hidden="true" />
                  {provider.category} Specialist
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <RatingDisplay rating={provider.rating} reviewCount={provider.reviewCount} reviewLabel />
                  <span className="inline-flex items-center gap-1 text-muted">
                    <MapPin className="size-4" aria-hidden="true" />
                    {provider.locality}, Pune
                  </span>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { icon: BriefcaseBusiness, label: 'Experience', value: `${provider.experience} years` },
                    { icon: Star, label: 'Demo rating', value: provider.rating.toFixed(1) },
                    { icon: MessageSquareText, label: 'Sample reviews', value: provider.reviewCount },
                    { icon: MapPin, label: 'Service areas', value: provider.serviceAreas.length },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex flex-col items-center gap-1 rounded-xl border border-line px-2 py-3 text-center">
                      <Icon className="size-6 text-success" aria-hidden="true" />
                      <dd className="text-base font-bold text-ink">{value}</dd>
                      <dt className="text-xs text-muted">{label}</dt>
                    </div>
                  ))}
                </dl>

                <div className="mt-5 flex items-center justify-between gap-4 border-t border-line pt-5">
                  <p className="leading-tight">
                    <span className="block text-2xl font-extrabold">{formatCurrency(provider.price)}</span>
                    <span className="text-sm text-muted">{provider.priceUnit}</span>
                  </p>
                  {available ? (
                    <Button to={`/book-now/${category?.id}?pro=${provider.id}`} size="lg" className="px-8 lg:hidden">
                      Book Now
                    </Button>
                  ) : (
                    <span className="text-sm text-muted lg:hidden">Currently unavailable</span>
                  )}
                </div>
              </div>
            </section>

            <Card title="About">
              <p className="leading-relaxed text-slate-700">{provider.description}</p>
              <h3 className="mb-2 mt-5 text-sm font-semibold uppercase tracking-wider text-muted">Skills</h3>
              <ul className="flex flex-wrap gap-2">
                {provider.skills.map((skill) => (
                  <li key={skill} className="rounded-lg bg-primary-soft px-3 py-1 text-sm font-medium text-ink">
                    {skill}
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Services offered">
              <ul className="flex flex-wrap gap-2">
                {provider.services.map((service) => (
                  <li key={service} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                    {service}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted">
                Works {workingDays.join(', ')}. Indicative price from the starting rate; the final amount depends on the job.
              </p>
            </Card>

            <Card title="Customer reviews">
              <p className="-mt-2 mb-4 text-sm text-muted">Sample reviews for demonstration — not real customer feedback.</p>
              <ul className="divide-y divide-line">
                {provider.reviews.map((review) => (
                  <li key={review.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{review.author}</p>
                      <p className="text-xs text-muted">{formatReviewDate(review.date)}</p>
                    </div>
                    <div className="mt-1 flex gap-0.5" role="img" aria-label={`${review.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className="size-4"
                          fill={i < review.rating ? '#FFC61A' : 'none'}
                          stroke={i < review.rating ? '#F5B800' : '#cbd5e1'}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{review.comment}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
            <RequestPanel provider={provider} available={available} categoryId={category?.id} />
            <DemoDataNotice>This is a fictional demo profile. Photo from Pexels; the person pictured is not this provider.</DemoDataNotice>
          </div>
        </div>
      </PageContainer>
    </>
  )
}
