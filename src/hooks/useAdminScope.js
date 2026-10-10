import { SERVICE_CATEGORIES } from '../data/sampleData'
import { usePlatform } from './usePlatform'

/** The categories the signed-in admin manages. Super admins (or no admin) see everything. */
export function useAdminScope() {
  const { currentAdmin } = usePlatform()
  const categories = currentAdmin ? SERVICE_CATEGORIES.filter((c) => currentAdmin.categories.includes(c.id)) : SERVICE_CATEGORIES
  const ids = new Set(categories.map((c) => c.id))
  const names = new Set(categories.map((c) => c.name))
  return {
    categories,
    bookingInScope: (booking) => ids.has(booking.categoryId),
    providerInScope: (provider) => names.has(provider.category),
  }
}
