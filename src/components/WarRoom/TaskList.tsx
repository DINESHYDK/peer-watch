import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { TaskItem } from './TaskItem'
import { AddTaskForm } from './AddTaskForm'
import type { TaskRow } from '@/types/database.types'

interface TaskListProps {
  tasks: TaskRow[]
  userId: string
  isLoading: boolean
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, userId, isLoading }) => {
  const [showAddForm, setShowAddForm] = useState(false)

  const completed = tasks.filter((t) => t.status).length
  const total = tasks.length
  const pct = total > 0 ? (completed / total) * 100 : 0

  return (
    <Card className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-text-heading text-base">⚔️ Daily Missions</h2>
          <p className="text-xs text-text-muted mt-0.5">
            {completed}/{total} completed
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddForm((v) => !v)}
          id="add-task-toggle"
        >
          {showAddForm ? '✕ Close' : '+ Add Mission'}
        </Button>
      </div>

      {/* Progress */}
      {total > 0 && (
        <ProgressBar value={pct} completed={completed} total={total} showLabel />
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="border-2 border-accent-violet/20 rounded-card-sm p-4 bg-accent-violet-dim/30 animate-slide-down">
          <AddTaskForm
            userId={userId}
            onClose={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-bg rounded-card-sm animate-pulse-soft" />
          ))}
        </div>
      ) : total === 0 && !showAddForm ? (
        <div className="text-center py-10">
          <p className="text-5xl mb-3">🎯</p>
          <p className="text-sm font-bold text-text-heading">No missions set yet</p>
          <p className="text-xs text-text-muted mt-1">
            Add tasks or drag on the calendar to create blocks
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </Card>
  )
}
