import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ban, CalendarX2, CircleCheckBig, Radar, RotateCcw, Search, Star } from 'lucide-react'
import BookingCard from '../components/bookings/BookingCard'
import RateServiceDialog from '../components/bookings/RateServiceDialog'
import Button from '../components/common/Button'
import ConfirmDialog from '../components/common/ConfirmDialog'
import DemoDataNotice from '../components/common/DemoDataNotice'
import { PageHeader } from '../components/common/Headings'
import { EmptyState } from '../components/common/States'
import Tabs from '../components/common/Tabs'
import PageContainer from '../components/layout/PageContainer'
import { useBookings } from '../hooks/useBookings'
import { useToast } from '../hooks/useToast'
import { canReview, isUpcoming } from '../utils/bookingHelpers'

const byUpdatedDesc = (a, b) => b.updatedAt.localeCompare(a.updatedAt)

const TABS = {
  active: { label: 'Active', match: isUpcoming },
  completed: { label: 'Completed', match: (b) => b.status === 'completed' },
  cancelled: { label: 'Cancelled', match: (b) => b.status === 'cancelled' || b.status === 'unfulfilled' },
  all: { label: 'All', match: () => true },
}

const EMPTY_COPY = {
  active: { icon: Radar, title: 'No active bookings', text: 'Book a service and track your professional here in real time.' },
  completed: { icon: CircleCheckBig, title: 'No completed bookings yet', text: 'Finished jobs appear here, ready for you to rate.' },
  cancelled: { icon: Ban, title: 'Nothing cancelled', text: 'Cancelled bookings and requests with no available pro show here.' },
  all: { icon: CalendarX2, title: 'You have no bookings', text: 'Pick a service to get started.' },
}

export default function MyBookings() {
  const navigate = useNavigate()
  const { bookings, addReview, resetDemoData, storageAvailable } = useBookings()
  const { showToast } = useToast()
  const [tab, setTab] = useState(() => (bookings.some(isUpcoming) ? 'active' : 'all'))
  const [rateId, setRateId] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const visible = bookings.filter(TABS[tab].match).sort(byUpdatedDesc)
  const rateTarget = bookings.find((b) => b.id === rateId) ?? null
  const empty = EMPTY_COPY[tab]

  function handleReview(rating, comment) {
    const result = addReview(rateId, rating, comment)
    if (result.ok) {
      showToast('Thanks! Your review has been saved.')
      setRateId(null)
    }
    return result
  }

  return (
    <>
      <title>My Bookings — Home All-Rounder</title>
      <PageHeader title="My Bookings" description="Track live jobs, see past services and rate your professionals.">
        <div className="flex flex-wrap gap-2">
          <Button to="/services">
            <Search className="size-4" aria-hidden="true" />
            Book a service
          </Button>
          <Button variant="secondary" onClick={() => setConfirmReset(true)}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Reset demo data
          </Button>
        </div>
      </PageHeader>

      <PageContainer className="max-w-4xl py-8 sm:py-10">
        <Tabs
          label="Filter bookings"
          value={tab}
          onChange={setTab}
          options={Object.entries(TABS).map(([value, { label, match }]) => ({ value, label, count: bookings.filter(match).length }))}
        />

        <div className="mt-5 space-y-3">
          {visible.length > 0 ? (
            visible.map((booking) => (
              <BookingCard key={booking.id} booking={booking} onViewDetails={(b) => navigate(`/track/${b.id}`)}>
                {canReview(booking) && (
                  <Button size="sm" onClick={() => setRateId(booking.id)}>
                    <Star className="size-4" aria-hidden="true" />
                    Rate service
                  </Button>
                )}
              </BookingCard>
            ))
          ) : (
            <EmptyState icon={empty.icon} title={empty.title} description={empty.text}>
              <Button to="/services">Book a service</Button>
            </EmptyState>
          )}
        </div>

        <DemoDataNotice className="mt-6">
          {storageAvailable
            ? 'Bookings are demo data saved only in this browser. Items tagged “Sample” were pre-loaded as examples.'
            : 'Browser storage is unavailable, so demo bookings will be lost when you reload.'}
        </DemoDataNotice>
      </PageContainer>

      <RateServiceDialog booking={rateTarget} onSubmit={handleReview} onClose={() => setRateId(null)} />

      <ConfirmDialog
        open={confirmReset}
        title="Reset demo data?"
        description="All bookings you created, reviews and status changes will be removed and the sample bookings restored."
        confirmLabel="Reset demo data"
        onConfirm={() => {
          resetDemoData()
          setConfirmReset(false)
          showToast('Demo data reset.', 'info')
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </>
  )
}
