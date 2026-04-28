import React, { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import { ScoreSummary } from './ScoreSummary'
import { StarRatingInput } from './StarRatingInput'
import { useDailySummary } from '@/hooks/useDailySummary'
import type { MemberWithTasks, UserRow } from '@/types/database.types'
import type { StatusTag } from '@/lib/scoring'

interface TribunalModalProps {
  members: MemberWithTasks[]
  currentUser: UserRow
  groupId: string
}

export const TribunalModal: React.FC<TribunalModalProps> = ({
  members,
  currentUser,
  groupId,
}) => {
  const { tribunalTarget, closeTribunal } = useAppStore()

  // Keyboard dismiss
  useEffect(() => {
    if (!tribunalTarget) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeTribunal() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [tribunalTarget, closeTribunal])

  if (!tribunalTarget) return null

  const target = members.find((m) => m.id === tribunalTarget.userId)
  if (!target) return null

  return <TribunalContent
    target={target}
    currentUser={currentUser}
    groupId={groupId}
    date={tribunalTarget.date}
    onClose={closeTribunal}
  />
}

interface TribunalContentProps {
  target: MemberWithTasks
  currentUser: UserRow
  groupId: string
  date: string
  onClose: () => void
}

const TribunalContent: React.FC<TribunalContentProps> = ({
  target,
  currentUser,
  groupId,
  date,
  onClose,
}) => {
  const { data: summary } = useDailySummary(target.id, groupId, date)
  const existingRating = target.myRating?.rating ?? null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 modal-backdrop bg-text-heading/30 flex items-center justify-center p-4 animate-fade-in"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="relative w-full max-w-md bg-card rounded-card shadow-float-lg overflow-hidden animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-violet-gradient px-6 pt-6 pb-8">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors text-xl leading-none"
              aria-label="Close tribunal"
            >
              ✕
            </button>
            <div className="flex items-center gap-4">
              <Avatar src={target.avatar_url} name={target.name} size="lg" />
              <div>
                <h2 className="text-xl font-bold text-white">{target.name}</h2>
                <p className="text-white/70 text-sm">@{target.nickname}</p>
                <div className="mt-2">
                  <StatusBadge tag={(target.status_tag as StatusTag) ?? 'New'} />
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Score summary */}
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
                Today's Performance
              </p>
              <ScoreSummary member={target} summary={summary ?? null} />
            </div>

            <hr className="border-bg-dark" />

            {/* Rating */}
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
                Your Verdict
              </p>
              <StarRatingInput
                raterId={currentUser.id}
                rateeId={target.id}
                groupId={groupId}
                date={date}
                existingRating={existingRating}
                onSuccess={onClose}
              />
            </div>
          </div>

          {/* Footer streak badge */}
          <div className="px-6 py-3 bg-bg border-t border-bg-dark flex items-center justify-between">
            <span className="text-xs text-text-muted font-medium">
              🔥 {target.current_streak} day streak
            </span>
            <span className="text-xs font-bold text-accent-violet">
              ⚡ {Math.round(target.global_score).toLocaleString()} global pts
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
