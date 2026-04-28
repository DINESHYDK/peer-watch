import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'yellow'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  fullWidth?: boolean
}

const VARIANT_STYLES: Record<Variant, string> = {
  primary:
    'bg-violet-gradient text-white shadow-float hover:shadow-glow hover:-translate-y-0.5',
  secondary:
    'bg-card border-2 border-accent-violet text-accent-violet hover:bg-accent-violet-dim hover:-translate-y-0.5',
  ghost:
    'bg-transparent text-text-muted hover:bg-accent-violet-dim hover:text-accent-violet',
  danger:
    'bg-red-500 text-white hover:bg-red-600 hover:-translate-y-0.5 shadow-float',
  yellow:
    'bg-yellow-gradient text-text-heading shadow-float hover:shadow-glow hover:-translate-y-0.5',
}

const SIZE_STYLES: Record<Size, string> = {
  sm: 'px-4 py-1.5 text-xs gap-1.5',
  md: 'px-6 py-2.5 text-sm gap-2',
  lg: 'px-8 py-3.5 text-base gap-2.5',
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const isDisabled = disabled || loading

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-semibold rounded-pill',
        'transition-all duration-200 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet focus-visible:ring-offset-2',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
        className,
      ].join(' ')}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}
