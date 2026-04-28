import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { DashboardPage } from '@/pages/DashboardPage'
import { WarRoomPage } from '@/pages/WarRoomPage'
import type { UserRow, GroupRow } from '@/types/database.types'
import { AppShell } from '@/components/layout/AppShell'

interface AppRouterProps {
  user: UserRow
  groups: GroupRow[]
}

export const AppRouter: React.FC<AppRouterProps> = ({ user, groups }) => (
  <AppShell user={user} groups={groups}>
    <Routes>
      <Route path="/dashboard" element={<DashboardPage user={user} />} />
      <Route path="/war-room"  element={<WarRoomPage user={user} />} />
      <Route path="*"          element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </AppShell>
)
