import React from 'react'
import { Trophy, Moon } from 'lucide-react'
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
  { bg: '#FFE566', text: '#92400E', label: '1' },
  { bg: '#E5E7EB', text: '#374151', label: '2' },
  { bg: '#FFEDD5', text: '#92400E', label: '3' },
]

export const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({ groupId, members, date }) => {
  const { data: summaries } = useLeaderboard(groupId, date)
  const ranked = (summaries ?? [])
    .map((s) => ({ ...s, member: members.find((m) => m.id === s.user_id) }))
    .filter((r) => r.member)

  return (
    <Card padding="md">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={16} strokeWidth={2} className="text-accent-violet" />
        <h2 className="font-bold text-text-heading text-base">Today's Leaderboard</h2>
      </div>

      {ranked.length === 0 ? (
        <div className="text-center py-8">
          <Moon size={32} strokeWidth={1.5} className="mx-auto text-text-light mb-2" />
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
                className="flex items-center gap-3 p-2.5 rounded-card-sm hover:bg-bg transition-all duration-200 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={rankStyle ? { backgroundColor: rankStyle.bg, color: rankStyle.text } : { backgroundColor: '#EDE9FE', color: '#5B21B6' }}
                >
                  {rankStyle ? rankStyle.label : `${index + 1}`}
                </div>
                <Avatar src={entry.member!.avatar_url} name={entry.member!.name} size="xs" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-heading truncate">{entry.member!.nickname}</p>
                  <p className="text-xs text-text-muted">{Math.round(entry.completion_percentage)}% complete</p>
                </div>
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
