import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BadgeIndianRupee, CalendarClock, MapPinned, Quote, RotateCcw, Search, ShieldCheck, Timer, Zap } from 'lucide-react'
import Button from '../components/common/Button'
import { SectionHeading } from '../components/common/Headings'
import SmartImage from '../components/common/SmartImage'
import LocationPill from '../components/layout/LocationPill'
import PageContainer from '../components/layout/PageContainer'
import { getCategoryIcon } from '../components/services/categoryIcons'
import { HERO_IMAGE, SAMPLE_TESTIMONIALS, SERVICE_CATEGORIES, SERVICE_ITEMS } from '../data/sampleData'
import { useBookings } from '../hooks/useBookings'
import { useCustomer, usePlatform } from '../hooks/usePlatform'
import { formatCurrency } from '../utils/formatCurrency'
import { getServiceItems } from '../utils/pricing'

const STEPS = [
  { icon: Search, title: 'Pick a service', text: 'Choose what needs fixing and where.' },
  { icon: BadgeIndianRupee, title: 'See the price upfront', text: 'Fixed labour fare before you book. Pay after the job.' },
  { icon: Zap, title: 'Get matched instantly', text: 'We offer your job to the nearest available pro.' },
  { icon: MapPinned, title: 'Track & share OTP', text: 'Follow your pro, then share the OTP to start.' },
]

const PROMISES = [
  { icon: Timer, title: 'Fast matching', text: 'Requests go to the nearest online professional first, then the next.' },
  { icon: BadgeIndianRupee, title: 'Upfront pricing', text: 'You see the full labour fare and fees before you confirm.' },
  { icon: ShieldCheck, title: 'OTP-secured start', text: 'The job starts only when you share your 4-digit code.' },
  { icon: CalendarClock, title: 'Now or later', text: 'Book for right now, or schedule a slot that suits you.' },
]

/** Finds a category (and item) matching free text, e.g. "fan" → Electrical · Ceiling fan installation. */
function matchQuery(query) {
  const q = query.trim().toLowerCase()
  if (!q) return null
  for (const category of SERVICE_CATEGORIES) {
    if (category.name.toLowerCase().includes(q)) return { categoryId: category.id }
    const item = SERVICE_ITEMS[category.id].find((i) => i.name.toLowerCase().includes(q))
    if (item) return { categoryId: category.id, itemId: item.id }
  }
  return null
}

function HeroSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const match = matchQuery(query)
    if (match) navigate(`/book-now/${match.categoryId}${match.itemId ? `?item=${match.itemId}` : ''}`)
    else navigate(`/providers${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`)
  }

  return (
    <form role="search" aria-label="Find a service" onSubmit={handleSubmit} className="flex gap-2 rounded-2xl bg-white p-2 shadow-xl shadow-amber-900/10">
      <label className="relative flex-1">
        <span className="sr-only">What needs fixing?</span>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          type="search"
          list="service-suggestions"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What needs fixing? e.g. fan, leak, AC"
          className="h-12 w-full rounded-xl border-0 bg-transparent pl-11 pr-3 text-base text-ink placeholder:text-slate-400 focus:bg-surface focus:outline-none"
        />
        <datalist id="service-suggestions">
          {Object.values(SERVICE_ITEMS)
            .flat()
            .map((item) => (
              <option key={item.id} value={item.name} />
            ))}
        </datalist>
      </label>
      <Button type="submit" variant="dark" size="lg">
        Go
      </Button>
    </form>
  )
}

