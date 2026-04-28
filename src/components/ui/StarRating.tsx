import React, { useState } from 'react'

interface StarRatingProps {
  value: number        // 0–5
  onChange?: (v: number) => void
  readOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_MAP = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
}

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  readOnly = false,
  size = 'md',
}) => {
  const [hovered, setHovered] = useState<number | null>(null)

  const display = hovered ?? value

  return (
    <div className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          className={[
            SIZE_MAP[size],
            'transition-transform duration-100',
            !readOnly && 'cursor-pointer hover:scale-125 active:scale-110',
            readOnly && 'cursor-default',
          ].join(' ')}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(null)}
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
        >
          {star <= display ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  )
}
