import React from 'react'
import { X, Star, UserPlus, Bell, Trophy, Info } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import type { NotificationRow } from '@/types/database.types'

interface NotificationCenterProps {
  onClose: () => void
  userId: string | undefined
}

// Map notification type to icon and color
function getNotificationStyles(type: string) {
  switch (type) {
    case 'rating': return { Icon: Star, color: '#D97706' }
    case 'leaderboard': return { Icon: Trophy, color: '#5B21B6' }
    case 'group': return { Icon: UserPlus, color: '#059669' }
    case 'system': return { Icon: Bell, color: '#8B8BA3' }
    default: return { Icon: Info, color: '#8B8BA3' }
  }
}

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose, userId }) => {
  const { data: notifications = [], isLoading, markAsRead } = useNotifications(userId)

  return (
    <>
      {/* Click-outside backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-full mt-2 w-80 bg-card rounded-card-sm shadow-float-lg z-50 animate-slide-down overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-bg-dark">
          <h3 className="text-sm font-bold text-text-heading">Notifications</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-heading transition-colors p-1 rounded-full hover:bg-bg" aria-label="Close notifications">
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* List */}
        <ul className="max-h-72 overflow-y-auto divide-y divide-bg-dark">
          {isLoading ? (
            <li className="px-5 py-6 text-center text-text-muted text-sm">Loading...</li>
          ) : notifications.length === 0 ? (
            <li className="px-5 py-6 text-center text-text-muted text-sm">No new notifications.</li>
          ) : (
            notifications.map((n: NotificationRow) => {
              const { Icon, color } = getNotificationStyles(n.type)
              return (
                <li key={n.id} className={['flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-bg cursor-default', !n.is_read && 'bg-accent-violet-dim/30'].join(' ')}>
                  <div className="mt-0.5 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
                    <Icon size={13} strokeWidth={2} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-body leading-snug">{n.content}</p>
                    <p className="text-xs text-text-muted mt-1">{formatTimeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && <div className="w-2 h-2 rounded-full bg-accent-violet mt-1.5 flex-shrink-0" />}
                </li>
              )
            })
          )}
        </ul>

        {/* Footer */}
        {notifications.some((n: NotificationRow) => !n.is_read) && (
          <div className="px-5 py-2.5 border-t border-bg-dark text-center">
            <button onClick={() => markAsRead.mutate(undefined)} disabled={markAsRead.isPending} className="text-xs text-accent-violet font-semibold hover:underline">
              {markAsRead.isPending ? 'Marking...' : 'Mark all as read'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
