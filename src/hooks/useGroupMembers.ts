import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { MemberWithTasks } from '@/types/database.types'

const today = () => new Date().toISOString().split('T')[0]

export function useGroupMembers(groupId: string | null, currentUserId: string | null) {
  const queryClient = useQueryClient()

  const query = useQuery<MemberWithTasks[]>({
    queryKey: ['groupMembers', groupId],
    enabled: !!groupId,
    staleTime: 1000 * 30,
    queryFn: async () => {
      const date = today()

      // 1. Fetch members
      const { data: members, error: membersErr } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId!)

      if (membersErr) throw membersErr
      const userIds = members.map((m) => m.user_id)
      if (!userIds.length) return []

      // 2. Fetch user profiles
      const { data: profiles, error: profilesErr } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds)

      if (profilesErr) throw profilesErr

      // 3. Fetch today's tasks for all members
      const { data: tasks, error: tasksErr } = await supabase
        .from('tasks')
        .select('*')
        .in('user_id', userIds)
        .eq('date', date)

      if (tasksErr) throw tasksErr

      // 4. Fetch today's summaries
      const { data: summaries } = await supabase
        .from('daily_summaries')
        .select('*')
        .in('user_id', userIds)
        .eq('group_id', groupId!)
        .eq('date', date)

      // 5. Fetch current user's ratings for today
      const { data: myRatings } = currentUserId
        ? await supabase
            .from('peer_ratings')
            .select('*')
            .eq('rater_id', currentUserId)
            .eq('group_id', groupId!)
            .eq('date', date)
        : { data: [] }

      // 6. Merge
      return profiles.map((profile) => ({
        ...profile,
        tasks: tasks.filter((t) => t.user_id === profile.id),
        todaySummary: summaries?.find((s) => s.user_id === profile.id) ?? null,
        myRating: myRatings?.find((r) => r.ratee_id === profile.id) ?? null,
      }))
    },
  })

  // ── Realtime subscription ──────────────────────────────────
  useEffect(() => {
    if (!groupId) return

    const channel = supabase
      .channel(`group-tasks-${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [groupId, queryClient])

  return query
}
