import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'

export const ToastContext = createContext(null)

const TONES = {
  success: { icon: CircleCheck, className: 'border-success/30 text-success' },
  error: { icon: CircleAlert, className: 'border-danger/30 text-danger' },
  info: { icon: Info, className: 'border-primary/30 text-primary' },
}

let nextId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message, tone = 'success') => {
      const id = nextId++
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }])
      timers.current.set(id, setTimeout(() => dismiss(id), 4500))
    },
    [dismiss],
  )

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end"
      >
        {toasts.map(({ id, message, tone }) => {
          const { icon: Icon, className } = TONES[tone] ?? TONES.info
          return (
            <div
              key={id}
              role="status"
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg animate-toast-in ${className}`}
            >
              <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <p className="flex-1 text-sm font-medium text-ink">{message}</p>
              <button
                type="button"
                onClick={() => dismiss(id)}
                className="rounded-md p-0.5 text-muted hover:text-ink"
                aria-label="Dismiss notification"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
