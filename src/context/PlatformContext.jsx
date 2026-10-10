import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { ALL_PROVIDERS, DEFAULT_ADMINS, DEFAULT_SETTINGS, SERVICE_CATEGORIES, SERVICE_ITEMS } from '../data/sampleData'
import { SURGE_OPTIONS } from '../utils/pricing'
import { readJSON, removeKeys, STORAGE_KEYS, writeJSON } from '../utils/storage'

/**
 * Platform configuration owned by the consoles:
 * - super admin: settings, category pricing, admin accounts, audit log
 * - admin: provider account status (approve / suspend)
 * plus the demo console session. No real authentication exists in Phase 1.
 *
 * Phase 2: back every action here with an authorised API call.
 */
export const PlatformContext = createContext(null)

const providerIds = new Set(ALL_PROVIDERS.map((p) => p.id))
const categoryIds = SERVICE_CATEGORIES.map((c) => c.id)
const ACCOUNT_STATUSES = ['active', 'suspended', 'pending', 'rejected']

const defaultAccounts = () =>
  Object.fromEntries(ALL_PROVIDERS.map((p) => [p.id, p.isApplicant ? 'pending' : 'active']))

const defaultCategories = () => Object.fromEntries(categoryIds.map((id) => [id, { enabled: true, surge: 1 }]))

function defaultPlatform() {
  return {
    settings: { ...DEFAULT_SETTINGS },
    categories: defaultCategories(),
    fares: {},
    admins: DEFAULT_ADMINS.map((a) => ({ ...a })),
    accounts: defaultAccounts(),
    audit: [],
  }
}

const clampNum = (v, min, max, fallback) => (Number.isFinite(Number(v)) ? Math.min(max, Math.max(min, Number(v))) : fallback)

/** Validates platform data read from storage, falling back to defaults field by field. */
function sanitizePlatform(raw) {
  const base = defaultPlatform()
  if (!raw || typeof raw !== 'object') return base
  const s = raw.settings ?? {}
  base.settings = {
    commissionPct: clampNum(s.commissionPct, 0, 50, DEFAULT_SETTINGS.commissionPct),
    convenienceFee: clampNum(s.convenienceFee, 0, 199, DEFAULT_SETTINGS.convenienceFee),
    offerTimeoutSec: clampNum(s.offerTimeoutSec, 5, 120, DEFAULT_SETTINGS.offerTimeoutSec),
    demoAutopilot: typeof s.demoAutopilot === 'boolean' ? s.demoAutopilot : DEFAULT_SETTINGS.demoAutopilot,
    autoAcceptSec: clampNum(s.autoAcceptSec, 1, 60, DEFAULT_SETTINGS.autoAcceptSec),
    travelSec: clampNum(s.travelSec, 5, 600, DEFAULT_SETTINGS.travelSec),
    jobSec: clampNum(s.jobSec, 5, 600, DEFAULT_SETTINGS.jobSec),
  }
  for (const id of categoryIds) {
    const c = raw.categories?.[id]
    if (c) base.categories[id] = { enabled: c.enabled !== false, surge: SURGE_OPTIONS.includes(c.surge) ? c.surge : 1 }
  }
  if (raw.fares && typeof raw.fares === 'object') {
    for (const [key, value] of Object.entries(raw.fares)) {
      const [cat, item] = key.split(':')
      if (SERVICE_ITEMS[cat]?.some((i) => i.id === item) && Number.isFinite(value) && value >= 49 && value <= 50000) base.fares[key] = value
    }
  }
  if (Array.isArray(raw.admins)) {
    const admins = raw.admins
      .filter((a) => a && typeof a.id === 'string' && typeof a.name === 'string' && typeof a.email === 'string')
      .map((a) => ({
        id: a.id.slice(0, 40),
        name: a.name.slice(0, 60),
        email: a.email.slice(0, 80),
        categories: Array.isArray(a.categories) ? a.categories.filter((c) => categoryIds.includes(c)) : [],
        active: a.active !== false,
      }))
    if (admins.length) base.admins = admins
  }
  if (raw.accounts && typeof raw.accounts === 'object') {
    for (const [id, status] of Object.entries(raw.accounts)) if (providerIds.has(id) && ACCOUNT_STATUSES.includes(status)) base.accounts[id] = status
  }
  if (Array.isArray(raw.audit)) {
    base.audit = raw.audit
      .filter((e) => e && typeof e.actor === 'string' && typeof e.action === 'string' && !Number.isNaN(Date.parse(e.at)))
      .slice(0, 200)
      .map((e) => ({ id: String(e.id ?? e.at), at: e.at, actor: e.actor.slice(0, 80), action: e.action.slice(0, 200) }))
  }
  return base
}

