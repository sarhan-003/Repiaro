import { Info } from 'lucide-react'

const DEFAULT_MESSAGE =
  'Demo data: all professionals, ratings, reviews, prices and availability shown here are fictional and for demonstration only.'

export default function DemoDataNotice({ children = DEFAULT_MESSAGE, className = '' }) {
  return (
    <p className={`flex items-start gap-2 rounded-lg border border-amber-200 bg-primary-soft px-3.5 py-2.5 text-sm text-amber-950 ${className}`}>
      <Info className="mt-0.5 size-4 shrink-0 text-primary-ink" aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}
