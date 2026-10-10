import { useEffect, useState } from 'react'
import { BellRing, CalendarDays, CircleCheckBig, Clock, Inbox, KeyRound, MapPin, Power, Star, TriangleAlert, Wallet } from 'lucide-react'
import Button from '../../components/common/Button'
import ProviderAvatar from '../../components/common/ProviderAvatar'
import RatingDisplay from '../../components/common/RatingDisplay'
import { EmptyState } from '../../components/common/States'
import StatusBadge from '../../components/common/StatusBadge'
import PageContainer from '../../components/layout/PageContainer'
import { ALL_PROVIDERS } from '../../data/sampleData'
import { useBookings } from '../../hooks/useBookings'
import { useNow } from '../../hooks/useNow'
import { usePlatform } from '../../hooks/usePlatform'
import { useToast } from '../../hooks/useToast'
import { ASSIGNED_STATUSES, PROVIDER_NEXT_STEP } from '../../utils/bookingHelpers'
import { distanceLabel } from '../../utils/dispatch'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDateTime, formatDisplayDate, formatTimeSlot, todayISO } from '../../utils/formatDate'
import { partnerEarning } from '../../utils/pricing'
import { getProviderById } from '../../utils/providerHelpers'
import { STORAGE_KEYS, writeJSON } from '../../utils/storage'

const ACCOUNT_MESSAGES = {
  pending: { title: 'Application under review', text: 'An admin is verifying your documents. You can go online once approved.' },
  suspended: { title: 'Account suspended', text: 'Your account has been suspended by an admin. Contact partner support (Phase 2) to resolve this.' },
  rejected: { title: 'Application not approved', text: 'Your application was not approved. Contact partner support (Phase 2) for details.' },
}

/** Countdown ring for an incoming offer. */
function CountdownRing({ msLeft, totalMs }) {
  const fraction = Math.max(0, Math.min(1, msLeft / totalMs))
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <span className="relative flex size-16 shrink-0 items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgb(255 255 255 / 0.15)" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="#FFC61A" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - fraction)} className="transition-[stroke-dashoffset] duration-1000 ease-linear" />
      </svg>
      <span className="text-lg font-extrabold">{Math.ceil(msLeft / 1000)}</span>
    </span>
  )
}

