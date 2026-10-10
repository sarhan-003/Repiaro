/**
 * Segmented filter control. Each option shows a count; the active one is
 * announced with aria-pressed. (Lists below are filtered views, not separate
 * tab panels, so toggle buttons are the accurate pattern.)
 */
export default function Tabs({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-white p-1">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-colors ${
              active ? 'bg-primary text-on-primary' : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
            }`}
          >
            {option.label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs ${active ? 'bg-black/10 text-on-primary' : 'bg-slate-100 text-slate-600'}`}>
              {option.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
