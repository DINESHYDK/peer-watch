import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useAddTask } from '@/hooks/useTasks'

interface AddTaskFormProps {
  userId: string
  prefillStart?: string  // HH:MM
  prefillEnd?: string    // HH:MM
  prefillDate?: string
  onClose?: () => void
  compact?: boolean
}

export const AddTaskForm: React.FC<AddTaskFormProps> = ({
  userId,
  prefillStart,
  prefillEnd,
  prefillDate,
  onClose,
  compact = false,
}) => {
  const [title, setTitle] = useState('')
  const [hardness, setHardness] = useState(5)
  const [start, setStart] = useState(prefillStart ?? '')
  const [end, setEnd] = useState(prefillEnd ?? '')

  const addTask = useAddTask()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await addTask.mutateAsync({
      user_id: userId,
      title: title.trim(),
      hardness_level: hardness,
      start_time: start || null,
      end_time: end || null,
      date: prefillDate,
    })
    setTitle('')
    setHardness(5)
    onClose?.()
  }

  const hardnessColor =
    hardness <= 3 ? '#059669' :
    hardness <= 6 ? '#D97706' :
    hardness <= 8 ? '#EA580C' :
    '#DC2626'

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-3' : 'space-y-4'}>
      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-text-heading mb-1.5">
          Mission Title
        </label>
        <input
          autoFocus
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Finish Chapter 5, Gym session..."
          className="w-full rounded-card-sm border-2 border-bg-dark bg-bg px-4 py-2.5 text-sm font-medium text-text-heading placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors"
          id="add-task-title"
        />
      </div>

      {/* Hardness slider */}
      <div>
        <label className="flex items-center justify-between text-xs font-semibold text-text-heading mb-2">
          <span>Hardness Level</span>
          <span
            className="text-sm font-bold tabular-nums px-2.5 py-0.5 rounded-pill"
            style={{ color: hardnessColor, backgroundColor: `${hardnessColor}18` }}
          >
            {hardness}/10
          </span>
        </label>
        <input
          type="range"
          min={1}
          max={10}
          value={hardness}
          onChange={(e) => setHardness(Number(e.target.value))}
          className="w-full accent-accent-violet cursor-pointer h-2 rounded-pill"
          id="add-task-hardness"
        />
        <div className="flex justify-between text-xs text-text-muted mt-1 px-0.5">
          <span>Easy</span>
          <span>Extreme</span>
        </div>
      </div>

      {/* Time range (optional) */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-text-muted mb-1.5">
            Start Time
          </label>
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full rounded-card-sm border-2 border-bg-dark bg-bg px-3 py-2 text-sm text-text-heading focus:outline-none focus:border-accent-violet transition-colors"
            id="add-task-start"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-text-muted mb-1.5">
            End Time
          </label>
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full rounded-card-sm border-2 border-bg-dark bg-bg px-3 py-2 text-sm text-text-heading focus:outline-none focus:border-accent-violet transition-colors"
            id="add-task-end"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {onClose && (
          <Button type="button" variant="ghost" size="sm" onClick={onClose} fullWidth>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={addTask.isPending}
          disabled={!title.trim()}
          fullWidth
          id="add-task-submit"
        >
          + Add Mission
        </Button>
      </div>
    </form>
  )
}
