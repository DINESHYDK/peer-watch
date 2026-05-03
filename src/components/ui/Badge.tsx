import React from 'react'
import {
  Zap, TrendingUp, AlertTriangle, Skull, Target, Sparkles, CircleDot,
} from 'lucide-react'
import type { StatusTag } from '@/lib/scoring'
import { STATUS_TAG_META } from '@/lib/scoring'

// ── Icon map for each status tag ──────────────────────────────
const STATUS_ICONS: Record<string, React.ElementType> = {
  'The Titan':   Zap,
  'Grindmaster': Zap,
  'Consistent':  TrendingUp,
  'Slipping':    AlertTriangle,
  'The Culprit': Skull,
  'Sloth':       Skull,
  'On Track':    Target,
  'New':         CircleDot,
}

interface StatusBadgeProps {
  tag: StatusTag | string
  size?: 'sm' | 'md'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ tag, size = 'md' }) => {
  const meta = STATUS_TAG_META[tag as StatusTag] ?? {
    label: tag, color: '#6B7280', bg: '#F3F4F6',
  }
  const Icon = STATUS_ICONS[tag] ?? Sparkles

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-pill font-semibold',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs',
      ].join(' ')}
      style={{ color: meta.color, backgroundColor: meta.bg }}
    >
      <Icon size={11} strokeWidth={2.5} />
      {meta.label}
    </span>
  )
}

interface HardnessBadgeProps { level: number }

const HARDNESS_TIERS: Record<string, { bg: string; text: string }> = {
  easy:    { bg: '#D1FAE5', text: '#059669' },
  medium:  { bg: '#FEF3C7', text: '#D97706' },
  hard:    { bg: '#FFEDD5', text: '#EA580C' },
  extreme: { bg: '#FEE2E2', text: '#DC2626' },
}

function getTier(level: number) {
  if (level <= 3) return 'easy'
  if (level <= 6) return 'medium'
  if (level <= 8) return 'hard'
  return 'extreme'
}

export const HardnessBadge: React.FC<HardnessBadgeProps> = ({ level }) => {
  const { bg, text } = HARDNESS_TIERS[getTier(level)]
  return (
    <span
      className="inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-bold"
      style={{ backgroundColor: bg, color: text }}
    >
      {level}/10
    </span>
  )
}
