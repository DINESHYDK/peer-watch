import React, { useState } from 'react'
import { Bell, Zap, X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import type { UserRow } from '@/types/database.types'
import type { StatusTag } from '@/lib/scoring'
import { NotificationCenter } from './NotificationCenter'
import { useNotifications } from '@/hooks/useNotifications'

interface TopBarProps {
  user: UserRow
}

export const TopBar: React.FC<TopBarProps> = ({ user }) => {
  const { activeGroupId } = useAppStore()
  const [notifOpen, setNotifOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  
  const { data: notifications = [] } = useNotifications(user.id)
  const hasUnread = notifications.some(n => !n.is_read)

  const handleSignOut = () => supabase.auth.signOut()

  return (
    <header className="flex items-center justify-between px-6 lg:px-8 py-4 bg-card/70 backdrop-blur-sm border-b border-white/60 flex-shrink-0 relative z-30">
      {/* Left: context label */}
      <div>
        <h2 className="text-sm font-bold text-text-heading">
          {activeGroupId ? 'Command Center' : 'Select a group'}
        </h2>
        <p className="text-xs text-text-muted">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long',
          })}
        </p>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        {/* Status tag */}
        <StatusBadge tag={(user.status_tag as StatusTag) ?? 'New'} />

        {/* Score chip */}
        <div className="hidden sm:flex items-center gap-1.5 bg-accent-violet-dim rounded-pill px-3 py-1.5">
          <Zap size={12} strokeWidth={2.5} className="text-accent-violet" />
          <span className="text-xs text-accent-violet font-bold">
            {Math.round(user.global_score).toLocaleString()}
          </span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen((v) => !v); setAvatarOpen(false) }}
            className="relative p-2 rounded-full hover:bg-accent-violet-dim transition-colors"
            aria-label="Notifications"
            id="notif-bell"
          >
            <Bell size={18} strokeWidth={2} className="text-text-muted" />
            {/* Unread dot */}
            {hasUnread && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
          </button>

          {notifOpen && (
            <NotificationCenter onClose={() => setNotifOpen(false)} userId={user.id} />
          )}
        </div>

        {/* Avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => { setAvatarOpen((v) => !v); setNotifOpen(false) }}
            className="focus:outline-none"
            aria-label="User menu"
            id="user-avatar-btn"
          >
            <Avatar src={user.avatar_url} name={user.name} size="sm" />
          </button>

          {avatarOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setAvatarOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-44 bg-card rounded-card-sm shadow-float-lg py-2 z-50 animate-slide-down">
                <p className="px-4 py-1.5 text-xs font-bold text-text-heading truncate">
                  {user.name}
                </p>
                <p className="px-4 pb-1.5 text-xs text-text-muted truncate">
                  @{user.nickname}
                </p>
                <hr className="border-bg-dark mx-2 my-1" />
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-xs text-red-500 font-semibold hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
