const CONTROL =
  'block w-full rounded-lg border bg-white px-3.5 text-sm text-ink shadow-xs transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-muted'

const controlState = (error) =>
  error ? 'border-danger/60 focus:border-danger focus:ring-danger/20' : 'border-line focus:border-accent focus:ring-accent/20'

const describedBy = (id, error, hint) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined)

function Field({ id, label, required, optional, hint, error, children, className = '' }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            {' *'}
          </span>
        ) : optional ? (
          <span className="font-normal text-muted"> (optional)</span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function InputField({ id, label, required, optional, hint, error, className, ...props }) {
  return (
    <Field id={id} label={label} required={required} optional={optional} hint={hint} error={error} className={className}>
      <input
        id={id}
        name={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={`${CONTROL} h-11 ${controlState(error)}`}
        {...props}
      />
    </Field>
  )
}

export function SelectField({ id, label, required, optional, hint, error, className, children, ...props }) {
  return (
    <Field id={id} label={label} required={required} optional={optional} hint={hint} error={error} className={className}>
      <select
        id={id}
        name={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={`${CONTROL} h-11 pr-9 ${controlState(error)}`}
        {...props}
      >
        {children}
      </select>
    </Field>
  )
}

export function TextAreaField({ id, label, required, optional, hint, error, className, ...props }) {
  return (
    <Field id={id} label={label} required={required} optional={optional} hint={hint} error={error} className={className}>
      <textarea
        id={id}
        name={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={`${CONTROL} min-h-28 resize-y py-2.5 ${controlState(error)}`}
        {...props}
      />
    </Field>
  )
}
