import React from 'react'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { useLeaderboard } from '@/hooks/useDailySummary'
import type { MemberWithTasks } from '@/types/database.types'

interface LeaderboardPanelProps {
  groupId: string
  members: MemberWithTasks[]
  date: string
}

const RANK_STYLES = [
  { bg: '#FFE566', text: '#92400E', label: '🥇' },
  { bg: '#E5E7EB', text: '#374151', label: '🥈' },
  { bg: '#FFEDD5', text: '#92400E', label: '🥉' },
]

export const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({
  groupId,
  members,
  date,
}) => {
  const { data: summaries } = useLeaderboard(groupId, date)

  // Merge summaries with member data
  const ranked = (summaries ?? [])
    .map((s) => ({
      ...s,
      member: members.find((m) => m.id === s.user_id),
    }))
    .filter((r) => r.member)

  return (
    <Card padding="md">
      <h2 className="font-bold text-text-heading text-base mb-4">🏆 Today's Leaderboard</h2>

      {ranked.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-4xl mb-2">🌙</p>
          <p className="text-sm text-text-muted">Scores reset at 1:00 AM</p>
          <p className="text-xs text-text-muted mt-1">Complete tasks to earn points!</p>
        </div>
      ) : (
        <ol className="space-y-2">
          {ranked.map((entry, index) => {
            const rankStyle = RANK_STYLES[index]
            return (
              <li
                key={entry.user_id}
                className="flex items-center gap-3 p-2.5 rounded-card-sm transition-all duration-200 hover:bg-bg animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Rank badge */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={rankStyle ? { backgroundColor: rankStyle.bg, color: rankStyle.text } : { backgroundColor: '#EDE9FE', color: '#5B21B6' }}
                >
                  {rankStyle ? rankStyle.label : `#${index + 1}`}
                </div>

                {/* Avatar + Name */}
                <Avatar
                  src={entry.member!.avatar_url}
                  name={entry.member!.name}
                  size="xs"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-heading truncate">
                    {entry.member!.nickname}
                  </p>
                  <p className="text-xs text-text-muted">
                    {Math.round(entry.completion_percentage)}% complete
                  </p>
                </div>

                {/* Score */}
                <span className="text-sm font-bold text-accent-violet">
                  {Math.round(entry.daily_score).toLocaleString()}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </Card>
  )
}
