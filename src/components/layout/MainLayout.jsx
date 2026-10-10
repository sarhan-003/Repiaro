import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import ErrorBoundary from '../common/ErrorBoundary'
import { LoadingState } from '../common/States'
import ActiveBookingBanner from './ActiveBookingBanner'
import Footer from './Footer'
import Navbar from './Navbar'

export default function MainLayout() {
  const { pathname } = useLocation()

  // New page → start at the top. Query-string changes (filters) keep the scroll position.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col pb-16 md:pb-0">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        <ErrorBoundary key={pathname}>
          <Suspense fallback={<LoadingState label="Loading page…" />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <ActiveBookingBanner />
    </div>
  )
}
