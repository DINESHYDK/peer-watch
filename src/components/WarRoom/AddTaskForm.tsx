import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAddTask } from '@/hooks/useTasks'

// ── Reusable custom time dropdowns ────────────────────────────
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']

const selectCls =
  'rounded-lg border-2 border-bg-dark bg-bg px-2 py-1.5 text-sm font-semibold ' +
  'text-text-heading focus:outline-none focus:border-accent-violet transition-colors cursor-pointer'

interface TimeDropdownProps {
  value: string       // 'HH:MM'
  onChange: (v: string) => void
  id: string
  disabled?: boolean
}

const TimeDropdown: React.FC<TimeDropdownProps> = ({ value, onChange, id, disabled }) => {
  const [h, m] = value ? value.split(':') : ['09', '00']
  return (
    <div className="flex items-center gap-1">
      <select
        id={`${id}-h`}
        value={h}
        disabled={disabled}
        onChange={(e) => onChange(`${e.target.value}:${m}`)}
        className={selectCls}
        aria-label="Hour"
      >
        {HOURS.map((v) => <option key={v}>{v}</option>)}
      </select>
      <span className="font-bold text-text-muted text-sm select-none">:</span>
      <select
        id={`${id}-m`}
        value={m}
        disabled={disabled}
        onChange={(e) => onChange(`${h}:${e.target.value}`)}
        className={selectCls}
        aria-label="Minute"
      >
        {MINUTES.map((v) => <option key={v}>{v}</option>)}
      </select>
    </div>
  )
}

interface AddTaskFormProps {
  userId: string
  prefillStart?: string
  prefillEnd?: string
  prefillDate?: string
  onClose?: () => void
  compact?: boolean
}

export const AddTaskForm: React.FC<AddTaskFormProps> = ({
  userId, prefillStart, prefillEnd, prefillDate, onClose, compact = false,
}) => {
  const [title, setTitle] = useState('')
  const [hardness, setHardness] = useState(5)
  const [start, setStart] = useState(prefillStart ?? '09:00')
  const [end, setEnd] = useState(prefillEnd ?? '10:00')
  const [timed, setTimed] = useState(!!(prefillStart && prefillEnd))

  const addTask = useAddTask()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await addTask.mutateAsync({
      user_id: userId,
      title: title.trim(),
      hardness_level: hardness,
      start_time: timed ? start : null,
      end_time: timed ? end : null,
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
          type="range" min={1} max={10} value={hardness}
          onChange={(e) => setHardness(Number(e.target.value))}
          className="w-full accent-accent-violet cursor-pointer h-2 rounded-pill"
          id="add-task-hardness"
        />
        <div className="flex justify-between text-xs text-text-muted mt-1 px-0.5">
          <span>Easy</span><span>Extreme</span>
        </div>
      </div>

      {/* Time toggle */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={timed}
            onChange={(e) => setTimed(e.target.checked)}
            className="accent-accent-violet w-4 h-4 rounded cursor-pointer"
            id="add-task-timed"
          />
          <span className="text-xs font-semibold text-text-muted">Schedule a time slot</span>
        </label>
      </div>

      {/* Time selects — custom dropdowns, no native time input */}
      {timed && (
        <div className="flex items-center gap-4 bg-bg rounded-card-sm p-3">
          <div>
            <p className="text-xs font-semibold text-text-muted mb-1.5">Start</p>
            <TimeDropdown value={start} onChange={setStart} id="add-task-start" />
          </div>
          <span className="text-text-muted font-bold mt-5">–</span>
          <div>
            <p className="text-xs font-semibold text-text-muted mb-1.5">End</p>
            <TimeDropdown value={end} onChange={setEnd} id="add-task-end" />
          </div>
        </div>
      )}

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
          icon={<Plus size={14} />}
          fullWidth
          id="add-task-submit"
        >
          Add Mission
        </Button>
      </div>
    </form>
  )
}
