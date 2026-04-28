import React from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import type { UserRow } from '@/types/database.types'
import type { StatusTag } from '@/lib/scoring'

interface TopBarProps {
  user: UserRow
}

export const TopBar: React.FC<TopBarProps> = ({ user }) => {
  const { activeGroupId } = useAppStore()

  const handleSignOut = () => supabase.auth.signOut()

  return (
    <header className="flex items-center justify-between px-6 lg:px-8 py-4 bg-card/70 backdrop-blur-sm border-b border-white/60 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-sm font-bold text-text-heading">
            {activeGroupId ? 'Command Center' : 'Select a group'}
          </h2>
          <p className="text-xs text-text-muted">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Status tag */}
        <StatusBadge tag={(user.status_tag as StatusTag) ?? 'New'} />

        {/* Score */}
        <div className="hidden sm:flex items-center gap-1.5 bg-accent-violet-dim rounded-pill px-3 py-1.5">
          <span className="text-xs text-accent-violet font-bold">⚡ {Math.round(user.global_score).toLocaleString()}</span>
        </div>

        {/* Avatar + sign out */}
        <div className="relative group">
          <Avatar src={user.avatar_url} name={user.name} size="sm" />
          <div className="absolute right-0 top-full mt-2 w-40 bg-card rounded-card-sm shadow-float-lg py-2 hidden group-hover:block z-50 animate-slide-down">
            <p className="px-4 py-1.5 text-xs font-bold text-text-heading truncate">{user.name}</p>
            <hr className="border-bg-dark mx-2 my-1" />
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2 text-xs text-red-500 font-semibold hover:bg-red-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
