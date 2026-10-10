import { Link } from 'react-router-dom'
import { CircleCheckBig, FileCheck2, IndianRupee, Radar, SearchX, Truck, UserCheck } from 'lucide-react'
import AdminBookingActions from '../../components/console/AdminBookingActions'
import { ConsoleHeader, Panel, StatTile } from '../../components/console/ConsoleUI'
import StatusBadge from '../../components/common/StatusBadge'
import { ALL_PROVIDERS } from '../../data/sampleData'
import { useAdminScope } from '../../hooks/useAdminScope'
import { useBookings } from '../../hooks/useBookings'
import { useNow } from '../../hooks/useNow'
import { usePlatform } from '../../hooks/usePlatform'
import { ACTIVE_STATUSES, ASSIGNED_STATUSES } from '../../utils/bookingHelpers'
import { formatCurrency } from '../../utils/formatCurrency'
import { getProviderById } from '../../utils/providerHelpers'

export default function AdminOverview() {
  const { bookings, isProviderOnline } = useBookings()
  const { accounts, currentAdmin } = usePlatform()
  const { categories, bookingInScope, providerInScope } = useAdminScope()
  const now = useNow()
  const today = new Date().toISOString().slice(0, 10)

  const scoped = bookings.filter(bookingInScope)
  const providers = ALL_PROVIDERS.filter(providerInScope)
  const live = scoped.filter((b) => ACTIVE_STATUSES.includes(b.status)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const todays = scoped.filter((b) => b.updatedAt.slice(0, 10) === today)
  const completedToday = todays.filter((b) => b.status === 'completed')

  const stats = [
    { icon: Radar, label: 'Searching now', value: scoped.filter((b) => b.status === 'searching').length, tone: 'bg-amber-50 text-warning' },
    { icon: Truck, label: 'Jobs in progress', value: scoped.filter((b) => ASSIGNED_STATUSES.includes(b.status)).length, tone: 'bg-sky-50 text-sky-700' },
    { icon: UserCheck, label: 'Pros online', value: `${providers.filter((p) => isProviderOnline(p)).length}/${providers.filter((p) => accounts[p.id] === 'active').length}`, tone: 'bg-green-50 text-success' },
    { icon: CircleCheckBig, label: 'Completed today', value: completedToday.length, tone: 'bg-green-50 text-success' },
    { icon: IndianRupee, label: 'GMV today', value: formatCurrency(completedToday.reduce((s, b) => s + b.fare.total, 0)), tone: 'bg-primary-soft text-primary-ink' },
    { icon: SearchX, label: 'Unfulfilled today', value: todays.filter((b) => b.status === 'unfulfilled').length, tone: 'bg-red-50 text-danger' },
  ]
  const pendingApps = providers.filter((p) => accounts[p.id] === 'pending').length

  return (
    <>
      <title>Admin overview — Home All-Rounder</title>
      <ConsoleHeader title={`Hello, ${currentAdmin.name.split(' ')[0]}`} description={`Managing ${categories.map((c) => c.name).join(', ')}`} />

      {pendingApps > 0 && (
        <Link to="/admin/applications" className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 hover:bg-amber-100">
          <FileCheck2 className="size-6" aria-hidden="true" />
          <span className="flex-1 font-semibold">
            {pendingApps} provider application{pendingApps > 1 ? 's' : ''} waiting for review
          </span>
          <span className="text-sm font-bold">Review →</span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <StatTile key={s.label} {...s} />
        ))}
      </div>

      <Panel
        className="mt-6"
        title="Live dispatch board"
        action={
          <Link to="/admin/bookings" className="text-sm font-semibold text-accent hover:underline">
            All bookings
          </Link>
        }
      >
        {live.length ? (
          <ul className="divide-y divide-line">
            {live.slice(0, 8).map((b) => {
              const offeredTo = b.offer && getProviderById(b.offer.providerId)
              return (
                <li key={b.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {b.service} <span className="font-normal text-muted">· {b.locality}</span>
                    </p>
                    <p className="text-xs text-muted">
                      {b.id} · {b.customerName} ·{' '}
                      {b.status === 'searching'
                        ? offeredTo
                          ? `offered to ${offeredTo.name} (${Math.max(0, Math.ceil((b.offer.expiresAt - now) / 1000))}s)`
                          : 'finding candidates'
                        : b.providerName}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                  <AdminBookingActions booking={b} compact />
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="px-5 py-10 text-center text-sm text-muted">No live bookings in your categories right now.</p>
        )}
      </Panel>
    </>
  )
}
