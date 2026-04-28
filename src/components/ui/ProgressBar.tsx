import React from 'react'

interface ProgressBarProps {
  value: number       // 0–100
  total?: number      // optional: show x/total label
  completed?: number
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md'
  color?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  total,
  completed,
  className = '',
  showLabel = true,
  size = 'md',
  color,
}) => {
  const pct = Math.min(100, Math.max(0, value))

  const barColor = color ?? (
    pct >= 90 ? '#5B21B6' :
    pct >= 70 ? '#059669' :
    pct >= 50 ? '#D97706' :
    '#EF4444'
  )

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-semibold text-text-muted">
            {total !== undefined && completed !== undefined
              ? `${completed}/${total} tasks`
              : `${Math.round(pct)}%`}
          </span>
          <span className="text-xs font-bold" style={{ color: barColor }}>
            {Math.round(pct)}%
          </span>
        </div>
      )}
      <div
        className={[
          'w-full rounded-pill overflow-hidden bg-bg-dark',
          size === 'sm' ? 'h-1.5' : 'h-2.5',
        ].join(' ')}
      >
        <div
          className="h-full rounded-pill transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  )
}
