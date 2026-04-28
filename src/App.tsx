import React, { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/hooks/useAuth'
import { AppRouter } from '@/router'
import { AuthPage } from '@/pages/AuthPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'
import type { GroupRow } from '@/types/database.types'

function AppInner() {
  const { session, user, loading } = useAuth()
  const { setActiveGroupId } = useAppStore()
  const [groups, setGroups] = useState<GroupRow[]>([])
  const [groupsLoading, setGroupsLoading] = useState(false)

  // Fetch groups when user is available
  useEffect(() => {
    if (!user) return
    setGroupsLoading(true)

    supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)
      .then(({ data: memberships }) => {
        const ids = (memberships ?? []).map((m) => m.group_id)
        if (!ids.length) { setGroups([]); setGroupsLoading(false); return }

        supabase
          .from('groups')
          .select('*')
          .in('id', ids)
          .then(({ data }) => {
            const g = data ?? []
            setGroups(g)
            if (g.length > 0) setActiveGroupId(g[0].id)
            setGroupsLoading(false)
          })
      })
  }, [user, setActiveGroupId])

  if (loading || groupsLoading) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-accent-violet border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted font-medium text-sm">Loading Peer-Watch...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!session) return <AuthPage />

  // Authenticated but no profile yet
  if (!user) {
    return (
      <OnboardingPage
        userId={session.user.id}
        onComplete={() => window.location.reload()}
      />
    )
  }

  return <AppRouter user={user} groups={groups} />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
