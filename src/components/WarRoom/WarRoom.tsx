import React from 'react'
import { Swords } from 'lucide-react'
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
    <div className="flex items-center gap-2">
      <Swords size={22} strokeWidth={2} className="text-accent-violet" />
      <div>
        <h1 className="text-2xl font-bold text-text-heading">War Room</h1>
        <p className="text-text-muted text-sm mt-0.5">
          Set your daily missions and schedule your battle plan.
        </p>
      </div>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6">
      <TaskList tasks={tasks} userId={userId} isLoading={isLoading} />
      <DayTimeline tasks={tasks} userId={userId} date={date} />
    </div>
  </div>
)
