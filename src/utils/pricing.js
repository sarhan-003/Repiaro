import { SERVICE_ITEMS } from '../data/sampleData'

/** Service items for a category with any super-admin fare overrides applied. */
export function getServiceItems(categoryId, fareOverrides = {}) {
  return (SERVICE_ITEMS[categoryId] ?? []).map((item) => ({
    ...item,
    fare: fareOverrides[`${categoryId}:${item.id}`] ?? item.fare,
  }))
}

/**
 * Upfront fare, ride-hailing style: item fare × surge + convenience fee.
 * @returns {{ item, surge, surgeAmount, fee, total }}
 */
export function computeFare(itemFare, surge = 1, convenienceFee = 0) {
  const surgeAmount = Math.round(itemFare * (surge - 1))
  return { item: itemFare, surge, surgeAmount, fee: convenienceFee, total: itemFare + surgeAmount + convenienceFee }
}

/** What the professional earns after platform commission. The convenience fee stays with the platform. */
export function partnerEarning(fare, commissionPct) {
  const labour = fare.item + fare.surgeAmount
  return Math.round(labour * (1 - commissionPct / 100))
}

/** Platform revenue from one completed booking. */
export function platformEarning(fare, commissionPct) {
  return fare.total - partnerEarning(fare, commissionPct)
}

export const SURGE_OPTIONS = [1, 1.2, 1.5, 2]
