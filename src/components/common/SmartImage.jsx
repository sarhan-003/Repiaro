import { useState } from 'react'
import { ImageOff } from 'lucide-react'

/**
 * <img> with a graceful fallback. If the source is missing or fails to load,
 * a styled placeholder (icon or custom node) takes its place — never a broken
 * image icon.
 */
export default function SmartImage({ src, alt, className = '', fallbackIcon: Icon = ImageOff, fallback, ...props }) {
  const [failedSrc, setFailedSrc] = useState(null)

  if (!src || failedSrc === src) {
    return (
      <div
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={`flex items-center justify-center bg-linear-to-br from-primary-soft to-slate-100 text-primary-ink/50 ${className}`}
      >
        {fallback ?? <Icon className="size-10" aria-hidden="true" />}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailedSrc(src)}
      className={`bg-slate-100 object-cover ${className}`}
      {...props}
    />
  )
}
