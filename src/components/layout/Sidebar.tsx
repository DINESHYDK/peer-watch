import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Swords, Settings, Flame, Crown,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Avatar } from '@/components/ui/Avatar'
import type { UserRow, GroupRow } from '@/types/database.types'

interface SidebarProps {
  user: UserRow
  groups: GroupRow[]
}

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Command Center', Icon: LayoutDashboard },
  { to: '/war-room',  label: 'War Room',       Icon: Swords },
  { to: '/settings',  label: 'Settings',       Icon: Settings },
]

export const Sidebar: React.FC<SidebarProps> = ({ user, groups }) => {
  const { activeGroupId, setActiveGroupId } = useAppStore()

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-card shadow-float border-r border-white/60 overflow-hidden">

      {/* Logo */}
      <div className="px-6 py-6 border-b border-bg-dark">
        <h1 className="logo-bubble text-2xl select-none">Peer-Watch</h1>
        <p className="text-xs text-text-muted mt-0.5 font-medium tracking-wide">
          Accountability · Gamified
        </p>
      </div>

      {/* Navigation — all NavLink, no <a href> */}
      <nav className="px-4 pt-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-4 py-2.5 rounded-card-sm font-semibold text-sm',
                'transition-all duration-200',
                isActive
                  ? 'bg-violet-gradient text-white shadow-float'
                  : 'text-text-muted hover:bg-accent-violet-dim hover:text-accent-violet',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={16}
                  strokeWidth={isActive ? 2.5 : 2}
                  className="flex-shrink-0"
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Group switcher */}
      <div className="px-4 pt-6 flex-1 overflow-y-auto">
        <p className="text-xs font-bold text-text-muted uppercase tracking-widest px-2 mb-3">
          Your Groups
        </p>
        <div className="space-y-1.5">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => setActiveGroupId(group.id)}
              className={[
                'w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-card-sm',
                'text-sm transition-all duration-200',
                activeGroupId === group.id
                  ? 'bg-accent-violet-dim text-accent-violet font-bold'
                  : 'text-text-body hover:bg-bg font-medium',
              ].join(' ')}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: activeGroupId === group.id ? '#5B21B6' : '#C4B5FD',
                }}
              />
              <span className="truncate flex-1">{group.name}</span>
              {group.leader_id === user.id && (
                <Crown
                  size={12}
                  strokeWidth={2}
                  className="text-accent-yellow-dark flex-shrink-0"
                />
              )}
            </button>
          ))}
        </div>

        {groups.length === 0 && (
          <p className="text-xs text-text-muted px-2 py-4 text-center">
            No groups yet. Create or join one in Settings.
          </p>
        )}
      </div>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-bg-dark">
        <div className="flex items-center gap-3">
          <Avatar src={user.avatar_url} name={user.name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text-heading truncate">{user.nickname}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Flame size={11} className="text-orange-500" strokeWidth={2.5} />
              <p className="text-xs text-text-muted">{user.current_streak} day streak</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
