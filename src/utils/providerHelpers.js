import { PROVIDERS, SERVICE_CATEGORIES } from '../data/sampleData'
import { addDays, toISODate } from './formatDate'

export const getProviderById = (id) => PROVIDERS.find((p) => p.id === id) ?? null

export const getCategoryById = (id) => SERVICE_CATEGORIES.find((c) => c.id === id) ?? null

export const getCategoryByName = (name) => SERVICE_CATEGORIES.find((c) => c.name === name) ?? null

/** Next `count` working days for a provider, starting today. */
export function getUpcomingDates(provider, count = 7, today = new Date()) {
  const dates = []
  for (let offset = 0; dates.length < count && offset < 30; offset++) {
    const day = addDays(today, offset)
    if (!provider.offDays.includes(day.getDay())) dates.push(toISODate(day))
  }
  return dates
}

export const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Highest rated' },
]

export const RATING_OPTIONS = [
  { value: '', label: 'Any rating' },
  { value: '4.5', label: '4.5 and above' },
  { value: '4', label: '4.0 and above' },
]

/**
 * Applies every active filter. `isAvailable` lets callers account for the
 * availability toggle on the provider dashboard.
 */
export function filterProviders(providers, filters, isAvailable) {
  const query = filters.q.trim().toLowerCase()
  const category = getCategoryById(filters.category)
  const minRating = Number(filters.minRating) || 0

  return providers.filter((p) => {
    if (category && p.category !== category.name) return false
    if (filters.locality && !p.serviceAreas.includes(filters.locality)) return false
    if (p.rating < minRating) return false
    if (filters.availableOnly && !isAvailable(p)) return false
    if (!query) return true
    const haystack = [p.name, p.category, ...p.skills, ...p.services].join(' ').toLowerCase()
    return query.split(/\s+/).every((word) => haystack.includes(word))
  })
}

export function sortProviders(providers, sort, isAvailable) {
  const list = [...providers]
  switch (sort) {
    case 'price-asc':
      return list.sort((a, b) => a.price - b.price || b.rating - a.rating)
    case 'price-desc':
      return list.sort((a, b) => b.price - a.price || b.rating - a.rating)
    case 'rating':
      return list.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    default:
      // Recommended: available providers first, then by rating and review volume.
      return list.sort(
        (a, b) =>
          Number(isAvailable(b)) - Number(isAvailable(a)) ||
          b.rating - a.rating ||
          b.reviewCount - a.reviewCount,
      )
  }
}