function OfferCard({ booking, provider, now, commissionPct, timeoutMs, onRespond }) {
  const msLeft = booking.offer.expiresAt - now
  return (
    <section aria-labelledby={`offer-${booking.id}`} className="animate-fade-in rounded-3xl bg-ink p-5 text-white shadow-2xl ring-4 ring-primary/40">
      <div className="flex items-start gap-4">
        <CountdownRing msLeft={msLeft} totalMs={timeoutMs} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <BellRing className="size-4" aria-hidden="true" />
            New {booking.mode === 'now' ? 'instant' : 'scheduled'} request
          </p>
          <h2 id={`offer-${booking.id}`} className="mt-1 text-xl font-extrabold">
            {booking.service}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-300">
            <MapPin className="size-4" aria-hidden="true" />
            {booking.locality} · {distanceLabel(provider, booking.locality)}
          </p>
          <p className="mt-0.5 text-sm text-slate-300">
            {booking.mode === 'now' ? 'Needed now' : `${formatDisplayDate(booking.date)} at ${formatTimeSlot(booking.timeSlot)}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">You earn</p>
          <p className="text-2xl font-extrabold text-primary">{formatCurrency(partnerEarning(booking.fare, commissionPct))}</p>
          <p className="text-xs text-slate-400">{booking.payment === 'upi' ? 'UPI' : 'Cash'}</p>
        </div>
      </div>
      {booking.description && <p className="mt-3 rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-200">“{booking.description}”</p>}
      <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2">
        <Button variant="outline-light" size="lg" onClick={() => onRespond(booking, false)}>
          Decline
        </Button>
        <Button size="lg" onClick={() => onRespond(booking, true)}>
          Accept
        </Button>
      </div>
      <p className="mt-2 text-center text-xs text-slate-400" aria-live="polite">
        Auto-skips to the next pro in {Math.max(0, Math.ceil(msLeft / 1000))}s
      </p>
    </section>
  )
}

function JobCard({ booking, onAdvance }) {
  const [otp, setOtp] = useState('')
  const step = PROVIDER_NEXT_STEP[booking.status]
  const needsOtp = booking.status === 'arrived'

  return (
    <article className="rounded-3xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Current job · {booking.id}</p>
          <h3 className="mt-1 text-lg font-extrabold">{booking.service}</h3>
        </div>
        <StatusBadge status={booking.status} />
      </div>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Customer</dt>
          <dd className="font-semibold">{booking.customerName}</dd>
        </div>
        <div>
          <dt className="text-muted">Collect after job</dt>
          <dd className="font-semibold">
            {formatCurrency(booking.fare.total)} · {booking.payment === 'upi' ? 'UPI' : 'Cash'}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted">Address</dt>
          <dd className="font-semibold">
            {booking.address}, {booking.locality}
          </dd>
        </div>
        {booking.description && (
          <div className="sm:col-span-2">
            <dt className="text-muted">Customer note</dt>
            <dd>{booking.description}</dd>
          </div>
        )}
      </dl>
      {step && (
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault()
            if (onAdvance(booking, step.next, otp).ok) setOtp('')
          }}
        >
          {needsOtp && (
            <label className="relative sm:w-40">
              <span className="sr-only">Customer’s 4-digit OTP</span>
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="OTP"
                className="h-12 w-full rounded-xl border border-line pl-9 pr-3 text-lg font-bold tracking-[0.4em] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          )}
          <Button type="submit" size="lg" variant={booking.status === 'in-progress' ? 'success' : 'primary'} className="flex-1" disabled={needsOtp && otp.length !== 4}>
            {step.label}
          </Button>
        </form>
      )}
      {needsOtp && <p className="mt-2 text-xs text-muted">Ask the customer for the 4-digit OTP shown in their app.</p>}
    </article>
  )
}

export default function PartnerApp() {
  const { bookings, respondToOffer, advanceJob, isProviderOnline, setProviderAvailability, dashboardProviderId, setDashboardProviderId } = useBookings()
  const { accounts, settings } = usePlatform()
  const { showToast } = useToast()
  const now = useNow()

  const provider = getProviderById(dashboardProviderId) ?? ALL_PROVIDERS[0]
  const account = accounts[provider.id]
  const online = isProviderOnline(provider)

  // Heartbeat: while this app is open, the demo autopilot leaves this provider's jobs to you.
  useEffect(() => {
    const beat = () => writeJSON(STORAGE_KEYS.partnerLive, { providerId: provider.id, at: Date.now() })
    beat()
    const id = setInterval(beat, 2000)
    return () => clearInterval(id)
  }, [provider.id])

  const mine = bookings.filter((b) => b.providerId === provider.id)
  const offers = bookings.filter((b) => b.status === 'searching' && b.offer?.providerId === provider.id && b.offer.expiresAt > now)
  const current = mine.filter((b) => ASSIGNED_STATUSES.includes(b.status) && (b.mode === 'now' || b.status !== 'accepted'))
  const upcoming = mine.filter((b) => b.status === 'accepted' && b.mode === 'scheduled').sort((a, b) => `${a.date}${a.timeSlot}`.localeCompare(`${b.date}${b.timeSlot}`))
  const history = mine.filter((b) => b.status === 'completed' || b.status === 'cancelled').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const completedToday = mine.filter((b) => b.status === 'completed' && b.updatedAt.slice(0, 10) === new Date().toISOString().slice(0, 10))
  const earningsToday = completedToday.reduce((sum, b) => sum + partnerEarning(b.fare, settings.commissionPct), 0)
  const reviews = mine.filter((b) => b.review).sort((a, b) => b.review.at.localeCompare(a.review.at))

  function toggleDuty() {
    if (account !== 'active') return
    setProviderAvailability(provider.id, !online)
    showToast(online ? 'You are off duty. No new requests.' : 'You are on duty. Requests near you will appear here.', 'info')
  }

  function respond(booking, accept) {
    const result = respondToOffer(booking.id, provider.id, accept)
    showToast(result.ok ? (accept ? 'Job accepted — head to the customer when ready.' : 'Request declined. It goes to the next pro.') : result.error, result.ok ? (accept ? 'success' : 'info') : 'error')
  }

  function advance(booking, next, otp) {
    const result = advanceJob(booking.id, provider.id, next, otp)
    if (result.ok && next === 'completed') showToast(`Job complete. Collect ${formatCurrency(booking.fare.total)} from the customer.`)
    else if (!result.ok) showToast(result.error, 'error')
    return result
  }

  return (
    <>
      <title>Partner App — Home All-Rounder</title>
      <PageContainer className="max-w-4xl py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ProviderAvatar provider={provider} className="size-14 rounded-2xl" />
            <div>
              <h1 className="text-xl font-extrabold">{provider.name}</h1>
              <p className="text-sm text-muted">{provider.category} partner · {provider.locality}</p>
              <RatingDisplay rating={provider.rating} reviewCount={provider.reviewCount} />
            </div>
          </div>
          <label className="w-full sm:w-64">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Signed in as (demo switch)</span>
            <select
              value={provider.id}
              onChange={(e) => setDashboardProviderId(e.target.value)}
              className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm focus:border-accent focus:outline-none"
            >
              {ALL_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.category}
                  {accounts[p.id] !== 'active' ? ` (${accounts[p.id]})` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        {account !== 'active' ? (
          <div role="status" className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <TriangleAlert className="mt-0.5 size-6 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-bold">{ACCOUNT_MESSAGES[account].title}</p>
              <p className="text-sm">{ACCOUNT_MESSAGES[account].text}</p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            role="switch"
            aria-checked={online}
            onClick={toggleDuty}
            className={`mt-6 flex w-full items-center justify-between gap-4 rounded-3xl px-5 py-4 text-left transition-colors ${online ? 'bg-success text-white' : 'bg-slate-800 text-white'}`}
          >
            <span className="flex items-center gap-3">
              <Power className="size-7" aria-hidden="true" />
              <span>
                <span className="block text-lg font-extrabold">{online ? 'ON DUTY' : 'OFF DUTY'}</span>
                <span className="block text-sm opacity-80">{online ? 'Receiving requests near you' : 'Tap to go online and receive requests'}</span>
              </span>
            </span>
            <span className={`relative inline-flex h-8 w-14 items-center rounded-full ${online ? 'bg-white/30' : 'bg-white/15'}`}>
              <span className={`inline-block size-6 rounded-full bg-white shadow transition-transform ${online ? 'translate-x-7' : 'translate-x-1'}`} />
            </span>
          </button>
        )}

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { icon: Wallet, label: 'Earned today', value: formatCurrency(earningsToday) },
            { icon: CircleCheckBig, label: 'Jobs today', value: completedToday.length },
            { icon: Star, label: 'Rating', value: provider.reviewCount ? provider.rating.toFixed(1) : 'New' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl border border-line bg-white p-4">
              <Icon className="size-5 text-primary-ink" aria-hidden="true" />
              <p className="mt-1 text-xl font-extrabold">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          Earnings shown after {settings.commissionPct}% platform commission. Demo figures. While this app is open, demo autopilot won’t act for {provider.name.split(' ')[0]} — you accept and update jobs yourself.
        </p>

        <div className="mt-6 space-y-4" aria-live="polite">
          {offers.map((b) => (
            <OfferCard key={b.id} booking={b} provider={provider} now={now} commissionPct={settings.commissionPct} timeoutMs={settings.offerTimeoutSec * 1000} onRespond={respond} />
          ))}
          {current.map((b) => (
            <JobCard key={b.id} booking={b} onAdvance={advance} />
          ))}
          {offers.length === 0 && current.length === 0 && account === 'active' && (
            <EmptyState
              icon={Inbox}
              title={online ? 'Waiting for requests…' : 'You’re off duty'}
              description={
                online
                  ? `Requests for ${provider.category.toLowerCase()} near ${provider.locality} appear here with a ${settings.offerTimeoutSec}s timer. Tip: book this service from the customer site in another tab.`
                  : 'Go on duty to start receiving nearby requests.'
              }
            />
          )}
        </div>

        <section className="mt-8" aria-labelledby="upcoming-heading">
          <h2 id="upcoming-heading" className="mb-3 flex items-center gap-2 text-lg font-bold">
            <CalendarDays className="size-5" aria-hidden="true" />
            Scheduled jobs
          </h2>
          {upcoming.length ? (
            <ul className="space-y-2">
              {upcoming.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4">
                  <div>
                    <p className="font-semibold">{b.service}</p>
                    <p className="text-sm text-muted">
                      {formatDisplayDate(b.date)} · {formatTimeSlot(b.timeSlot)} · {b.locality} · {b.customerName}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => advance(b, 'on-the-way')} disabled={b.date !== todayISO()} title={b.date !== todayISO() ? 'You can start on the day of the job' : undefined}>
                    <Clock className="size-4" aria-hidden="true" />
                    Start trip
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-line bg-white px-4 py-6 text-center text-sm text-muted">No scheduled jobs.</p>
          )}
        </section>

        <section className="mt-8" aria-labelledby="history-heading">
          <h2 id="history-heading" className="mb-3 text-lg font-bold">
            Recent jobs
          </h2>
          {history.length ? (
            <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
              {history.slice(0, 8).map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{b.service}</p>
                    <p className="text-muted">
                      {formatDisplayDate(b.date)} · {b.locality}
                    </p>
                  </div>
                  <div className="text-right">
                    {b.status === 'completed' ? <p className="font-bold">{formatCurrency(partnerEarning(b.fare, settings.commissionPct))}</p> : <StatusBadge status={b.status} />}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-line bg-white px-4 py-6 text-center text-sm text-muted">No completed jobs yet.</p>
          )}
        </section>

        <section className="mt-8" aria-labelledby="reviews-heading">
          <h2 id="reviews-heading" className="mb-3 text-lg font-bold">
            Customer ratings
          </h2>
          {reviews.length ? (
            <ul className="space-y-2">
              {reviews.map((b) => (
                <li key={b.id} className="rounded-2xl border border-line bg-white p-4">
                  <p className="text-sm">
                    <span className="text-amber-400" aria-hidden="true">
                      {'★'.repeat(b.review.rating)}
                    </span>
                    <span className="text-slate-300" aria-hidden="true">
                      {'★'.repeat(5 - b.review.rating)}
                    </span>
                    <span className="sr-only">{b.review.rating} out of 5</span>
                    <span className="ml-2 font-semibold">{b.customerName}</span>
                    <span className="text-muted"> · {formatDateTime(b.review.at)}</span>
                  </p>
                  {b.review.comment && <p className="mt-1 text-sm text-slate-700">{b.review.comment}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-line bg-white px-4 py-6 text-center text-sm text-muted">No ratings yet.</p>
          )}
        </section>
      </PageContainer>
    </>
  )
}
