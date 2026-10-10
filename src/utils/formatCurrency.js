const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function formatCurrency(amount) {
  return Number.isFinite(amount) ? inr.format(amount) : '—'
}
