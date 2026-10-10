import { useState } from 'react'
import { ScrollText, Search } from 'lucide-react'
import { EmptyState } from '../../components/common/States'
import { ConsoleHeader, Panel } from '../../components/console/ConsoleUI'
import { usePlatform } from '../../hooks/usePlatform'
import { formatDateTime } from '../../utils/formatDate'

export default function SuperAudit() {
  const { audit } = usePlatform()
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const rows = audit.filter((e) => !q || `${e.actor} ${e.action}`.toLowerCase().includes(q))

  return (
    <>
      <title>Audit log — Super Admin</title>
      <ConsoleHeader title="Audit log" description="Every change made from the admin and super admin consoles (latest 200, stored in this browser)." />
      {audit.length === 0 ? (
        <EmptyState icon={ScrollText} title="No activity yet" description="Approvals, suspensions, pricing and settings changes will be recorded here." />
      ) : (
        <Panel
          title={`${rows.length} entr${rows.length === 1 ? 'y' : 'ies'}`}
          action={
            <label className="relative">
              <span className="sr-only">Filter audit log</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by admin or action"
                className="h-10 w-56 rounded-xl border border-line pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          }
        >
          <ol className="divide-y divide-line">
            {rows.map((e) => (
              <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3 text-sm">
                <span className="font-medium">{e.action}</span>
                <span className="text-xs text-muted">
                  {e.actor} · {formatDateTime(e.at)}
                </span>
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </>
  )
}
