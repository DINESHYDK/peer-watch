import React from 'react'
import { computeDailyScore } from '@/lib/scoring'
import { StarRating } from '@/components/ui/StarRating'
import type { MemberWithTasks, DailySummaryRow } from '@/types/database.types'

interface ScoreSummaryProps {
  member: MemberWithTasks
  summary: DailySummaryRow | null
}

export const ScoreSummary: React.FC<ScoreSummaryProps> = ({ member, summary }) => {
  const { completionPct, hardnessScore, avgRating, dailyScore } = computeDailyScore(
    member.tasks,
    summary?.peer_rating_sum ?? 0,
    summary?.peer_rating_count ?? 0
  )

  const stats = [
    {
      label: 'Completion',
      value: `${Math.round(completionPct)}%`,
      color: completionPct >= 70 ? '#059669' : completionPct >= 50 ? '#D97706' : '#DC2626',
    },
    {
      label: 'Base Score',
      value: Math.round(hardnessScore).toLocaleString(),
      color: '#5B21B6',
    },
    {
      label: 'Avg Rating',
      value: summary?.peer_rating_count
        ? `${(summary.peer_rating_sum / summary.peer_rating_count).toFixed(1)} ⭐`
        : 'N/A',
      color: '#D97706',
    },
    {
      label: 'Daily Score',
      value: Math.round(dailyScore).toLocaleString(),
      color: '#5B21B6',
    },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-bg rounded-card-sm p-3 text-center"
          >
            <p className="text-lg font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-xs text-text-muted font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Completed tasks */}
      {member.tasks.length > 0 && (
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
            Today's Missions
          </p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {member.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2.5 py-1 px-2 rounded-lg"
              >
                <span className={task.status ? 'text-status-consistent' : 'text-text-light'}>
                  {task.status ? '✅' : '⬜'}
                </span>
                <span
                  className={[
                    'text-xs flex-1 truncate',
                    task.status ? 'text-text-body' : 'text-text-muted line-through',
                  ].join(' ')}
                >
                  {task.title}
                </span>
                <span className="text-xs font-bold" style={{ color: '#5B21B6' }}>
                  ×{task.hardness_level}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Peer rating summary */}
      {summary && summary.peer_rating_count > 0 && (
        <div className="flex items-center justify-between bg-accent-yellow/20 rounded-card-sm px-3 py-2">
          <span className="text-xs font-semibold text-text-muted">
            {summary.peer_rating_count} peer rating{summary.peer_rating_count !== 1 ? 's' : ''}
          </span>
          <StarRating
            value={Math.round(summary.peer_rating_sum / summary.peer_rating_count)}
            readOnly
            size="sm"
          />
        </div>
      )}
    </div>
  )
}
