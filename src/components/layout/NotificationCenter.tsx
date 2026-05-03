import React from 'react'
import { X, Star, UserPlus, Bell, Trophy } from 'lucide-react'

interface Notification {
  id: number
  icon: React.ElementType
  iconColor: string
  text: string
  time: string
  read: boolean
}

const NOTIFICATIONS: Notification[] = [
  {
    id: 1, icon: Star, iconColor: '#D97706',
    text: 'Alex rated your day 5 stars — "Absolute titan!"',
    time: '2 min ago', read: false,
  },
  {
    id: 2, icon: Trophy, iconColor: '#5B21B6',
    text: 'Jordan completed all missions today. Leaderboard updated.',
    time: '1 hr ago', read: false,
  },
  {
    id: 3, icon: UserPlus, iconColor: '#059669',
    text: 'Sam joined The Grind Collective.',
    time: '3 hrs ago', read: true,
  },
  {
    id: 4, icon: Bell, iconColor: '#8B8BA3',
    text: "Don't forget to log today's missions before 1:00 AM.",
    time: 'Yesterday', read: true,
  },
]

interface NotificationCenterProps {
  onClose: () => void
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => (
  <>
    {/* Click-outside backdrop */}
    <div className="fixed inset-0 z-40" onClick={onClose} />

    {/* Panel */}
    <div
      className="absolute right-0 top-full mt-2 w-80 bg-card rounded-card-sm shadow-float-lg z-50 animate-slide-down overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-bg-dark">
        <h3 className="text-sm font-bold text-text-heading">Notifications</h3>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text-heading transition-colors p-1 rounded-full hover:bg-bg"
          aria-label="Close notifications"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* List */}
      <ul className="max-h-72 overflow-y-auto divide-y divide-bg-dark">
        {NOTIFICATIONS.map((n) => {
          const Icon = n.icon
          return (
            <li
              key={n.id}
              className={[
                'flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-bg cursor-default',
                !n.read && 'bg-accent-violet-dim/30',
              ].join(' ')}
            >
              <div
                className="mt-0.5 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${n.iconColor}18` }}
              >
                <Icon size={13} strokeWidth={2} style={{ color: n.iconColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-body leading-snug">
                  {n.text}
                </p>
                <p className="text-xs text-text-muted mt-1">{n.time}</p>
              </div>
              {!n.read && (
                <div className="w-2 h-2 rounded-full bg-accent-violet mt-1.5 flex-shrink-0" />
              )}
            </li>
          )
        })}
      </ul>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-bg-dark text-center">
        <button className="text-xs text-accent-violet font-semibold hover:underline">
          Mark all as read
        </button>
      </div>
    </div>
  </>
)
