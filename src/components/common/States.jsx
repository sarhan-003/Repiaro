import { LoaderCircle, TriangleAlert } from 'lucide-react'

export function EmptyState({ icon: Icon, title, description, children, className = '' }) {
  return (
    <div className={`flex flex-col items-center rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center ${className}`}>
      {Icon && (
        <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary-ink">
          <Icon className="size-7" aria-hidden="true" />
        </span>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-muted">{description}</p>}
      {children && <div className="mt-5 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  )
}

export function LoadingState({ label = 'Loading…', className = '' }) {
  return (
    <div role="status" className={`flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted ${className}`}>
      <LoaderCircle className="size-8 animate-spin text-primary-ink" aria-hidden="true" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', description, children, className = '' }) {
  return (
    <div role="alert" className={`flex flex-col items-center rounded-2xl border border-red-200 bg-white px-6 py-12 text-center ${className}`}>
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-red-50 text-danger">
        <TriangleAlert className="size-7" aria-hidden="true" />
      </span>
      <h2 className="text-xl font-semibold">{title}</h2>
      {description && <p className="mt-1.5 max-w-md text-sm text-muted">{description}</p>}
      {children && <div className="mt-5 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  )
}
