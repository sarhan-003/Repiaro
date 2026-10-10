import SmartImage from './SmartImage'

const initials = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

/** Provider portrait that falls back to the provider's initials. */
export default function ProviderAvatar({
  provider,
  name = provider?.name ?? '',
  className = 'size-12 rounded-full',
  textClassName = 'text-sm',
  ...props
}) {
  return (
    <SmartImage
      src={provider?.image}
      alt={`Portrait of ${name}`}
      className={`shrink-0 object-top ${className}`}
      fallback={<span className={`font-semibold text-primary-ink ${textClassName}`}>{initials(name)}</span>}
      {...props}
    />
  )
}
