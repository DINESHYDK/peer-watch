import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserRow } from '@/types/database.types'
import type { Session } from '@supabase/supabase-js'

interface AuthState {
  session: Session | null
  user: UserRow | null
  loading: boolean
  refetch: () => Promise<void> | void
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<UserRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialise session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      if (s?.user) fetchProfile(s.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s)
        if (s?.user) fetchProfile(s.user.id)
        else { setUser(null); setLoading(false) }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    setUser(data ?? null)
    setLoading(false)
  }

  return { session, user, loading, refetch: () => session?.user && fetchProfile(session.user.id) }
}
