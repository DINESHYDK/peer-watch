import React from 'react'
import { HardnessBadge } from '@/components/ui/Badge'
import { useToggleTask, useDeleteTask } from '@/hooks/useTasks'
import type { TaskRow } from '@/types/database.types'

interface TaskItemProps {
  task: TaskRow
}

export const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const toggleTask = useToggleTask()
  const deleteTask = useDeleteTask()

  const handleToggle = () => {
    toggleTask.mutate({
      id: task.id,
      status: !task.status,
      userId: task.user_id,
      date: task.date,
    })
  }

  const handleDelete = () => {
    deleteTask.mutate({ id: task.id, userId: task.user_id, date: task.date })
  }

  const hasTime = task.start_time && task.end_time

  return (
    <div
      className={[
        'flex items-center gap-3 p-3.5 rounded-card-sm border-2 transition-all duration-200 group',
        task.status
          ? 'border-status-consistent/30 bg-green-50/50'
          : 'border-bg-dark bg-bg hover:border-accent-violet/40',
      ].join(' ')}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        disabled={toggleTask.isPending}
        className={[
          'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200',
          task.status
            ? 'bg-status-consistent border-status-consistent'
            : 'border-text-light hover:border-accent-violet',
        ].join(' ')}
        aria-label={task.status ? 'Mark incomplete' : 'Mark complete'}
        id={`task-toggle-${task.id}`}
      >
        {task.status && (
          <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none">
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <p
          className={[
            'text-sm font-semibold truncate transition-all duration-200',
            task.status ? 'line-through text-text-muted' : 'text-text-heading',
          ].join(' ')}
        >
          {task.title}
        </p>
        {hasTime && (
          <p className="text-xs text-text-muted mt-0.5">
            🕐 {task.start_time} – {task.end_time}
          </p>
        )}
      </div>

      {/* Hardness badge */}
      <HardnessBadge level={task.hardness_level} />

      {/* Delete button (visible on hover) */}
      <button
        onClick={handleDelete}
        disabled={deleteTask.isPending}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all duration-150 p-1 rounded-full hover:bg-red-50"
        aria-label="Delete task"
        id={`task-delete-${task.id}`}
      >
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor">
          <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 1.16l.337 9.14A1.5 1.5 0 0 0 4.33 14.5h7.34a1.5 1.5 0 0 0 1.497-1.7l.337-9.14a.58.58 0 0 0-.01-1.16H11Z"/>
        </svg>
      </button>
    </div>
  )
}
