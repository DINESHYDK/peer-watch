import React from 'react'
import { TaskList } from './TaskList'
import { DayTimeline } from './DayTimeline'
import type { TaskRow } from '@/types/database.types'

interface WarRoomProps {
  tasks: TaskRow[]
  userId: string
  date: string
  isLoading: boolean
}

export const WarRoom: React.FC<WarRoomProps> = ({ tasks, userId, date, isLoading }) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-text-heading">War Room ⚔️</h1>
      <p className="text-text-muted text-sm mt-0.5">
        Set your daily missions and schedule your battle plan.
      </p>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6">
      {/* Task list (left panel) */}
      <TaskList tasks={tasks} userId={userId} isLoading={isLoading} />

      {/* Calendar timeline (right panel) */}
      <DayTimeline tasks={tasks} userId={userId} date={date} />
    </div>
  </div>
)
