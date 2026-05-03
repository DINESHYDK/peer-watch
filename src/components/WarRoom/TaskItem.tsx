import React from 'react'
import { CheckCircle2, Circle, Trash2 } from 'lucide-react'
import { HardnessBadge } from '@/components/ui/Badge'
import { useToggleTask, useDeleteTask } from '@/hooks/useTasks'
import type { TaskRow } from '@/types/database.types'

interface TaskItemProps { task: TaskRow }

export const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const toggleTask = useToggleTask()
  const deleteTask = useDeleteTask()

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
        onClick={() => toggleTask.mutate({ id: task.id, status: !task.status, userId: task.user_id, date: task.date })}
        disabled={toggleTask.isPending}
        className="flex-shrink-0 transition-all duration-200 hover:scale-110"
        aria-label={task.status ? 'Mark incomplete' : 'Mark complete'}
        id={`task-toggle-${task.id}`}
      >
        {task.status
          ? <CheckCircle2 size={20} strokeWidth={2} className="text-status-consistent" />
          : <Circle size={20} strokeWidth={2} className="text-text-light hover:text-accent-violet" />
        }
      </button>

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <p className={['text-sm font-semibold truncate transition-all duration-200',
          task.status ? 'line-through text-text-muted' : 'text-text-heading',
        ].join(' ')}>
          {task.title}
        </p>
        {task.start_time && task.end_time && (
          <p className="text-xs text-text-muted mt-0.5">
            {task.start_time} – {task.end_time}
          </p>
        )}
      </div>

      <HardnessBadge level={task.hardness_level} />

      {/* Delete */}
      <button
        onClick={() => deleteTask.mutate({ id: task.id, userId: task.user_id, date: task.date })}
        disabled={deleteTask.isPending}
        className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-500 transition-all p-1.5 rounded-full hover:bg-red-50"
        aria-label="Delete task"
        id={`task-delete-${task.id}`}
      >
        <Trash2 size={13} strokeWidth={2} />
      </button>
    </div>
  )
}
