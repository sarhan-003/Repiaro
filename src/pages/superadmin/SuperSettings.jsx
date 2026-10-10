import { useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import Button from '../../components/common/Button'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { InputField } from '../../components/common/FormFields'
import { ConsoleHeader, Panel } from '../../components/console/ConsoleUI'
import { useBookings } from '../../hooks/useBookings'
import { usePlatform } from '../../hooks/usePlatform'
import { useToast } from '../../hooks/useToast'

const FIELDS = [
  { key: 'commissionPct', label: 'Platform commission (%)', min: 0, max: 50, hint: 'Share of the labour fare kept by the platform.' },
  { key: 'convenienceFee', label: 'Convenience fee (₹)', min: 0, max: 199, hint: 'Flat fee added to every booking.' },
  { key: 'offerTimeoutSec', label: 'Offer timeout (seconds)', min: 5, max: 120, hint: 'How long a professional has to accept before the next one is offered.' },
]

const DEMO_FIELDS = [
  { key: 'autoAcceptSec', label: 'Auto-accept after (s)', min: 1, max: 60 },
  { key: 'travelSec', label: 'Simulated travel time (s)', min: 5, max: 600 },
  { key: 'jobSec', label: 'Simulated job time (s)', min: 5, max: 600 },
]

export default function SuperSettings() {
  const { settings, updateSettings, resetPlatform, signInSuperAdmin } = usePlatform()
  const { resetDemoData } = useBookings()
  const { showToast } = useToast()
  const [draft, setDraft] = useState(() => Object.fromEntries(Object.entries(settings).map(([k, v]) => [k, typeof v === 'number' ? String(v) : v])))
  const [confirmReset, setConfirmReset] = useState(false)

  const all = [...FIELDS, ...DEMO_FIELDS]
  const errors = Object.fromEntries(
    all
      .filter((f) => {
        const n = Number(draft[f.key])
        return draft[f.key] === '' || !Number.isFinite(n) || n < f.min || n > f.max
      })
      .map((f) => [f.key, `Enter a value from ${f.min} to ${f.max}.`]),
  )

  function save(event) {
    event.preventDefault()
    if (Object.keys(errors).length) return
    const patch = { ...Object.fromEntries(all.map((f) => [f.key, Number(draft[f.key])])), demoAutopilot: draft.demoAutopilot }
    const changes = Object.entries(patch).filter(([k, v]) => settings[k] !== v)
    if (!changes.length) return
    updateSettings(patch, `Updated settings: ${changes.map(([k, v]) => `${k}=${v}`).join(', ')}`)
    showToast('Platform settings saved.')
  }

  const field = (f) => (
    <InputField
      key={f.key}
      id={f.key}
      label={f.label}
      type="number"
      min={f.min}
      max={f.max}
      hint={f.hint}
      error={errors[f.key]}
      value={draft[f.key]}
      onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
    />
  )

  return (
    <>
      <title>Platform settings — Super Admin</title>
      <ConsoleHeader title="Platform settings" description="Changes apply immediately to pricing and dispatch across the customer site and partner app." />
      <form onSubmit={save} noValidate className="space-y-6">
        <Panel title="Business rules">
          <div className="grid gap-5 p-5 md:grid-cols-3">{FIELDS.map(field)}</div>
        </Panel>
        <Panel title="Demo autopilot">
          <div className="space-y-5 p-5">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={draft.demoAutopilot}
                onChange={(e) => setDraft((d) => ({ ...d, demoAutopilot: e.target.checked }))}
                className="mt-1 size-4 accent-ink"
              />
              <span>
                <span className="block font-semibold">Simulate professionals</span>
                <span className="block text-sm text-muted">
                  When no partner app is open for a provider, they auto-accept offers and progress jobs so a single tester can see the full flow.
                </span>
              </span>
            </label>
            <div className="grid gap-5 md:grid-cols-3">{DEMO_FIELDS.map(field)}</div>
          </div>
        </Panel>
        <div className="flex justify-end">
          <Button type="submit" disabled={Object.keys(errors).length > 0}>
            Save settings
          </Button>
        </div>
      </form>

      <Panel className="mt-8 border-red-200" title="Danger zone">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="flex items-start gap-2 text-sm text-muted">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
            Reset all demo data: bookings, provider accounts, admins, pricing, settings and the audit log.
          </p>
          <Button variant="danger-outline" onClick={() => setConfirmReset(true)}>
            Reset everything
          </Button>
        </div>
      </Panel>

      <ConfirmDialog
        open={confirmReset}
        title="Reset all demo data?"
        description="Everything returns to the original sample state. This cannot be undone."
        confirmLabel="Reset everything"
        onConfirm={() => {
          resetDemoData()
          resetPlatform()
          signInSuperAdmin()
          setConfirmReset(false)
          showToast('All demo data reset.', 'info')
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </>
  )
}
