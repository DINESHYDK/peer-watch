import React from 'react'
import { WarRoom } from '@/components/WarRoom/WarRoom'
import { useTasks } from '@/hooks/useTasks'
import type { UserRow } from '@/types/database.types'

interface WarRoomPageProps {
  user: UserRow
}

export const WarRoomPage: React.FC<WarRoomPageProps> = ({ user }) => {
  const today = new Date().toISOString().split('T')[0]
  const { data: tasks = [], isLoading } = useTasks(user.id, today)

  return (
    <WarRoom
      tasks={tasks}
      userId={user.id}
      date={today}
      isLoading={isLoading}
    />
  )
}
