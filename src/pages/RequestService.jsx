import { useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Banknote, CalendarClock, CircleAlert, Clock, Flame, Info, QrCode, Zap } from 'lucide-react'
import DateSlotPicker from '../components/bookings/DateSlotPicker'
import TimeSlotPicker from '../components/bookings/TimeSlotPicker'
import Button from '../components/common/Button'
import { InputField, SelectField, TextAreaField } from '../components/common/FormFields'
import ProviderAvatar from '../components/common/ProviderAvatar'
import RatingDisplay from '../components/common/RatingDisplay'
import { ErrorState } from '../components/common/States'
import LocationPill from '../components/layout/LocationPill'
import PageContainer from '../components/layout/PageContainer'
import { getCategoryIcon } from '../components/services/categoryIcons'
import { LOCALITIES, SCHEDULE_SLOTS } from '../data/sampleData'
import { useBookings } from '../hooks/useBookings'
import { useCustomer, usePlatform } from '../hooks/usePlatform'
import { useToast } from '../hooks/useToast'
import { LIMITS, REQUEST_FIELDS, validateRequest } from '../utils/bookingHelpers'
import { formatCurrency } from '../utils/formatCurrency'
import { isSlotPast } from '../utils/formatDate'
import { computeFare, getServiceItems } from '../utils/pricing'
import { getCategoryById, getProviderById, getScheduleDates } from '../utils/providerHelpers'

function Section({ title, children, aside }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-bold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

function ChoiceChip({ name, value, checked, onChange, icon: Icon, title, subtitle }) {
  return (
    <label className="relative block cursor-pointer">
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} aria-label={`${title} — ${subtitle}`} className="peer sr-only" />
      <span className="flex items-center gap-3 rounded-xl border-2 border-line p-3 transition-colors peer-checked:border-ink peer-checked:bg-primary-soft peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
        <Icon className="size-5 shrink-0" aria-hidden="true" />
        <span>
          <span className="block text-sm font-bold">{title}</span>
          <span className="block text-xs text-muted">{subtitle}</span>
        </span>
      </span>
    </label>
  )
}

