import { useState } from 'react'
import { Search } from 'lucide-react'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import ProviderAvatar from '../../components/common/ProviderAvatar'
import RatingDisplay from '../../components/common/RatingDisplay'
import { AccountBadge, ConsoleHeader, FilterSelect, Panel } from '../../components/console/ConsoleUI'
import { ALL_PROVIDERS } from '../../data/sampleData'
import { useAdminScope } from '../../hooks/useAdminScope'
import { useBookings } from '../../hooks/useBookings'
import { usePlatform } from '../../hooks/usePlatform'
import { useToast } from '../../hooks/useToast'

export default function AdminProviders() {
  const { bookings, isProviderOnline, setProviderAvailability } = useBookings()
  const { accounts, setProviderAccount, logAction } = usePlatform()
  const { categories, providerInScope } = useAdminScope()
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [confirm, setConfirm] = useState(null)

  const q = query.trim().toLowerCase()
  const rows = ALL_PROVIDERS.filter(providerInScope)
    .filter((p) => accounts[p.id] !== 'pending')
    .filter((p) => !category || p.category === categories.find((c) => c.id === category)?.name)
    .filter((p) => !status || accounts[p.id] === status)
    .filter((p) => !q || [p.name, p.locality, ...p.serviceAreas].join(' ').toLowerCase().includes(q))

  const jobsDone = (id) => bookings.filter((b) => b.providerId === id && b.status === 'completed').length

  function apply() {
    const { provider, action } = confirm
    if (action === 'suspend') {
      setProviderAccount(provider.id, 'suspended', `Suspended provider ${provider.name}`)
      setProviderAvailability(provider.id, false)
      showToast(`${provider.name} suspended. They can no longer receive requests.`, 'info')
    } else if (action === 'reactivate') {
      setProviderAccount(provider.id, 'active', `Reactivated provider ${provider.name}`)
      showToast(`${provider.name} reactivated.`)
    } else {
      setProviderAvailability(provider.id, false)
      logAction(`Set provider ${provider.name} offline`)
      showToast(`${provider.name} set offline.`, 'info')
    }
    setConfirm(null)
  }

  const COPY = {
    suspend: (p) => ({ title: `Suspend ${p.name}?`, text: 'They will be taken offline, hidden from customers and excluded from matching until reactivated.', label: 'Suspend' }),
    reactivate: (p) => ({ title: `Reactivate ${p.name}?`, text: 'Their profile becomes visible again. They can go online from the partner app.', label: 'Reactivate' }),
    offline: (p) => ({ title: `Set ${p.name} offline?`, text: 'They stop receiving new requests until they go back on duty.', label: 'Set offline' }),
  }
  const copy = confirm && COPY[confirm.action](confirm.provider)

  return (
    <>
      <title>Service providers — Admin</title>
      <ConsoleHeader title="Service providers" description="Accounts in your categories. Suspended providers are hidden from customers and matching." />
      <Panel
        title={`${rows.length} provider${rows.length === 1 ? '' : 's'}`}
        action={
          <div className="flex flex-wrap gap-2">
            <label className="relative">
              <span className="sr-only">Search providers</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name or area…"
                className="h-10 w-44 rounded-xl border border-line pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <FilterSelect label="Category" value={category} onChange={setCategory}>
              <option value="">All my categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Account status" value={status} onChange={setStatus}>
              <option value="">Any status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
            </FilterSelect>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Provider</th>
                <th scope="col" className="px-4 py-3 font-semibold">Area</th>
                <th scope="col" className="px-4 py-3 font-semibold">Rating</th>
                <th scope="col" className="px-4 py-3 font-semibold">Jobs done</th>
                <th scope="col" className="px-4 py-3 font-semibold">Duty</th>
                <th scope="col" className="px-4 py-3 font-semibold">Account</th>
                <th scope="col" className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((p) => {
                const status = accounts[p.id]
                const online = isProviderOnline(p)
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-3">
                        <ProviderAvatar provider={p} className="size-10 rounded-lg" />
                        <span>
                          <span className="block font-semibold">{p.name}</span>
                          <span className="text-xs text-muted">{p.category}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3">{p.locality}</td>
                    <td className="px-4 py-3">
                      <RatingDisplay rating={p.rating} reviewCount={p.reviewCount} />
                    </td>
                    <td className="px-4 py-3">{jobsDone(p.id)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${online ? 'text-success' : 'text-muted'}`}>
                        <span className={`size-2 rounded-full ${online ? 'bg-success' : 'bg-slate-300'}`} aria-hidden="true" />
                        {online ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <AccountBadge status={status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex flex-wrap gap-1.5">
                        {status === 'active' && online && (
                          <button type="button" onClick={() => setConfirm({ provider: p, action: 'offline' })} className="rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ring-line hover:bg-slate-50">
                            Set offline
                          </button>
                        )}
                        {status === 'active' && (
                          <button type="button" onClick={() => setConfirm({ provider: p, action: 'suspend' })} className="rounded-lg px-2.5 py-1 text-xs font-semibold text-danger ring-1 ring-inset ring-red-200 hover:bg-red-50">
                            Suspend
                          </button>
                        )}
                        {status !== 'active' && (
                          <button type="button" onClick={() => setConfirm({ provider: p, action: 'reactivate' })} className="rounded-lg px-2.5 py-1 text-xs font-semibold text-success ring-1 ring-inset ring-green-200 hover:bg-green-50">
                            Reactivate
                          </button>
                        )}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {rows.length === 0 && <p className="px-5 py-10 text-center text-sm text-muted">No providers match these filters.</p>}
        </div>
      </Panel>

      <ConfirmDialog
        open={confirm != null}
        title={copy?.title ?? ''}
        description={copy?.text ?? ''}
        confirmLabel={copy?.label ?? ''}
        tone={confirm?.action === 'reactivate' ? 'primary' : 'danger'}
        onConfirm={apply}
        onCancel={() => setConfirm(null)}
      />
    </>
  )
}
