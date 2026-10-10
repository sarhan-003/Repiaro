/** Small building blocks shared by the admin and super admin consoles. */

export function ConsoleHeader({ title, description, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}

export function StatTile({ icon: Icon, label, value, hint, tone = 'bg-primary-soft text-primary-ink' }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <span className={`flex size-9 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-2xl font-extrabold">{value}</p>
      <p className="text-sm text-muted">{label}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}

export function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-line bg-white ${className}`}>
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <h2 className="font-bold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function AccountBadge({ status }) {
  const tones = {
    active: 'bg-green-50 text-success ring-green-200',
    suspended: 'bg-red-50 text-danger ring-red-200',
    pending: 'bg-amber-50 text-warning ring-amber-200',
    rejected: 'bg-slate-100 text-slate-600 ring-slate-200',
  }
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${tones[status]}`}>{status}</span>
}

/** Native select styled for console filter bars. */
export function FilterSelect({ label, value, onChange, children }) {
  return (
    <label className="text-sm">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-10 rounded-xl border border-line bg-white px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      >
        {children}
      </select>
    </label>
  )
}
