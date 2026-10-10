import { useState } from 'react'
import { FileText, MapPin } from 'lucide-react'
import Button from '../../components/common/Button'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import ProviderAvatar from '../../components/common/ProviderAvatar'
import { EmptyState } from '../../components/common/States'
import { AccountBadge, ConsoleHeader, Panel } from '../../components/console/ConsoleUI'
import { PROVIDER_APPLICATIONS } from '../../data/sampleData'
import { useAdminScope } from '../../hooks/useAdminScope'
import { usePlatform } from '../../hooks/usePlatform'
import { useToast } from '../../hooks/useToast'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDisplayDate } from '../../utils/formatDate'

export default function AdminApplications() {
  const { accounts, setProviderAccount } = usePlatform()
  const { providerInScope } = useAdminScope()
  const { showToast } = useToast()
  const [rejecting, setRejecting] = useState(null)

  const mine = PROVIDER_APPLICATIONS.filter(providerInScope)
  const pending = mine.filter((p) => accounts[p.id] === 'pending')
  const decided = mine.filter((p) => accounts[p.id] !== 'pending')

  function approve(p) {
    setProviderAccount(p.id, 'active', `Approved provider application: ${p.name}`)
    showToast(`${p.name} approved. They can now go on duty in the partner app.`)
  }

  function reject() {
    setProviderAccount(rejecting.id, 'rejected', `Rejected provider application: ${rejecting.name}`)
    showToast(`${rejecting.name}’s application rejected.`, 'info')
    setRejecting(null)
  }

  return (
    <>
      <title>Applications — Admin</title>
      <ConsoleHeader title="Provider applications" description="Review new professionals in your categories before they can receive jobs." />

      {pending.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {pending.map((p) => (
            <article key={p.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-start gap-4">
                <ProviderAvatar provider={p} className="size-16 rounded-2xl" textClassName="text-lg" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold">{p.name}</h2>
                  <p className="text-sm text-muted">
                    {p.category} · {p.experience} yrs experience · applied {formatDisplayDate(p.appliedOn)}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                    <MapPin className="size-4" aria-hidden="true" />
                    {p.serviceAreas.join(', ')}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-surface p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Documents (demo — not real files)</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {p.documents.map((doc) => (
                    <li key={doc} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-medium ring-1 ring-line">
                      <FileText className="size-3.5" aria-hidden="true" />
                      {doc}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted">
                  Skills: {p.skills.join(', ')} · Proposed starting price {formatCurrency(p.price)}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <Button className="flex-1" onClick={() => approve(p)}>
                  Approve
                </Button>
                <Button variant="danger-outline" className="flex-1" onClick={() => setRejecting(p)}>
                  Reject
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon={FileText} title="No pending applications" description="New provider applications in your categories will appear here." />
      )}

      {decided.length > 0 && (
        <Panel className="mt-6" title="Reviewed applications">
          <ul className="divide-y divide-line">
            {decided.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <ProviderAvatar provider={p} className="size-9 rounded-lg" />
                <span className="flex-1 text-sm font-semibold">
                  {p.name} <span className="font-normal text-muted">· {p.category}</span>
                </span>
                <AccountBadge status={accounts[p.id]} />
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <ConfirmDialog
        open={rejecting != null}
        title={rejecting ? `Reject ${rejecting.name}?` : ''}
        description="They will not be able to receive jobs. You can reactivate them later from Service providers."
        confirmLabel="Reject application"
        onConfirm={reject}
        onCancel={() => setRejecting(null)}
      />
    </>
  )
}
