import { Suspense, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import ErrorBoundary from '../common/ErrorBoundary'
import { LoadingState } from '../common/States'
import Logo from './Logo'
import PageContainer from './PageContainer'

/** Shell for the partner (service professional) app — separate from the customer website. */
export default function PartnerLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="sticky top-0 z-40 bg-navy text-white">
        <PageContainer className="flex h-16 items-center justify-between gap-4">
          <Logo inverted subtitle="Partner app" />
          <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-300 hover:text-white">
            Customer site
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </PageContainer>
      </header>
      <main id="main" className="flex-1">
        <ErrorBoundary key={pathname}>
          <Suspense fallback={<LoadingState label="Loading partner app…" />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  )
}
