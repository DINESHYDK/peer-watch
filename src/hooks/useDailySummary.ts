import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DailySummaryRow } from '@/types/database.types'

export function useDailySummary(
  userId: string | null,
  groupId: string | null,
  date: string
) {
  return useQuery<DailySummaryRow | null>({
    queryKey: ['dailySummary', userId, groupId, date],
    enabled: !!userId && !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', userId!)
        .eq('group_id', groupId!)
        .eq('date', date)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export function useLeaderboard(groupId: string | null, date: string) {
  return useQuery<DailySummaryRow[]>({
    queryKey: ['leaderboard', groupId, date],
    enabled: !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('group_id', groupId!)
        .eq('date', date)
        .order('daily_score', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}
