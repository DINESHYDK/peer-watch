import React from 'react'
import { useAppStore } from '@/store/useAppStore'
import { CommandCenter } from '@/components/CommandCenter/CommandCenter'
import { TribunalModal } from '@/components/Tribunal/TribunalModal'
import { useGroupMembers } from '@/hooks/useGroupMembers'
import type { UserRow } from '@/types/database.types'

interface DashboardPageProps {
  user: UserRow
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user }) => {
  const { activeGroupId } = useAppStore()
  const { data: members = [], isLoading } = useGroupMembers(activeGroupId, user.id)

  if (!activeGroupId) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-center">
        <p className="text-7xl mb-4">👈</p>
        <h2 className="font-bold text-text-heading text-xl">Select a group</h2>
        <p className="text-text-muted text-sm mt-2">
          Pick one from the sidebar to enter the Command Center.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-64 bg-card rounded-card animate-pulse-soft shadow-card"
          />
        ))}
      </div>
    )
  }

  return (
    <>
      <CommandCenter
        members={members}
        currentUserId={user.id}
        groupId={activeGroupId}
      />
      <TribunalModal
        members={members}
        currentUser={user}
        groupId={activeGroupId}
      />
    </>
  )
}
