// localStorage wrappers. Storage can be missing (private mode, blocked site
// data) or hold anything at all, so every access is guarded and callers must
// validate what comes back.

export const STORAGE_KEYS = {
  bookings: 'har:bookings:v2',
  availability: 'har:availability:v1',
  dashboardProvider: 'har:dashboard-provider:v1',
  platform: 'har:platform:v1',
  session: 'har:console-session:v1',
  customer: 'har:customer:v1',
  partnerLive: 'har:partner-live:v1',
}

function getStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

export function isStorageAvailable() {
  const storage = getStorage()
  if (!storage) return false
  try {
    const probe = '__har_probe__'
    storage.setItem(probe, probe)
    storage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

/** Returns { found, value }. `found` is false when the key is absent or unreadable JSON. */
export function readJSON(key) {
  try {
    const raw = getStorage()?.getItem(key)
    if (raw == null) return { found: false, value: undefined }
    return { found: true, value: JSON.parse(raw) }
  } catch {
    return { found: false, value: undefined }
  }
}

export function writeJSON(key, value) {
  try {
    getStorage()?.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeKeys(keys) {
  const storage = getStorage()
  for (const key of keys) {
    try {
      storage?.removeItem(key)
    } catch {
      // ignore — storage unavailable
    }
  }
}
