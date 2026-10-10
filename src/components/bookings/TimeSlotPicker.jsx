import { formatTimeSlot } from '../../utils/formatDate'

/**
 * Radio-group of time slots.
 * @param slots [{ slot: 'HH:MM', disabled: boolean, reason?: string }]
 */
export default function TimeSlotPicker({ name = 'timeSlot', slots, value, onChange, error, label = 'Preferred time slot', required = true, emptyMessage }) {
  const errorId = `${name}-error`
  const openCount = slots.filter((s) => !s.disabled).length

  return (
    <fieldset className="min-w-0" aria-describedby={error ? errorId : undefined}>
      <legend className="mb-2 text-sm font-medium text-ink">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {' *'}
          </span>
        )}
      </legend>
      {slots.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-3 py-3 text-sm text-muted">{emptyMessage ?? 'Choose a date to see time slots.'}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {slots.map(({ slot, disabled, reason }) => (
            <label key={slot} className={`relative ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="radio"
                name={name}
                value={slot}
                checked={value === slot}
                disabled={disabled}
                onChange={() => onChange(slot)}
                aria-label={`${formatTimeSlot(slot)}${disabled && reason ? ` (${reason.toLowerCase()})` : ''}`}
                className="peer sr-only"
                aria-invalid={error ? true : undefined}
              />
              <span className="flex min-h-11 flex-col items-center justify-center rounded-lg border border-line bg-white px-2 py-2 text-sm font-semibold transition-colors hover:border-primary/40 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent peer-disabled:border-dashed peer-disabled:bg-slate-50 peer-disabled:text-slate-400 peer-disabled:hover:border-line">
                {formatTimeSlot(slot)}
                {disabled && reason && <span className="text-[11px] font-medium">{reason}</span>}
              </span>
            </label>
          ))}
        </div>
      )}
      {slots.length > 0 && openCount === 0 && !error && (
        <p className="mt-1.5 text-sm text-muted">No open slots on this date — try another day.</p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  )
}
