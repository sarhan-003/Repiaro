import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { CalendarCheck, House, LayoutGrid, Menu, UserRound, X } from 'lucide-react'
import { useBookings } from '../../hooks/useBookings'
import { useCustomer } from '../../hooks/usePlatform'
import { isUpcoming } from '../../utils/bookingHelpers'
import Button from '../common/Button'
import LocationPill from './LocationPill'
import Logo from './Logo'
import PageContainer from './PageContainer'
import ProfileDialog from './ProfileDialog'

// Customer website only — partner app and admin consoles live on their own routes.
const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/services', label: 'Services' },
  { to: '/providers', label: 'Professionals' },
  { to: '/my-bookings', label: 'My Bookings', badge: true },
]

const BOTTOM_ITEMS = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/services', label: 'Services', icon: LayoutGrid },
  { to: '/my-bookings', label: 'Bookings', icon: CalendarCheck, badge: true },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { bookings } = useBookings()
  const { profile } = useCustomer()
  const activeCount = bookings.filter(isUpcoming).length
  const closeMenu = () => setMenuOpen(false)
  const openProfile = () => {
    closeMenu()
    setProfileOpen(true)
  }
  const firstName = profile.name.split(' ')[0]

  const countBadge = activeCount > 0 && (
    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-bold leading-none text-on-primary">
      {activeCount}
      <span className="sr-only"> active</span>
    </span>
  )

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
        <PageContainer className="flex h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <Logo onClick={closeMenu} />
            <span className="hidden md:block">
              <LocationPill />
            </span>
          </div>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map(({ to, label, end, badge }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                        isActive ? 'bg-primary-soft text-ink' : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
                      }`
                    }
                  >
                    {label}
                    {badge && countBadge}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="hidden lg:inline-flex" onClick={openProfile}>
              <UserRound className="size-4" aria-hidden="true" />
              {firstName || 'Your details'}
            </Button>
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-xl text-ink hover:bg-slate-100 lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
            </button>
          </div>
        </PageContainer>

        {/* Location bar on phones, like the pickup field in a ride app. */}
        <div className="border-t border-line px-4 py-2 md:hidden">
          <LocationPill className="w-full justify-start" />
        </div>

        {menuOpen && (
          <nav id="mobile-menu" aria-label="Mobile" className="border-t border-line bg-white lg:hidden">
            <PageContainer className="py-3">
              <ul className="flex flex-col gap-1">
                {NAV_ITEMS.map(({ to, label, end, badge }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      onClick={closeMenu}
                      className={({ isActive }) =>
                        `flex min-h-12 items-center justify-between rounded-xl px-3 text-base font-semibold ${
                          isActive ? 'bg-primary-soft text-ink' : 'text-ink hover:bg-slate-100'
                        }`
                      }
                    >
                      {label}
                      {badge && countBadge}
                    </NavLink>
                  </li>
                ))}
              </ul>
              <Button variant="secondary" className="mt-3 w-full" onClick={openProfile}>
                <UserRound className="size-4" aria-hidden="true" />
                {firstName ? `${firstName}’s details` : 'Your details'}
              </Button>
            </PageContainer>
          </nav>
        )}
      </header>

      <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="grid grid-cols-4">
          {BOTTOM_ITEMS.map(({ to, label, icon: Icon, end, badge }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${isActive ? 'text-ink' : 'text-slate-500'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`flex h-7 w-12 items-center justify-center rounded-full ${isActive ? 'bg-primary' : ''}`}>
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    {label}
                    {badge && activeCount > 0 && (
                      <span className="absolute right-[calc(50%-1.6rem)] top-1.5 size-2 rounded-full bg-danger" aria-hidden="true" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
          <li>
            <button type="button" onClick={openProfile} className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold text-slate-500">
              <span className="flex h-7 w-12 items-center justify-center rounded-full">
                <UserRound className="size-5" aria-hidden="true" />
              </span>
              Profile
            </button>
          </li>
        </ul>
      </nav>

      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}
