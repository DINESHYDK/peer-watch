import React from 'react'
import { Flame } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store/useAppStore'
import type { MemberWithTasks } from '@/types/database.types'
import type { StatusTag } from '@/lib/scoring'

interface FriendCardProps {
  member: MemberWithTasks
  isCurrentUser?: boolean
}

const STREAK_DAYS = 21

export const FriendCard: React.FC<FriendCardProps> = ({ member, isCurrentUser }) => {
  const { openTribunal } = useAppStore()
  const totalTasks = member.tasks.length
  const completedTasks = member.tasks.filter((t) => t.status).length
  const completionPct =
    member.todaySummary?.completion_percentage ??
    (totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0)

  const today = new Date().toISOString().split('T')[0]
  const alreadyRated = member.myRating !== null
  const streakCount = member.current_streak
  const streakDays = Array.from({ length: STREAK_DAYS }, (_, i) => i < Math.min(streakCount, STREAK_DAYS)).reverse()

  return (
    <Card hover={!isCurrentUser} className="flex flex-col gap-4 relative overflow-hidden animate-fade-in">
      {isCurrentUser && (
        <div className="absolute top-4 right-4">
          <span className="text-xs font-bold text-accent-violet bg-accent-violet-dim px-2.5 py-0.5 rounded-pill">You</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar src={member.avatar_url} name={member.name} size="lg" />
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="font-bold text-text-heading text-base leading-tight truncate">{member.name}</h3>
          <p className="text-xs text-text-muted font-medium">@{member.nickname}</p>
          <div className="mt-2">
            <StatusBadge tag={(member.status_tag as StatusTag) ?? 'New'} />
          </div>
        </div>
      </div>

      {/* 21-day streak */}
      <div>
        <p className="text-xs font-semibold text-text-muted mb-2">21-Day Streak</p>
        <div className="flex flex-wrap gap-0.5">
          {streakDays.map((lit, i) => (
            <Flame
              key={i}
              size={13}
              strokeWidth={1.5}
              className={lit ? 'text-orange-500 animate-flame' : 'text-text-light opacity-30'}
            />
          ))}
        </div>
        <div className="flex items-center gap-1 mt-1">
          <Flame size={12} strokeWidth={2} className="text-orange-500" />
          <p className="text-xs font-bold text-accent-violet">
            {member.current_streak} day{member.current_streak !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div>
        <ProgressBar value={completionPct} completed={completedTasks} total={totalTasks} showLabel />
        {totalTasks === 0 && <p className="text-xs text-text-muted mt-1">No tasks logged today</p>}
      </div>

      {/* Score chip */}
      {member.todaySummary && (
        <div className="flex items-center gap-2 bg-bg rounded-pill px-3 py-1.5 w-fit">
          <span className="text-xs text-text-muted font-medium">Today</span>
          <span className="text-xs font-bold text-accent-violet">
            {Math.round(member.todaySummary.daily_score).toLocaleString()} pts
          </span>
        </div>
      )}

      {!isCurrentUser && (
        <Button
          variant={alreadyRated ? 'secondary' : 'primary'}
          size="sm" fullWidth
          onClick={() => openTribunal(member.id, today)}
          id={`tribunal-btn-${member.id}`}
        >
          {alreadyRated ? 'Reviewed' : 'Open Tribunal'}
        </Button>
      )}
    </Card>
  )
}
