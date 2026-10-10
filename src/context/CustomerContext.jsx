import { createContext, useEffect, useMemo, useState } from 'react'
import { LOCALITIES } from '../data/sampleData'
import { LIMITS } from '../utils/bookingHelpers'
import { readJSON, STORAGE_KEYS, writeJSON } from '../utils/storage'

/**
 * The customer's saved details: current location (like a ride app's pickup point)
 * and contact details remembered after the first booking. Stored only in this browser.
 */
export const CustomerContext = createContext(null)

const EMPTY = { locality: '', name: '', phone: '', address: '' }

function sanitizeProfile(raw) {
  if (!raw || typeof raw !== 'object') return EMPTY
  const text = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '')
  return {
    locality: LOCALITIES.includes(raw.locality) ? raw.locality : '',
    name: text(raw.name, LIMITS.name.max),
    phone: text(raw.phone, 20),
    address: text(raw.address, LIMITS.address.max),
  }
}

export function CustomerProvider({ children }) {
  const [profile, setProfile] = useState(() => sanitizeProfile(readJSON(STORAGE_KEYS.customer).value))

  useEffect(() => {
    writeJSON(STORAGE_KEYS.customer, profile)
  }, [profile])

  const value = useMemo(
    () => ({
      profile,
      setLocality: (locality) => setProfile((p) => ({ ...p, locality })),
      saveProfile: (patch) => setProfile((p) => sanitizeProfile({ ...p, ...patch })),
    }),
    [profile],
  )

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>
}
