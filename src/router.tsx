import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { DashboardPage } from '@/pages/DashboardPage'
import { WarRoomPage } from '@/pages/WarRoomPage'
import { SettingsPage } from '@/pages/SettingsPage'
import type { UserRow, GroupRow } from '@/types/database.types'
import { AppShell } from '@/components/layout/AppShell'

interface AppRouterProps {
  user: UserRow
  groups: GroupRow[]
  refetchGroups?: () => void
}

export const AppRouter: React.FC<AppRouterProps> = ({ user, groups, refetchGroups }) => (
  <AppShell user={user} groups={groups}>
    <Routes>
      <Route path="/dashboard" element={<DashboardPage user={user} />} />
      <Route path="/war-room"  element={<WarRoomPage user={user} />} />
      <Route
        path="/settings"
        element={
          <SettingsPage
            user={user}
            groups={groups}
            onGroupsChange={refetchGroups}
          />
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </AppShell>
)
