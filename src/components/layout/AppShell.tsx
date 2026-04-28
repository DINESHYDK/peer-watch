import React from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import type { UserRow, GroupRow } from '@/types/database.types'

interface AppShellProps {
  user: UserRow
  groups: GroupRow[]
  children: React.ReactNode
}

export const AppShell: React.FC<AppShellProps> = ({ user, groups, children }) => (
  <div className="flex h-screen bg-bg overflow-hidden">
    {/* Sidebar */}
    <Sidebar user={user} groups={groups} />

    {/* Main content */}
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <TopBar user={user} />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {children}
      </main>
    </div>
  </div>
)
