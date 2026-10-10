import { formatCurrency } from '../../utils/formatCurrency'

export default function PriceDisplay({ price, unit, prefix = 'From', className = '' }) {
  return (
    <p className={`text-sm text-muted ${className}`}>
      {prefix && <span>{prefix} </span>}
      <span className="text-base font-bold text-ink">{formatCurrency(price)}</span>
      {unit && <span> / {unit}</span>}
    </p>
  )
}