export default function RequestService() {
  const { categoryId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { requestService, isProviderOnline } = useBookings()
  const { activeProviders, isCategoryEnabled, isProviderActive, categories, fares, settings } = usePlatform()
  const { profile, saveProfile } = useCustomer()
  const { showToast } = useToast()
  const formRef = useRef(null)

  const category = getCategoryById(categoryId)
  const items = category ? getServiceItems(category.id, fares) : []
  const preferred = getProviderById(params.get('pro'))
  const preferredValid = preferred && category && preferred.category === category.name && isProviderActive(preferred.id) ? preferred : null
  const dates = getScheduleDates(7)

  const [values, setValues] = useState(() => ({
    itemId: items.some((i) => i.id === params.get('item')) ? params.get('item') : items[0]?.id ?? '',
    mode: 'now',
    date: '',
    timeSlot: '',
    address: profile.address,
    locality: profile.locality || preferredValid?.locality || '',
    customerName: profile.name,
    phone: profile.phone,
    description: '',
    payment: 'cash',
  }))
  const [errors, setErrors] = useState({})
  const [attempted, setAttempted] = useState(false)

  if (!category) {
    return (
      <PageContainer className="py-16">
        <title>Service not found — Home All-Rounder</title>
        <ErrorState title="We couldn’t find that service" description="Choose a service from the list to start a booking.">
          <Button to="/services">See all services</Button>
        </ErrorState>
      </PageContainer>
    )
  }

  if (!isCategoryEnabled(category.id)) {
    return (
      <PageContainer className="py-16">
        <title>{`${category.name} unavailable — Home All-Rounder`}</title>
        <ErrorState title={`${category.name} is temporarily unavailable`} description="Bookings for this service are paused right now. Please try another service.">
          <Button to="/services">Browse other services</Button>
        </ErrorState>
      </PageContainer>
    )
  }

  const Icon = getCategoryIcon(category.icon)
  const surge = categories[category.id]?.surge ?? 1
  const item = items.find((i) => i.id === values.itemId) ?? items[0]
  const fare = computeFare(item.fare, surge, settings.convenienceFee)
  const onlineNearby = activeProviders.filter(
    (p) => p.category === category.name && isProviderOnline(p) && (!values.locality || p.serviceAreas.includes(values.locality)),
  ).length
  const slots = SCHEDULE_SLOTS.map((slot) => ({ slot, disabled: Boolean(values.date) && isSlotPast(values.date, slot), reason: 'Passed' }))
  const ctx = { itemIds: items.map((i) => i.id), localities: LOCALITIES, dates }

  function update(field, value) {
    const next = { ...values, [field]: value }
    if (field === 'date' && next.timeSlot && isSlotPast(value, next.timeSlot)) next.timeSlot = ''
    setValues(next)
    if (attempted) setErrors(validateRequest(next, ctx))
  }

  const bind = (field) => ({ value: values[field], error: errors[field], onChange: (e) => update(field, e.target.value) })

  function focusField(name) {
    const element = formRef.current?.elements.namedItem(name)
    if (element instanceof RadioNodeList) [...element].find((r) => !r.disabled)?.focus()
    else element?.focus()
  }

  function handleSubmit(event) {
    event.preventDefault()
    setAttempted(true)
    const found = validateRequest(values, ctx)
    setErrors(found)
    const first = REQUEST_FIELDS.find((f) => found[f])
    if (first) {
      focusField(first)
      return
    }
    saveProfile({ name: values.customerName.trim(), phone: values.phone.trim(), address: values.address.trim(), locality: values.locality })
    const result = requestService({
      ...values,
      category: category.name,
      categoryId: category.id,
      service: item.name,
      fare,
      preferredProviderId: preferredValid?.id ?? null,
    })
    if (!result.ok) {
      showToast(result.error, 'error')
      return
    }
    navigate(`/track/${result.booking.id}`)
  }

  const errorCount = Object.keys(errors).length

  return (
    <>
      <title>{`Book ${category.name} — Home All-Rounder`}</title>
      <div className="bg-primary">
        <PageContainer className="py-5 sm:py-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800 hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Link>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <div>
                <h1 className="text-2xl font-extrabold sm:text-3xl">{category.name}</h1>
                <p className="text-sm text-slate-800">Upfront price · Pay after service</p>
              </div>
            </div>
            <LocationPill tone="dark" />
          </div>
        </PageContainer>
      </div>

      <PageContainer className="py-6 sm:py-8">
        <form ref={formRef} noValidate onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="min-w-0 space-y-4">
            {attempted && errorCount > 0 && (
              <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Please fix {errorCount === 1 ? '1 field' : `${errorCount} fields`} below.
              </p>
            )}

            {preferredValid && (
              <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
                <ProviderAvatar provider={preferredValid} className="size-12 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Requested professional</p>
                  <p className="truncate font-bold">{preferredValid.name}</p>
                  <RatingDisplay rating={preferredValid.rating} reviewCount={preferredValid.reviewCount} />
                </div>
                <p className="max-w-40 text-right text-xs text-muted">Offered first. If unavailable, we match the next nearest pro.</p>
              </div>
            )}

            <Section
              title="Choose a service"
              aside={
                surge > 1 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                    <Flame className="size-3.5" aria-hidden="true" />
                    High demand · {surge}×
                  </span>
                )
              }
            >
              <fieldset className="min-w-0">
                <legend className="sr-only">Service option</legend>
                <ul className="space-y-2">
                  {items.map((option) => {
                    const optionFare = computeFare(option.fare, surge, 0).total
                    return (
                      <li key={option.id}>
                        <label className="relative block cursor-pointer">
                          <input
                            type="radio"
                            name="itemId"
                            value={option.id}
                            checked={values.itemId === option.id}
                            onChange={() => update('itemId', option.id)}
                            aria-label={`${option.name}, ${formatCurrency(optionFare)}`}
                            className="peer sr-only"
                          />
                          <span className="flex items-center gap-3 rounded-xl border-2 border-line p-3 transition-colors hover:border-slate-300 peer-checked:border-ink peer-checked:bg-primary-soft peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
                            <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ${category.tint}`}>
                              <Icon className="size-5" aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-semibold">{option.name}</span>
                              <span className="inline-flex items-center gap-1 text-xs text-muted">
                                <Clock className="size-3" aria-hidden="true" />~{option.mins >= 60 ? `${Math.round(option.mins / 6) / 10} hr` : `${option.mins} min`}
                              </span>
                            </span>
                            <span className="text-right">
                              <span className="block font-extrabold">{formatCurrency(optionFare)}</span>
                              {surge > 1 && <span className="block text-xs text-muted line-through">{formatCurrency(option.fare)}</span>}
                            </span>
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </fieldset>
            </Section>

            <Section title="When do you need it?">
              <fieldset className="grid min-w-0 grid-cols-2 gap-2">
                <legend className="sr-only">Timing</legend>
                <ChoiceChip
                  name="mode"
                  value="now"
                  checked={values.mode === 'now'}
                  onChange={() => update('mode', 'now')}
                  icon={Zap}
                  title="Now"
                  subtitle={onlineNearby ? `${onlineNearby} pro${onlineNearby > 1 ? 's' : ''} online nearby` : 'No pros online nearby'}
                />
                <ChoiceChip
                  name="mode"
                  value="scheduled"
                  checked={values.mode === 'scheduled'}
                  onChange={() => update('mode', 'scheduled')}
                  icon={CalendarClock}
                  title="Schedule"
                  subtitle="Pick a date & time"
                />
              </fieldset>
              {values.mode === 'now' && onlineNearby === 0 && (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  No {category.name.toLowerCase()} pros are online near {values.locality || 'you'} right now. You can still try, or schedule for later.
                </p>
              )}
              {values.mode === 'scheduled' && (
                <div className="mt-4 space-y-4">
                  <DateSlotPicker dates={dates} value={values.date} onChange={(d) => update('date', d)} error={errors.date} />
                  <TimeSlotPicker slots={values.date ? slots : []} value={values.timeSlot} onChange={(s) => update('timeSlot', s)} error={errors.timeSlot} />
                </div>
              )}
            </Section>

            <Section title="Service address">
              <div className="space-y-4">
                <InputField
                  id="address"
                  label="House / flat, building and street"
                  required
                  autoComplete="street-address"
                  placeholder="e.g. Flat 4B, Green Residency, Paud Road"
                  maxLength={LIMITS.address.max}
                  {...bind('address')}
                />
                <SelectField id="locality" label="Locality" required {...bind('locality')}>
                  <option value="">Select your locality</option>
                  {LOCALITIES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </SelectField>
              </div>
            </Section>

            <Section title="Contact details">
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField id="customerName" label="Name" required autoComplete="name" maxLength={LIMITS.name.max} {...bind('customerName')} />
                <InputField id="phone" label="Mobile number" required type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" {...bind('phone')} />
              </div>
              <TextAreaField
                id="description"
                label="Note for the professional"
                optional
                className="mt-4 [&_textarea]:min-h-20"
                placeholder="e.g. Tap leaks from the base; parking available."
                maxLength={LIMITS.description.max}
                {...bind('description')}
              />
            </Section>

            <Section title="Payment">
              <fieldset className="grid min-w-0 grid-cols-2 gap-2">
                <legend className="sr-only">Payment method</legend>
                <ChoiceChip name="payment" value="cash" checked={values.payment === 'cash'} onChange={() => update('payment', 'cash')} icon={Banknote} title="Cash" subtitle="Pay after service" />
                <ChoiceChip name="payment" value="upi" checked={values.payment === 'upi'} onChange={() => update('payment', 'upi')} icon={QrCode} title="UPI" subtitle="Pay after service" />
              </fieldset>
              <p className="mt-2 text-xs text-muted">Demo: no payment is collected online.</p>
            </Section>
          </div>

          {/* Fare summary — sticky sheet on desktop, bottom bar on phones */}
          <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Fare summary">
            <div className="hidden rounded-2xl border border-line bg-white p-5 lg:block">
              <h2 className="font-bold">Fare estimate</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">{item.name}</dt>
                  <dd>{formatCurrency(fare.item)}</dd>
                </div>
                {fare.surgeAmount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted">High demand ({surge}×)</dt>
                    <dd>{formatCurrency(fare.surgeAmount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted">Convenience fee</dt>
                  <dd>{formatCurrency(fare.fee)}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-2 text-base font-extrabold">
                  <dt>Total</dt>
                  <dd>{formatCurrency(fare.total)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted">Labour only — parts and materials, if needed, are agreed with the pro. Demo prices.</p>
              <Button type="submit" size="lg" className="mt-4 w-full">
                Book {values.mode === 'now' ? 'now' : 'slot'} · {formatCurrency(fare.total)}
              </Button>
            </div>
            <div className="fixed inset-x-0 bottom-16 z-30 border-t border-line bg-white px-4 py-3 shadow-[0_-4px_16px_rgb(0_0_0/0.06)] md:bottom-0 lg:hidden">
              <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
                <p className="leading-tight">
                  <span className="block text-xl font-extrabold">{formatCurrency(fare.total)}</span>
                  <span className="text-xs text-muted">{item.name}</span>
                </p>
                <Button type="submit" size="lg" className="px-6">
                  Book {values.mode === 'now' ? 'now' : 'slot'}
                </Button>
              </div>
            </div>
          </aside>
        </form>
        <div className="h-20 lg:hidden" aria-hidden="true" />
      </PageContainer>
    </>
  )
}