export default function Home() {
  const { bookings, isProviderOnline } = useBookings()
  const { activeProviders, isCategoryEnabled, fares } = usePlatform()
  const { profile } = useCustomer()
  const categories = SERVICE_CATEGORIES.filter((c) => isCategoryEnabled(c.id))

  const onlineNearby = (category) =>
    activeProviders.filter(
      (p) => p.category === category.name && isProviderOnline(p) && (!profile.locality || p.serviceAreas.includes(profile.locality)),
    ).length
  const fromFare = (category) => Math.min(...getServiceItems(category.id, fares).map((i) => i.fare))

  // "Book again": most recent completed booking per service item.
  const seen = new Set()
  const rebook = bookings
    .filter((b) => b.status === 'completed' && isCategoryEnabled(b.categoryId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .filter((b) => !seen.has(b.itemId) && seen.add(b.itemId))
    .slice(0, 3)

  return (
    <>
      <title>Home All-Rounder — Your Home, Our Priority</title>

      {/* Hero */}
      <section className="relative overflow-hidden bg-primary">
        <PageContainer className="relative grid items-center gap-10 pb-14 pt-10 sm:pb-16 sm:pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:pb-20 lg:pt-16">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-slate-800">
              {profile.name ? `Hi ${profile.name.split(' ')[0]}` : 'Home services in minutes'}
            </p>
            <h1 className="mt-3 text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">Your Home, Our Priority.</h1>
            <p className="mt-4 max-w-xl text-lg text-slate-800">
              Find reliable local professionals for every home repair and maintenance need — matched in seconds, priced upfront.
            </p>
            <div className="mt-6 max-w-xl space-y-3">
              <LocationPill tone="dark" />
              <HeroSearch />
            </div>
          </div>
          <SmartImage
            src={HERO_IMAGE}
            alt="Home-service professional fitting a window frame in a bright apartment"
            className="hidden aspect-[5/4] w-full rounded-3xl shadow-2xl shadow-amber-900/20 ring-8 ring-white/40 lg:block"
            fetchPriority="high"
            loading="eager"
            width="640"
            height="512"
          />
        </PageContainer>
      </section>

      {/* Service tiles, like ride types */}
      <section className="relative z-10 -mt-8 pb-4" aria-labelledby="services-heading">
        <PageContainer>
          <div className="rounded-3xl border border-line bg-white p-4 shadow-lg sm:p-6">
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 id="services-heading" className="text-xl font-extrabold sm:text-2xl">
                Book a service
              </h2>
              <Link to="/services" className="text-sm font-semibold text-accent hover:underline">
                View all
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
              {categories.map((category) => {
                const Icon = getCategoryIcon(category.icon)
                const online = onlineNearby(category)
                return (
                  <li key={category.id}>
                    <Link
                      to={`/book-now/${category.id}`}
                      className="group flex h-full flex-col rounded-2xl border border-line p-3 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
                    >
                      <span className={`flex size-12 items-center justify-center rounded-xl ring-1 ${category.tint}`}>
                        <Icon className="size-6" aria-hidden="true" />
                      </span>
                      <span className="mt-3 font-bold leading-tight">{category.name}</span>
                      <span className="mt-0.5 text-xs text-muted">from {formatCurrency(fromFare(category))}</span>
                      <span className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold ${online ? 'text-success' : 'text-slate-500'}`}>
                        <span className={`size-1.5 rounded-full ${online ? 'bg-success' : 'bg-slate-300'}`} aria-hidden="true" />
                        {online ? `${online} pro${online > 1 ? 's' : ''} online${profile.locality ? ' nearby' : ''}` : 'Schedule only'}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </PageContainer>
      </section>

      {rebook.length > 0 && (
        <section className="py-8" aria-labelledby="rebook-heading">
          <PageContainer>
            <h2 id="rebook-heading" className="mb-4 text-lg font-extrabold">
              Book again
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rebook.map((b) => (
                <li key={b.id}>
                  <Link
                    to={`/book-now/${b.categoryId}?item=${b.itemId}`}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 transition-shadow hover:shadow-md"
                  >
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary-ink">
                      <RotateCcw className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{b.service}</span>
                      <span className="block truncate text-sm text-muted">
                        {b.category} · last with {b.providerName}
                      </span>
                    </span>
                    <ArrowRight className="size-5 text-slate-400" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </PageContainer>
        </section>
      )}

      {/* How it works */}
      <section className="py-12 sm:py-14" aria-labelledby="how-heading">
        <PageContainer>
          <SectionHeading id="how-heading" align="center" eyebrow="How it works" title="As quick as booking a ride" />
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="relative rounded-2xl border border-line bg-white p-5">
                <span className="absolute right-4 top-3 text-3xl font-extrabold text-slate-100" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-on-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-bold">
                  <span className="sr-only">Step {index + 1}: </span>
                  {title}
                </h3>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </PageContainer>
      </section>

      <section className="border-y border-line bg-white py-12 sm:py-14" aria-labelledby="why-heading">
        <PageContainer>
          <SectionHeading id="why-heading" align="center" eyebrow="Why Home All-Rounder" title="Built for speed and clarity" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROMISES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl bg-surface p-5">
                <Icon className="size-6 text-primary-ink" aria-hidden="true" />
                <h3 className="mt-3 font-bold">{title}</h3>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      <section className="py-12 sm:py-14" aria-labelledby="testimonials-heading">
        <PageContainer>
          <SectionHeading id="testimonials-heading" align="center" eyebrow="Testimonials" title="What a booking experience should feel like" />
          <div className="grid gap-4 md:grid-cols-3">
            {SAMPLE_TESTIMONIALS.map((t) => (
              <figure key={t.id} className="flex flex-col rounded-2xl border border-line bg-white p-6">
                <Quote className="size-7 text-primary" fill="currentColor" aria-hidden="true" />
                <blockquote className="mt-3 flex-1">“{t.quote}”</blockquote>
                <figcaption className="mt-4 border-t border-line pt-3 text-sm">
                  <span className="font-bold">{t.name}</span>
                  <span className="text-muted">
                    {' '}
                    · {t.locality} · {t.service}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-4 text-center text-sm text-muted">Sample testimonials for demonstration purposes.</p>
        </PageContainer>
      </section>
    </>
  )
}
