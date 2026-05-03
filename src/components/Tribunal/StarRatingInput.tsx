import React, { useState } from 'react'
import { StarRating } from '@/components/ui/StarRating'
import { Button } from '@/components/ui/Button'
import { useSubmitRating } from '@/hooks/usePeerRating'
import { CheckCircle2 } from 'lucide-react'

interface StarRatingInputProps {
  raterId: string; rateeId: string; groupId: string
  date: string; existingRating?: number | null; onSuccess?: () => void
}

const RATING_LABELS = ['', 'Needs serious work', 'Below expectations', 'Decent effort', 'Solid grind!', 'Absolute titan!']

export const StarRatingInput: React.FC<StarRatingInputProps> = ({
  raterId, rateeId, groupId, date, existingRating, onSuccess,
}) => {
  const [rating, setRating] = useState(existingRating ?? 0)
  const [comment, setComment] = useState('')
  const submitRating = useSubmitRating()
  const alreadyRated = !!existingRating

  const handleSubmit = async () => {
    if (rating === 0) return
    await submitRating.mutateAsync({ rater_id: raterId, ratee_id: rateeId, group_id: groupId, date, rating, comment: comment.trim() || undefined })
    onSuccess?.()
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <p className="text-sm font-semibold text-text-body">
          {alreadyRated ? 'Update your rating' : 'How did they do today?'}
        </p>
        <StarRating value={rating} onChange={setRating} size="lg" />
        {rating > 0 && (
          <p className="text-xs text-text-muted animate-fade-in">{RATING_LABELS[rating]}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">
          Peer pressure / encouragement (optional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="You crushed it today! / Come on, pick it up..."
          rows={3}
          className="w-full rounded-card-sm border-2 border-bg-dark bg-bg px-4 py-2.5 text-sm text-text-heading placeholder:text-text-muted resize-none focus:outline-none focus:border-accent-violet transition-colors"
          id="tribunal-comment"
        />
      </div>

      <Button variant="primary" fullWidth onClick={handleSubmit} loading={submitRating.isPending} disabled={rating === 0} id="tribunal-submit">
        {alreadyRated ? 'Update Rating' : 'Submit Verdict'}
      </Button>

      {submitRating.isSuccess && (
        <div className="flex items-center justify-center gap-2 animate-fade-in">
          <CheckCircle2 size={14} className="text-status-consistent" />
          <p className="text-xs text-status-consistent font-semibold">Verdict submitted!</p>
        </div>
      )}
    </div>
  )
}