function sanitizeSession(raw) {
  if (raw?.role === 'superadmin') return { role: 'superadmin' }
  if (raw?.role === 'admin' && typeof raw.adminId === 'string') return { role: 'admin', adminId: raw.adminId }
  return null
}

let auditSeq = 0

export function PlatformProvider({ children }) {
  const [platform, setPlatform] = useState(() => sanitizePlatform(readJSON(STORAGE_KEYS.platform).value))
  const [session, setSession] = useState(() => sanitizeSession(readJSON(STORAGE_KEYS.session).value))

  useEffect(() => {
    writeJSON(STORAGE_KEYS.platform, platform)
  }, [platform])
  useEffect(() => {
    writeJSON(STORAGE_KEYS.session, session)
  }, [session])

  // Keep consoles and the customer site in sync across tabs.
  useEffect(() => {
    function handleStorage(event) {
      if (event.key !== STORAGE_KEYS.platform) return
      try {
        setPlatform(sanitizePlatform(JSON.parse(event.newValue)))
      } catch {
        // ignore malformed values
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const currentAdmin = session?.role === 'admin' ? platform.admins.find((a) => a.id === session.adminId && a.active) ?? null : null
  const actorName = session?.role === 'superadmin' ? 'Super Admin' : currentAdmin ? `Admin · ${currentAdmin.name}` : 'System'

  /** Applies an update and records it in the audit log. */
  const act = useCallback(
    (description, updater) => {
      setPlatform((prev) => {
        const next = updater(prev)
        const entry = { id: `${Date.now()}-${auditSeq++}`, at: new Date().toISOString(), actor: actorName, action: description }
        return { ...next, audit: [entry, ...prev.audit].slice(0, 200) }
      })
    },
    [actorName],
  )

  const value = useMemo(() => {
    const isProviderActive = (id) => platform.accounts[id] === 'active'
    return {
      ...platform,
      session,
      currentAdmin,
      isProviderActive,
      /** Providers customers can see and book. */
      activeProviders: ALL_PROVIDERS.filter((p) => isProviderActive(p.id)),
      isCategoryEnabled: (id) => platform.categories[id]?.enabled !== false,

      signInSuperAdmin: () => setSession({ role: 'superadmin' }),
      signInAdmin: (adminId) => setSession({ role: 'admin', adminId }),
      signOut: () => setSession(null),

      logAction: (description) => act(description, (p) => p),

      setProviderAccount: (providerId, status, label) =>
        act(label, (p) => ({ ...p, accounts: { ...p.accounts, [providerId]: status } })),

      updateSettings: (patch, label) => act(label, (p) => ({ ...p, settings: { ...p.settings, ...patch } })),
      updateCategory: (categoryId, patch, label) =>
        act(label, (p) => ({ ...p, categories: { ...p.categories, [categoryId]: { ...p.categories[categoryId], ...patch } } })),
      setItemFare: (categoryId, itemId, fare, label) =>
        act(label, (p) => ({ ...p, fares: { ...p.fares, [`${categoryId}:${itemId}`]: fare } })),

      addAdmin: (admin) =>
        act(`Created admin ${admin.name}`, (p) => ({ ...p, admins: [...p.admins, { ...admin, id: `admin-${Date.now()}`, active: true }] })),
      updateAdmin: (adminId, patch, label) =>
        act(label, (p) => ({ ...p, admins: p.admins.map((a) => (a.id === adminId ? { ...a, ...patch } : a)) })),

      resetPlatform: () => {
        removeKeys([STORAGE_KEYS.platform])
        setPlatform(defaultPlatform())
      },
    }
  }, [platform, session, currentAdmin, act])

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>
}
