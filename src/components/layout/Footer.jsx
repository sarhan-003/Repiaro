import { Link } from 'react-router-dom'
import { SERVICE_CATEGORIES } from '../../data/sampleData'
import Logo from './Logo'
import PageContainer from './PageContainer'

const EXPLORE = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'All services' },
  { to: '/providers', label: 'Find professionals' },
  { to: '/my-bookings', label: 'My bookings' },
  { to: '/partner', label: 'Partner app for professionals' },
]

function FooterColumn({ title, children }) {
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-white">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm">{children}</ul>
    </div>
  )
}

const linkClass = 'text-slate-300 transition-colors hover:text-white'

export default function Footer() {
  return (
    <footer className="mt-auto bg-navy text-slate-300">
      <PageContainer className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo inverted />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Your Home, Our Priority. Find local professionals for every home repair and maintenance need.
          </p>
        </div>

        <FooterColumn title="Explore">
          {EXPLORE.map(({ to, label }) => (
            <li key={to}>
              <Link to={to} className={linkClass}>
                {label}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Services">
          {SERVICE_CATEGORIES.map((category) => (
            <li key={category.id}>
              <Link to={`/book-now/${category.id}`} className={linkClass}>
                {category.name}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Support">
          <li className="leading-relaxed">Help centre, phone and email support will be added with customer accounts in Phase 2.</li>
          <li>
            <Link to="/services" className={linkClass}>
              Browse services
            </Link>
          </li>
          <li>
            <Link to="/my-bookings" className={linkClass}>
              Manage a booking
            </Link>
          </li>
        </FooterColumn>
      </PageContainer>

      <div className="border-t border-white/10">
        <PageContainer className="flex flex-col gap-2 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Home All-Rounder · Phase 1 frontend demo</p>
          <p>All professionals, reviews, prices and bookings shown are fictional sample data. Photos: Pexels.</p>
        </PageContainer>
      </div>
    </footer>
  )
}
