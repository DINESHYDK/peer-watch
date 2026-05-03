// ── Peer-Watch Scoring Engine ───────────────────────────────
// Mirrors the server-side logic in the Edge Function
// Used client-side for live score preview in the Tribunal modal

export interface TaskScoreInput {
  hardness_level: number
  status: boolean
}

/**
 * Compute daily score for a user given their tasks and peer rating.
 *
 * Formula:
 *   daily_score = (Σ completed_hardness * 10)
 *               * (completion_pct / 100)
 *               * avg_peer_rating  [defaults to 1.0 if no ratings]
 */
export function computeDailyScore(
  tasks: TaskScoreInput[],
  peerRatingSum: number,
  peerRatingCount: number
): {
  hardnessScore: number
  completionPct: number
  avgRating: number
  dailyScore: number
} {
  const total = tasks.length
  const completed = tasks.filter((t) => t.status)
  const completionPct = total > 0 ? (completed.length / total) * 100 : 0

  const hardnessScore = completed.reduce((acc, t) => acc + t.hardness_level * 10, 0)
  const avgRating = peerRatingCount > 0 ? peerRatingSum / peerRatingCount : 1

  const dailyScore = hardnessScore * (completionPct / 100) * avgRating

  return { hardnessScore, completionPct, avgRating, dailyScore }
}

/**
 * Compute status tag from recent completion history.
 */
export type StatusTag =
  | 'The Titan'
  | 'Grindmaster'
  | 'Consistent'
  | 'Slipping'
  | 'The Culprit'
  | 'Sloth'
  | 'On Track'
  | 'New'

export function computeStatusTag(
  recentCompletions: number[] // [today, yesterday, 2daysAgo] — all 0–100
): StatusTag {
  const [today, yesterday, twoDaysAgo] = recentCompletions

  if (today === undefined || today === 0) return 'The Culprit'
  if (today < 50 && yesterday !== undefined && yesterday < 50) return 'Slipping'
  if (
    today >= 90 &&
    yesterday !== undefined && yesterday >= 90 &&
    twoDaysAgo !== undefined && twoDaysAgo >= 90
  ) {
    return Math.random() > 0.5 ? 'The Titan' : 'Grindmaster'
  }
  if (today >= 70) return 'Consistent'
  return 'On Track'
}

export const STATUS_TAG_META: Record<
  StatusTag,
  { label: string; color: string; bg: string }
> = {
  'The Titan':    { label: 'The Titan',    color: '#5B21B6', bg: '#EDE9FE' },
  'Grindmaster':  { label: 'Grindmaster',  color: '#5B21B6', bg: '#EDE9FE' },
  'Consistent':   { label: 'Consistent',   color: '#059669', bg: '#D1FAE5' },
  'Slipping':     { label: 'Slipping',     color: '#D97706', bg: '#FEF3C7' },
  'The Culprit':  { label: 'The Culprit',  color: '#DC2626', bg: '#FEE2E2' },
  'Sloth':        { label: 'Sloth',        color: '#DC2626', bg: '#FEE2E2' },
  'On Track':     { label: 'On Track',     color: '#2563EB', bg: '#DBEAFE' },
  'New':          { label: 'New',          color: '#6B7280', bg: '#F3F4F6' },
}

/**
 * Map hardness level (1–10) to a colour for calendar events.
 */
export function hardnessColor(level: number): string {
  if (level <= 3) return '#34D399'   // green — easy
  if (level <= 6) return '#FBBF24'   // amber — medium
  if (level <= 8) return '#F97316'   // orange — hard
  return '#EF4444'                    // red — extreme
}
