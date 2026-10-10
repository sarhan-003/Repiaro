import { Star } from 'lucide-react'

export default function RatingDisplay({ rating, reviewCount, reviewLabel = false, size = 'sm', className = '' }) {
  const large = size === 'lg'
  if (!reviewCount && !rating) {
    return <span className={`inline-flex items-center rounded-md bg-sky-50 px-1.5 py-0.5 text-xs font-semibold text-sky-800 ${className}`}>New partner</span>
  }
  return (
    <span className={`inline-flex items-center gap-1 ${large ? 'text-base' : 'text-sm'} ${className}`}>
      <Star className={large ? 'size-5' : 'size-4'} fill="#FFC61A" stroke="#F5B800" aria-hidden="true" />
      <span className="font-bold text-ink">{rating.toFixed(1)}</span>
      <span className="sr-only"> out of 5 (demo rating)</span>
      {reviewCount != null && (
        <span className="text-muted">
          ({reviewCount}
          {reviewLabel ? ' reviews' : <span className="sr-only"> sample reviews</span>})
        </span>
      )}
    </span>
  )
}
