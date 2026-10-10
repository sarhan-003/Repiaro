import { useState } from 'react'
import { Star } from 'lucide-react'
import { LIMITS } from '../../utils/bookingHelpers'
import { formatDisplayDate, formatTimeSlot } from '../../utils/formatDate'
import { getProviderById } from '../../utils/providerHelpers'
import Button from '../common/Button'
import Modal from '../common/Modal'
import ProviderAvatar from '../common/ProviderAvatar'

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']

function RatingForm({ booking, onSubmit, onCancel }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const provider = getProviderById(booking.providerId)
  const shown = hovered || rating

  function handleSubmit(event) {
    event.preventDefault()
    if (!rating) {
      setError('Choose a star rating before submitting.')
      return
    }
    const result = onSubmit(rating, comment)
    if (!result.ok) setError(result.error)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex items-center gap-3 rounded-xl border border-line p-3">
        <ProviderAvatar provider={provider} name={booking.providerName} className="size-14 rounded-lg" />
        <div className="min-w-0">
          <p className="truncate font-bold">{booking.providerName}</p>
          <p className="text-sm text-muted">
            {booking.category} - {booking.service}
          </p>
          <p className="text-sm text-muted">
            {formatDisplayDate(booking.date)}
            {booking.timeSlot && ` at ${formatTimeSlot(booking.timeSlot)}`}
          </p>
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className="font-bold">How was your experience?</legend>
        <div className="mt-3 flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className="relative cursor-pointer" onMouseEnter={() => setHovered(value)}>
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => {
                  setRating(value)
                  setError('')
                }}
                className="peer sr-only"
              />
              <span className="block rounded-lg p-1 peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
                <Star
                  className="size-10"
                  fill={value <= shown ? '#FFC61A' : 'none'}
                  stroke={value <= shown ? '#F5B800' : '#cbd5e1'}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </span>
              <span className="sr-only">
                {value} star{value > 1 ? 's' : ''} – {LABELS[value]}
              </span>
            </label>
          ))}
          <span className="ml-2 text-sm font-semibold text-muted" aria-hidden="true">
            {LABELS[shown]}
          </span>
        </div>
      </fieldset>

      <label htmlFor="review-comment" className="mt-5 block text-sm font-medium">
        Your review <span className="font-normal text-muted">(optional)</span>
      </label>
      <textarea
        id="review-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={LIMITS.review.max}
        placeholder="What went well? Anything that could be better?"
        className="mt-1.5 block min-h-28 w-full resize-y rounded-xl border border-line px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
      <p className="mt-1 text-right text-xs text-muted">
        {comment.length}/{LIMITS.review.max}
      </p>

      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}

      <p className="mt-3 text-xs text-muted">Demo review: saved in this browser and shown on the provider dashboard.</p>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="sm:px-8">
          Submit Review
        </Button>
      </div>
    </form>
  )
}

export default function RateServiceDialog({ booking, onSubmit, onClose }) {
  return (
    <Modal open={booking != null} onClose={onClose} title="Rate your service">
      {booking && <RatingForm key={booking.id} booking={booking} onSubmit={onSubmit} onCancel={onClose} />}
    </Modal>
  )
}
