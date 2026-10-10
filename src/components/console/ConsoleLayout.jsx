import { Suspense, useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  ArrowUpRight,
  CalendarCheck,
  ClipboardList,
  Crown,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Settings,
  ShieldCheck,
  Tags,
  Users,
} from 'lucide-react'
import { SERVICE_CATEGORIES } from '../../data/sampleData'
import { usePlatform } from '../../hooks/usePlatform'
import Button from '../common/Button'
import ErrorBoundary from '../common/ErrorBoundary'
import { LoadingState } from '../common/States'
import Logo from '../layout/Logo'

const NAV = {
  admin: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/bookings', label: 'Live bookings', icon: CalendarCheck },
    { to: '/admin/providers', label: 'Service providers', icon: Users },
    { to: '/admin/applications', label: 'Applications', icon: FileCheck2 },
  ],
  superadmin: [
    { to: '/superadmin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/superadmin/admins', label: 'Admins', icon: ShieldCheck },
    { to: '/superadmin/pricing', label: 'Services & pricing', icon: Tags },
    { to: '/superadmin/settings', label: 'Platform settings', icon: Settings },
    { to: '/superadmin/audit', label: 'Audit log', icon: ScrollText },
  ],
}

const categoryNames = (ids) => SERVICE_CATEGORIES.filter((c) => ids.includes(c.id)).map((c) => c.name)

/** Demo-only access screen. Phase 1 has no authentication; Phase 2 replaces this with secure sign-in. */
function ConsoleGate({ role }) {
  const { admins, signInAdmin, signInSuperAdmin, session } = usePlatform()
  const disabledSession = session?.role === 'admin' && !admins.find((a) => a.id === session.adminId)?.active

  return (
    <div className="flex min-h-dvh items-center justify-center bg-navy px-4 py-10">
      <title>{role === 'superadmin' ? 'Super Admin — sign in' : 'Admin console — sign in'}</title>
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8">
        <Logo subtitle={role === 'superadmin' ? 'Super Admin console' : 'Admin console'} />
        <h1 className="mt-6 text-2xl font-extrabold">{role === 'superadmin' ? 'Super Admin access' : 'Admin access'}</h1>
        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Demo access only. Phase 1 has no real authentication — do not enter real credentials anywhere. Secure sign-in arrives in Phase 2.
        </p>
        {disabledSession && <p className="mt-3 text-sm font-semibold text-danger">Your admin account has been disabled by the super admin.</p>}

        {role === 'superadmin' ? (
          <Button size="lg" className="mt-6 w-full" onClick={signInSuperAdmin}>
            <Crown className="size-5" aria-hidden="true" />
            Enter as Super Admin (demo)
          </Button>
        ) : (
          <ul className="mt-6 space-y-2">
            {admins.map((admin) => (
              <li key={admin.id}>
                <button
                  type="button"
                  disabled={!admin.active}
                  onClick={() => signInAdmin(admin.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line p-4 text-left transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line"
                >
                  <span className="min-w-0">
                    <span className="block font-bold">{admin.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {admin.email} · {categoryNames(admin.categories).join(', ') || 'No categories'}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold">{admin.active ? 'Continue →' : 'Disabled'}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Link to="/" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
          Back to customer site
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

/** Shell for /admin and /superadmin — deliberately separate from the customer website. */
export default function ConsoleLayout({ role }) {
  const { session, currentAdmin, signOut } = usePlatform()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  const allowed = role === 'superadmin' ? session?.role === 'superadmin' : session?.role === 'admin' && currentAdmin
  if (!allowed) return <ConsoleGate role={role} />

  const who = role === 'superadmin' ? { name: 'Super Admin', detail: 'Platform owner' } : { name: currentAdmin.name, detail: categoryNames(currentAdmin.categories).join(', ') }

  return (
    <div className="min-h-dvh bg-surface lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="bg-navy text-slate-300 lg:sticky lg:top-0 lg:h-dvh" aria-label="Console navigation">
        <div className="flex h-full flex-col gap-4 p-4 lg:p-5">
          <div className="flex items-center justify-between gap-3">
            <Logo inverted subtitle={role === 'superadmin' ? 'Super Admin' : 'Admin console'} />
            <button type="button" onClick={signOut} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden" aria-label="Sign out">
              <LogOut className="size-5" aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Console sections">
            <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 lg:flex-col">
              {NAV[role].map(({ to, label, icon: Icon, end }) => (
                <li key={to} className="shrink-0">
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${isActive ? 'bg-primary text-ink' : 'hover:bg-white/10 hover:text-white'}`
                    }
                  >
                    <Icon className="size-5" aria-hidden="true" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto hidden rounded-2xl bg-white/5 p-4 lg:block">
            <p className="flex items-center gap-2 text-sm font-bold text-white">
              {role === 'superadmin' ? <Crown className="size-4 text-primary" aria-hidden="true" /> : <ClipboardList className="size-4 text-primary" aria-hidden="true" />}
              {who.name}
            </p>
            <p className="mt-1 text-xs text-slate-400">{who.detail}</p>
            <button type="button" onClick={signOut} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </aside>
      <main id="main" className="min-w-0 p-4 sm:p-6 lg:p-8">
        <ErrorBoundary key={pathname}>
          <Suspense fallback={<LoadingState label="Loading console…" />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
        <p className="mt-10 text-center text-xs text-muted">Demo console · fictional data · changes are saved in this browser only.</p>
      </main>
    </div>
  )
}
