import { House, LayoutGrid, SearchX } from 'lucide-react'
import Button from '../components/common/Button'
import PageContainer from '../components/layout/PageContainer'

export default function NotFound() {
  return (
    <PageContainer className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <title>Page not found — Home All-Rounder</title>
      <span className="flex size-16 items-center justify-center rounded-2xl bg-primary-soft text-primary-ink">
        <SearchX className="size-8" aria-hidden="true" />
      </span>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-primary-ink">Error 404</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">This page doesn’t exist</h1>
      <p className="mt-3 max-w-md text-muted">The link may be broken or the page may have moved. Try one of these instead.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button to="/" size="lg">
          <House className="size-5" aria-hidden="true" />
          Go to Home
        </Button>
        <Button to="/services" variant="secondary" size="lg">
          <LayoutGrid className="size-5" aria-hidden="true" />
          Browse Services
        </Button>
      </div>
    </PageContainer>
  )
}
