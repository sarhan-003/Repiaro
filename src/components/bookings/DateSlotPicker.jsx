import { formatDisplayDate, getDateParts, todayISO } from '../../utils/formatDate'

/** Radio-group of upcoming working days rendered as date chips. */
export default function DateSlotPicker({ name = 'date', dates, value, onChange, error, label = 'Preferred date', required = true }) {
  const today = todayISO()
  const errorId = `${name}-error`

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
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
        {dates.map((date) => {
          const parts = getDateParts(date)
          const isToday = date === today
          return (
            <label key={date} className="relative shrink-0 cursor-pointer">
              <input
                type="radio"
                name={name}
                value={date}
                checked={value === date}
                onChange={() => onChange(date)}
                aria-label={`${isToday ? 'Today, ' : ''}${formatDisplayDate(date)}`}
                className="peer sr-only"
                aria-invalid={error ? true : undefined}
              />
              <span className="flex w-[4.5rem] flex-col items-center rounded-xl border border-line bg-white px-2 py-2.5 text-center transition-colors hover:border-primary/40 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent peer-checked:*:text-on-primary">
                <span className="text-xs font-medium text-muted">{isToday ? 'Today' : parts.weekday}</span>
                <span className="text-lg font-bold leading-tight">{parts.day}</span>
                <span className="text-xs text-muted">{parts.month}</span>
              </span>
            </label>
          )
        })}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  )
}
