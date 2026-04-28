import React from 'react'
import { FriendCard } from './FriendCard'
import { LeaderboardPanel } from './LeaderboardPanel'
import { ProductivityHub } from './ProductivityHub'
import type { MemberWithTasks } from '@/types/database.types'

interface CommandCenterProps {
  members: MemberWithTasks[]
  currentUserId: string
  groupId: string
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  members,
  currentUserId,
  groupId,
}) => {
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 h-full">
      {/* Main: friend cards + leaderboard */}
      <div className="space-y-6 min-w-0">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Command Center</h1>
          <p className="text-text-muted text-sm mt-0.5">
            {members.length} member{members.length !== 1 ? 's' : ''} in this group
          </p>
        </div>

        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-6xl mb-4">👥</p>
            <h3 className="font-bold text-text-heading text-lg">No members yet</h3>
            <p className="text-text-muted text-sm mt-2">
              Share your group invite code to get the crew in here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {members.map((member) => (
              <FriendCard
                key={member.id}
                member={member}
                isCurrentUser={member.id === currentUserId}
              />
            ))}
          </div>
        )}

        <LeaderboardPanel
          groupId={groupId}
          members={members}
          date={today}
        />
      </div>

      {/* Right column: Productivity Hub */}
      <div className="space-y-5">
        <ProductivityHub />

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-card-sm p-4 text-center shadow-card">
            <p className="text-2xl font-bold text-accent-violet">
              {members.filter((m) => (m.todaySummary?.completion_percentage ?? 0) >= 70).length}
            </p>
            <p className="text-xs text-text-muted font-medium mt-1">On Track</p>
          </div>
          <div className="bg-card rounded-card-sm p-4 text-center shadow-card">
            <p className="text-2xl font-bold text-status-culprit">
              {members.filter((m) => m.tasks.length === 0).length}
            </p>
            <p className="text-xs text-text-muted font-medium mt-1">No Tasks</p>
          </div>
        </div>
      </div>
    </div>
  )
}
