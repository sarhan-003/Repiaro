import { useState } from 'react'
import { Search } from 'lucide-react'
import BookingDetailsDialog from '../../components/bookings/BookingDetailsDialog'
import AdminBookingActions from '../../components/console/AdminBookingActions'
import { ConsoleHeader, FilterSelect, Panel } from '../../components/console/ConsoleUI'
import StatusBadge from '../../components/common/StatusBadge'
import { useAdminScope } from '../../hooks/useAdminScope'
import { useBookings } from '../../hooks/useBookings'
import { BOOKING_STATUSES, STATUS_META } from '../../utils/bookingHelpers'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'

export default function AdminBookings() {
  const { bookings } = useBookings()
  const { categories, bookingInScope } = useAdminScope()
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [query, setQuery] = useState('')
  const [detailsId, setDetailsId] = useState(null)

  const q = query.trim().toLowerCase()
  const rows = bookings
    .filter(bookingInScope)
    .filter((b) => !status || b.status === status)
    .filter((b) => !category || b.categoryId === category)
    .filter((b) => !q || [b.id, b.customerName, b.service, b.locality, b.providerName ?? ''].join(' ').toLowerCase().includes(q))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const details = bookings.find((b) => b.id === detailsId) ?? null

  return (
    <>
      <title>Bookings — Admin</title>
      <ConsoleHeader title="Bookings" description="Monitor dispatch, reassign stuck jobs and cancel on a customer’s behalf." />

      <Panel
        title={`${rows.length} booking${rows.length === 1 ? '' : 's'}`}
        action={
          <div className="flex flex-wrap gap-2">
            <label className="relative">
              <span className="sr-only">Search bookings</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ref, customer, area…"
                className="h-10 w-48 rounded-xl border border-line pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <FilterSelect label="Status" value={status} onChange={setStatus}>
              <option value="">All statuses</option>
              {BOOKING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Category" value={category} onChange={setCategory}>
              <option value="">All my categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </FilterSelect>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Booking</th>
                <th scope="col" className="px-4 py-3 font-semibold">Customer</th>
                <th scope="col" className="px-4 py-3 font-semibold">Professional</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold">Fare</th>
                <th scope="col" className="px-4 py-3 font-semibold">Created</th>
                <th scope="col" className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((b) => (
                <tr key={b.id} className="align-top">
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => setDetailsId(b.id)} className="text-left font-semibold text-accent hover:underline">
                      {b.id}
                    </button>
                    <p className="text-xs text-muted">
                      {b.service} · {b.mode === 'now' ? 'Now' : 'Scheduled'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {b.customerName}
                    <p className="text-xs text-muted">{b.locality}</p>
                  </td>
                  <td className="px-4 py-3">{b.providerName ?? <span className="text-muted">—</span>}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(b.fare.total)}</td>
                  <td className="px-4 py-3 text-muted">{formatDateTime(b.createdAt)}</td>
                  <td className="px-4 py-3">
                    <AdminBookingActions booking={b} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="px-5 py-10 text-center text-sm text-muted">No bookings match these filters.</p>}
        </div>
      </Panel>

      <BookingDetailsDialog booking={details} onClose={() => setDetailsId(null)} actions={details && <AdminBookingActions booking={details} compact />} />
    </>
  )
}
