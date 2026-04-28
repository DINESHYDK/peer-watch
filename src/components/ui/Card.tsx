import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glass?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const PADDING_STYLES = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export const Card: React.FC<CardProps> = ({
  hover = false,
  glass = false,
  padding = 'md',
  className = '',
  children,
  ...props
}) => (
  <div
    {...props}
    className={[
      'rounded-card shadow-card',
      glass
        ? 'glass'
        : 'bg-card',
      hover
        ? 'transition-all duration-300 hover:shadow-float hover:-translate-y-1 cursor-pointer'
        : '',
      PADDING_STYLES[padding],
      className,
    ].join(' ')}
  >
    {children}
  </div>
)
