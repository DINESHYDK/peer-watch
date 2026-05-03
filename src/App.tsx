import React, { useEffect, useState, useCallback } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/hooks/useAuth'
import { AppRouter } from '@/router'
import { AuthPage } from '@/pages/AuthPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'
import type { GroupRow } from '@/types/database.types'

function AppInner() {
  const { session, user, loading, refetch } = useAuth()
  const { setActiveGroupId, activeGroupId } = useAppStore()
  const [groups, setGroups] = useState<GroupRow[]>([])
  const [groupsLoading, setGroupsLoading] = useState(false)

  const fetchGroups = useCallback(async (userId: string) => {
    setGroupsLoading(true)
    const { data: memberships } = await supabase
      .from('group_members').select('group_id').eq('user_id', userId)
    const ids = (memberships ?? []).map((m) => m.group_id)
    if (!ids.length) { setGroups([]); setGroupsLoading(false); return }
    const { data } = await supabase.from('groups').select('*').in('id', ids)
    const g = data ?? []
    setGroups(g)
    if (!activeGroupId && g.length > 0) setActiveGroupId(g[0].id)
    setGroupsLoading(false)
  }, [activeGroupId, setActiveGroupId])

  useEffect(() => {
    if (user) fetchGroups(user.id)
    else { setGroups([]); setGroupsLoading(false) }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

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

  if (!session) return <AuthPage />

  if (!user) {
    return (
      <OnboardingPage
        userId={session.user.id}
        onComplete={() => {
          refetch()
          fetchGroups(session.user.id)
        }}
      />
    )
  }

  return (
    <AppRouter
      user={user}
      groups={groups}
      refetchGroups={() => fetchGroups(user.id)}
    />
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInner />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#FDF5E6',
              color: '#1E1B4B',
              borderRadius: '16px',
              fontSize: '13px',
              fontWeight: '600',
              boxShadow: '0 8px 32px rgba(91, 33, 182, 0.12)',
              border: '1px solid rgba(91, 33, 182, 0.08)',
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: '#059669', secondary: '#D1FAE5' },
            },
            error: {
              iconTheme: { primary: '#DC2626', secondary: '#FEE2E2' },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
