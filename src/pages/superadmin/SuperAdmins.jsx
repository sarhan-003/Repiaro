import { useState } from 'react'
import { Plus } from 'lucide-react'
import Button from '../../components/common/Button'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { InputField } from '../../components/common/FormFields'
import Modal from '../../components/common/Modal'
import { ConsoleHeader, Panel } from '../../components/console/ConsoleUI'
import { SERVICE_CATEGORIES } from '../../data/sampleData'
import { usePlatform } from '../../hooks/usePlatform'
import { useToast } from '../../hooks/useToast'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function AdminForm({ initial, onSave, onCancel, existingEmails }) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})

  function toggle(id) {
    setValues((v) => ({ ...v, categories: v.categories.includes(id) ? v.categories.filter((c) => c !== id) : [...v.categories, id] }))
  }

  function submit(event) {
    event.preventDefault()
    const found = {}
    if (values.name.trim().length < 3) found.name = 'Enter the admin’s full name.'
    if (!EMAIL.test(values.email.trim())) found.email = 'Enter a valid email address.'
    else if (existingEmails.includes(values.email.trim().toLowerCase())) found.email = 'An admin with this email already exists.'
    if (values.categories.length === 0) found.categories = 'Assign at least one service category.'
    setErrors(found)
    if (Object.keys(found).length === 0) onSave({ name: values.name.trim(), email: values.email.trim(), categories: values.categories })
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <InputField id="admin-name" label="Full name" required value={values.name} error={errors.name} onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))} disabled={initial.locked} />
      <InputField id="admin-email" label="Work email" required type="email" value={values.email} error={errors.email} onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))} disabled={initial.locked} />
      <fieldset aria-describedby={errors.categories ? 'admin-categories-error' : undefined}>
        <legend className="mb-2 text-sm font-medium">Manages categories</legend>
        <div className="grid grid-cols-2 gap-2">
          {SERVICE_CATEGORIES.map((c) => (
            <label key={c.id} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
              <input type="checkbox" checked={values.categories.includes(c.id)} onChange={() => toggle(c.id)} className="size-4 accent-ink" />
              {c.name}
            </label>
          ))}
        </div>
        {errors.categories && (
          <p id="admin-categories-error" className="mt-1.5 text-sm text-danger">
            {errors.categories}
          </p>
        )}
      </fieldset>
      <p className="text-xs text-muted">Demo: no invitation email is sent and no password is created.</p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save admin</Button>
      </div>
    </form>
  )
}

export default function SuperAdmins() {
  const { admins, addAdmin, updateAdmin } = usePlatform()
  const { showToast } = useToast()
  const [editing, setEditing] = useState(null) // 'new' | admin
  const [toggling, setToggling] = useState(null)
  const names = (ids) => SERVICE_CATEGORIES.filter((c) => ids.includes(c.id)).map((c) => c.name)

  function save(values) {
    if (editing === 'new') {
      addAdmin(values)
      showToast(`Admin ${values.name} created.`)
    } else {
      updateAdmin(editing.id, { categories: values.categories }, `Updated categories for admin ${editing.name}: ${names(values.categories).join(', ')}`)
      showToast('Admin updated.')
    }
    setEditing(null)
  }

  function confirmToggle() {
    const next = !toggling.active
    updateAdmin(toggling.id, { active: next }, `${next ? 'Enabled' : 'Disabled'} admin ${toggling.name}`)
    showToast(`${toggling.name} ${next ? 'enabled' : 'disabled'}.`, 'info')
    setToggling(null)
  }

  return (
    <>
      <title>Admins — Super Admin</title>
      <ConsoleHeader title="Admins" description="Admins manage service providers and bookings for the categories you assign.">
        <Button onClick={() => setEditing('new')}>
          <Plus className="size-4" aria-hidden="true" />
          Add admin
        </Button>
      </ConsoleHeader>

      <Panel>
        <ul className="divide-y divide-line">
          {admins.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <span className="flex size-11 items-center justify-center rounded-full bg-primary-soft font-bold text-primary-ink" aria-hidden="true">
                {a.name
                  .split(' ')
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {a.name}
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${a.active ? 'bg-green-50 text-success' : 'bg-slate-100 text-slate-600'}`}>
                    {a.active ? 'Active' : 'Disabled'}
                  </span>
                </p>
                <p className="text-sm text-muted">{a.email}</p>
                <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Categories">
                  {names(a.categories).map((n) => (
                    <li key={n} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium">
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setEditing(a)}>
                  Edit categories
                </Button>
                <Button variant={a.active ? 'danger-outline' : 'secondary'} size="sm" onClick={() => setToggling(a)}>
                  {a.active ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Modal open={editing != null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add admin' : `Edit ${editing?.name ?? ''}`}>
        {editing && (
          <AdminForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? { name: '', email: '', categories: [] } : { ...editing, locked: true }}
            existingEmails={editing === 'new' ? admins.map((a) => a.email.toLowerCase()) : []}
            onSave={save}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={toggling != null}
        title={toggling ? `${toggling.active ? 'Disable' : 'Enable'} ${toggling.name}?` : ''}
        description={toggling?.active ? 'They will be signed out and unable to access the admin console.' : 'They will be able to access the admin console again.'}
        confirmLabel={toggling?.active ? 'Disable admin' : 'Enable admin'}
        tone={toggling?.active ? 'danger' : 'primary'}
        onConfirm={confirmToggle}
        onCancel={() => setToggling(null)}
      />
    </>
  )
}
