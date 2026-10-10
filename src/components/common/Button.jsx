import { Link } from 'react-router-dom'

const BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50'

const VARIANTS = {
  primary: 'bg-primary text-on-primary shadow-sm hover:bg-primary-hover',
  secondary: 'border border-slate-300 bg-white text-ink hover:bg-slate-50',
  ghost: 'text-accent hover:bg-blue-50',
  danger: 'bg-danger text-white shadow-sm hover:bg-red-800',
  'danger-outline': 'border border-danger/30 bg-white text-danger hover:bg-red-50',
  success: 'bg-success text-white shadow-sm hover:bg-green-800',
  white: 'bg-white text-ink shadow-sm hover:bg-slate-50',
  dark: 'bg-ink text-white shadow-sm hover:bg-slate-800',
  'outline-light': 'border border-white/30 bg-white/10 text-white hover:bg-white/20',
}

const SIZES = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

function buttonClasses({ variant = 'primary', size = 'md', className = '' } = {}) {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`
}

/** Renders a router <Link> when `to` is given, otherwise a <button>. */
export default function Button({ to, variant, size, className, type = 'button', children, ...props }) {
  const classes = buttonClasses({ variant, size, className })
  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }
  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  )
}
