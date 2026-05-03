import React, { useState } from 'react'
import { Plus, Swords, Target } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { TaskItem } from './TaskItem'
import { AddTaskForm } from './AddTaskForm'
import type { TaskRow } from '@/types/database.types'

interface TaskListProps { tasks: TaskRow[]; userId: string; isLoading: boolean }

export const TaskList: React.FC<TaskListProps> = ({ tasks, userId, isLoading }) => {
  const [showAdd, setShowAdd] = useState(false)
  const completed = tasks.filter((t) => t.status).length
  const total = tasks.length
  const pct = total > 0 ? (completed / total) * 100 : 0

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords size={16} strokeWidth={2} className="text-accent-violet" />
          <div>
            <h2 className="font-bold text-text-heading text-base">Daily Missions</h2>
            <p className="text-xs text-text-muted mt-0.5">{completed}/{total} completed</p>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAdd((v) => !v)} icon={<Plus size={14} />} id="add-task-toggle">
          {showAdd ? 'Close' : 'Add Mission'}
        </Button>
      </div>

      {total > 0 && <ProgressBar value={pct} completed={completed} total={total} showLabel />}

      {showAdd && (
        <div className="border-2 border-accent-violet/20 rounded-card-sm p-4 bg-accent-violet-dim/30 animate-slide-down">
          <AddTaskForm userId={userId} onClose={() => setShowAdd(false)} />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-bg rounded-card-sm animate-pulse-soft" />)}
        </div>
      ) : total === 0 && !showAdd ? (
        <div className="text-center py-10">
          <Target size={36} strokeWidth={1.5} className="mx-auto text-text-light mb-3" />
          <p className="text-sm font-bold text-text-heading">No missions set yet</p>
          <p className="text-xs text-text-muted mt-1">Add tasks or drag on the calendar to create blocks</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => <TaskItem key={task.id} task={task} />)}
        </div>
      )}
    </Card>
  )
}
