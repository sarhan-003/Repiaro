import { Link } from 'react-router-dom'
import { BadgeIndianRupee, CircleCheckBig, Gauge, Landmark, ShieldCheck, Users } from 'lucide-react'
import { ConsoleHeader, Panel, StatTile } from '../../components/console/ConsoleUI'
import { ALL_PROVIDERS, SERVICE_CATEGORIES } from '../../data/sampleData'
import { useBookings } from '../../hooks/useBookings'
import { usePlatform } from '../../hooks/usePlatform'
import { BOOKING_STATUSES, STATUS_META } from '../../utils/bookingHelpers'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'
import { platformEarning } from '../../utils/pricing'

export default function SuperOverview() {
  const { bookings } = useBookings()
  const { admins, accounts, settings, audit, categories } = usePlatform()

  const completed = bookings.filter((b) => b.status === 'completed')
  const unfulfilled = bookings.filter((b) => b.status === 'unfulfilled').length
  const gmv = completed.reduce((s, b) => s + b.fare.total, 0)
  const revenue = completed.reduce((s, b) => s + platformEarning(b.fare, settings.commissionPct), 0)
  const fulfilment = completed.length + unfulfilled ? Math.round((completed.length / (completed.length + unfulfilled)) * 100) : 100
  const count = (status) => ALL_PROVIDERS.filter((p) => accounts[p.id] === status).length

  const byCategory = SERVICE_CATEGORIES.map((c) => ({
    ...c,
    total: bookings.filter((b) => b.categoryId === c.id).length,
    gmv: completed.filter((b) => b.categoryId === c.id).reduce((s, b) => s + b.fare.total, 0),
  }))
  const maxTotal = Math.max(1, ...byCategory.map((c) => c.total))

  return (
    <>
      <title>Super Admin — Home All-Rounder</title>
      <ConsoleHeader title="Platform overview" description="All categories, all admins. Figures are computed from demo bookings in this browser." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile icon={BadgeIndianRupee} label="Gross bookings value" value={formatCurrency(gmv)} hint="Completed jobs" />
        <StatTile icon={Landmark} label="Platform revenue" value={formatCurrency(revenue)} hint={`${settings.commissionPct}% commission + fees`} tone="bg-green-50 text-success" />
        <StatTile icon={CircleCheckBig} label="Completed jobs" value={completed.length} tone="bg-green-50 text-success" />
        <StatTile icon={Gauge} label="Fulfilment rate" value={`${fulfilment}%`} hint={`${unfulfilled} unfulfilled`} tone="bg-sky-50 text-sky-700" />
        <StatTile icon={Users} label="Providers" value={count('active')} hint={`${count('pending')} pending · ${count('suspended')} suspended`} tone="bg-violet-50 text-violet-700" />
        <StatTile icon={ShieldCheck} label="Admins" value={admins.filter((a) => a.active).length} hint={`${admins.length} total`} tone="bg-slate-100 text-slate-700" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Bookings by category">
          <ul className="space-y-3 p-5">
            {byCategory.map((c) => (
              <li key={c.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">
                    {c.name}
                    {!categories[c.id]?.enabled && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-muted">Paused</span>}
                    {categories[c.id]?.surge > 1 && <span className="ml-2 rounded bg-orange-50 px-1.5 py-0.5 text-[11px] font-semibold text-orange-700">{categories[c.id].surge}× surge</span>}
                  </span>
                  <span className="text-muted">
                    {c.total} · {formatCurrency(c.gmv)}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100" aria-hidden="true">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(c.total / maxTotal) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-6">
          <Panel title="Booking statuses">
            <ul className="flex flex-wrap gap-2 p-5">
              {BOOKING_STATUSES.map((s) => (
                <li key={s} className="rounded-xl bg-surface px-3 py-2 text-sm">
                  <span className="font-bold">{bookings.filter((b) => b.status === s).length}</span> <span className="text-muted">{STATUS_META[s].label}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel
            title="Recent activity"
            action={
              <Link to="/superadmin/audit" className="text-sm font-semibold text-accent hover:underline">
                Audit log
              </Link>
            }
          >
            {audit.length ? (
              <ul className="divide-y divide-line">
                {audit.slice(0, 5).map((e) => (
                  <li key={e.id} className="px-5 py-3 text-sm">
                    <p className="font-medium">{e.action}</p>
                    <p className="text-xs text-muted">
                      {e.actor} · {formatDateTime(e.at)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-muted">No admin activity yet.</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  )
}
