import { lazy } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import ConsoleLayout from './components/console/ConsoleLayout'
import MainLayout from './components/layout/MainLayout'
import PartnerLayout from './components/layout/PartnerLayout'
import { getCategoryByName, getProviderById } from './utils/providerHelpers'

// Customer website
const Home = lazy(() => import('./pages/Home'))
const Services = lazy(() => import('./pages/Services'))
const Providers = lazy(() => import('./pages/Providers'))
const ProviderDetails = lazy(() => import('./pages/ProviderDetails'))
const RequestService = lazy(() => import('./pages/RequestService'))
const TrackBooking = lazy(() => import('./pages/TrackBooking'))
const MyBookings = lazy(() => import('./pages/MyBookings'))
const NotFound = lazy(() => import('./pages/NotFound'))
// Partner app (service professionals)
const PartnerApp = lazy(() => import('./pages/partner/PartnerApp'))
// Admin console (manages service providers in assigned categories)
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'))
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings'))
const AdminProviders = lazy(() => import('./pages/admin/AdminProviders'))
const AdminApplications = lazy(() => import('./pages/admin/AdminApplications'))
// Super admin console (platform owner)
const SuperOverview = lazy(() => import('./pages/superadmin/SuperOverview'))
const SuperAdmins = lazy(() => import('./pages/superadmin/SuperAdmins'))
const SuperPricing = lazy(() => import('./pages/superadmin/SuperPricing'))
const SuperSettings = lazy(() => import('./pages/superadmin/SuperSettings'))
const SuperAudit = lazy(() => import('./pages/superadmin/SuperAudit'))

/** Old provider booking links now open the request flow with that professional preferred. */
function LegacyBookRedirect() {
  const { providerId } = useParams()
  const provider = getProviderById(providerId)
  const category = provider && getCategoryByName(provider.category)
  return <Navigate to={category ? `/book-now/${category.id}?pro=${provider.id}` : '/services'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="services" element={<Services />} />
        <Route path="providers" element={<Providers />} />
        <Route path="providers/:id" element={<ProviderDetails />} />
        <Route path="book-now/:categoryId" element={<RequestService />} />
        <Route path="book/:providerId" element={<LegacyBookRedirect />} />
        <Route path="track/:bookingId" element={<TrackBooking />} />
        <Route path="my-bookings" element={<MyBookings />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route element={<PartnerLayout />}>
        <Route path="partner" element={<PartnerApp />} />
        <Route path="provider/dashboard" element={<Navigate to="/partner" replace />} />
      </Route>

      <Route path="admin" element={<ConsoleLayout role="admin" />}>
        <Route index element={<AdminOverview />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="providers" element={<AdminProviders />} />
        <Route path="applications" element={<AdminApplications />} />
      </Route>

      <Route path="superadmin" element={<ConsoleLayout role="superadmin" />}>
        <Route index element={<SuperOverview />} />
        <Route path="admins" element={<SuperAdmins />} />
        <Route path="pricing" element={<SuperPricing />} />
        <Route path="settings" element={<SuperSettings />} />
        <Route path="audit" element={<SuperAudit />} />
      </Route>
    </Routes>
  )
}
