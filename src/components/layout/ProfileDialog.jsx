import { useState } from 'react'
import { useCustomer } from '../../hooks/usePlatform'
import { useToast } from '../../hooks/useToast'
import { isValidIndianMobile, LIMITS } from '../../utils/bookingHelpers'
import Button from '../common/Button'
import { InputField } from '../common/FormFields'
import Modal from '../common/Modal'

function ProfileForm({ onClose }) {
  const { profile, saveProfile } = useCustomer()
  const { showToast } = useToast()
  const [values, setValues] = useState({ name: profile.name, phone: profile.phone, address: profile.address })
  const [errors, setErrors] = useState({})

  function handleSubmit(event) {
    event.preventDefault()
    const found = {}
    if (values.name.trim() && values.name.trim().length < LIMITS.name.min) found.name = `At least ${LIMITS.name.min} characters.`
    if (values.phone.trim() && !isValidIndianMobile(values.phone)) found.phone = 'Enter a valid 10-digit Indian mobile number.'
    setErrors(found)
    if (Object.keys(found).length) return
    saveProfile({ name: values.name.trim(), phone: values.phone.trim(), address: values.address.trim() })
    showToast('Profile saved on this device.')
    onClose()
  }

  const bind = (field) => ({ value: values[field], error: errors[field], onChange: (e) => setValues((v) => ({ ...v, [field]: e.target.value })) })

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <InputField id="profile-name" label="Name" autoComplete="name" maxLength={LIMITS.name.max} {...bind('name')} />
      <InputField id="profile-phone" label="Mobile number" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" {...bind('phone')} />
      <InputField id="profile-address" label="Default address" autoComplete="street-address" maxLength={LIMITS.address.max} {...bind('address')} />
      <p className="text-xs text-muted">
        Saved only in this browser to prefill bookings. Sign-in with OTP arrives in Phase 2 — no account or password is created here.
      </p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Save details</Button>
      </div>
    </form>
  )
}

export default function ProfileDialog({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Your details" description="Book faster next time.">
      {open && <ProfileForm onClose={onClose} />}
    </Modal>
  )
}
