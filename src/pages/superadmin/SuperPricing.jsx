import { useState } from 'react'
import Button from '../../components/common/Button'
import { ConsoleHeader, Panel } from '../../components/console/ConsoleUI'
import { getCategoryIcon } from '../../components/services/categoryIcons'
import { SERVICE_CATEGORIES, SERVICE_ITEMS } from '../../data/sampleData'
import { usePlatform } from '../../hooks/usePlatform'
import { useToast } from '../../hooks/useToast'
import { formatCurrency } from '../../utils/formatCurrency'
import { getServiceItems, SURGE_OPTIONS } from '../../utils/pricing'

function CategoryPricing({ category }) {
  const { categories, fares, updateCategory, setItemFare } = usePlatform()
  const { showToast } = useToast()
  const config = categories[category.id]
  const items = getServiceItems(category.id, fares)
  const [draft, setDraft] = useState(() => Object.fromEntries(items.map((i) => [i.id, String(i.fare)])))
  const Icon = getCategoryIcon(category.icon)

  const invalid = items.filter((i) => {
    const n = Number(draft[i.id])
    return !Number.isInteger(n) || n < 49 || n > 50000
  })
  const changed = items.filter((i) => Number(draft[i.id]) !== i.fare)

  function save() {
    for (const i of changed) setItemFare(category.id, i.id, Number(draft[i.id]), `${category.name}: ${i.name} fare ${formatCurrency(i.fare)} → ${formatCurrency(Number(draft[i.id]))}`)
    showToast(`${category.name} fares saved.`)
  }

  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <Icon className="size-5" aria-hidden="true" />
          {category.name}
        </span>
      }
      action={
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            role="switch"
            checked={config.enabled}
            onChange={(e) => updateCategory(category.id, { enabled: e.target.checked }, `${e.target.checked ? 'Enabled' : 'Paused'} category ${category.name}`)}
            className="size-4 accent-ink"
          />
          {config.enabled ? 'Live' : 'Paused'}
        </label>
      }
    >
      <div className="p-5">
        <label className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium">Demand multiplier (surge)</span>
          <select
            value={config.surge}
            onChange={(e) => updateCategory(category.id, { surge: Number(e.target.value) }, `Set ${category.name} surge to ${e.target.value}×`)}
            className="h-9 rounded-lg border border-line px-2 text-sm"
          >
            {SURGE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}×{s === 1 ? ' (normal)' : ''}
              </option>
            ))}
          </select>
        </label>
        <table className="mt-4 w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="pb-2 font-semibold">Service</th>
              <th scope="col" className="pb-2 font-semibold">Base fare (₹)</th>
              <th scope="col" className="pb-2 text-right font-semibold">Customer pays</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((i) => {
              const base = SERVICE_ITEMS[category.id].find((x) => x.id === i.id).fare
              const n = Number(draft[i.id])
              return (
                <tr key={i.id}>
                  <td className="py-2 pr-3">
                    {i.name}
                    {i.fare !== base && <span className="block text-xs text-muted">Default {formatCurrency(base)}</span>}
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min="49"
                      max="50000"
                      step="1"
                      aria-label={`${i.name} base fare`}
                      value={draft[i.id]}
                      onChange={(e) => setDraft((d) => ({ ...d, [i.id]: e.target.value }))}
                      className={`h-9 w-28 rounded-lg border px-2 ${invalid.includes(i) ? 'border-danger' : 'border-line'}`}
                    />
                  </td>
                  <td className="py-2 text-right font-semibold">{Number.isFinite(n) ? formatCurrency(Math.round(n * config.surge)) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {invalid.length > 0 && <p className="mt-2 text-sm text-danger">Fares must be whole rupees between ₹49 and ₹50,000.</p>}
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={save} disabled={invalid.length > 0 || changed.length === 0}>
            Save fares
          </Button>
        </div>
      </div>
    </Panel>
  )
}

export default function SuperPricing() {
  const { settings } = usePlatform()
  return (
    <>
      <title>Services & pricing — Super Admin</title>
      <ConsoleHeader
        title="Services & pricing"
        description={`Pause categories, apply demand multipliers and edit upfront fares. Customers also pay a ${formatCurrency(settings.convenienceFee)} convenience fee (Platform settings).`}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        {SERVICE_CATEGORIES.map((c) => (
          <CategoryPricing key={c.id} category={c} />
        ))}
      </div>
    </>
  )
}
