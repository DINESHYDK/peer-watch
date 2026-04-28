import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { PeerRatingRow } from '@/types/database.types'

// ── Check if current user already rated someone today ─────────
export function useMyRating(
  raterId: string | null,
  rateeId: string | null,
  groupId: string | null,
  date: string
) {
  return useQuery<PeerRatingRow | null>({
    queryKey: ['peerRating', raterId, rateeId, groupId, date],
    enabled: !!raterId && !!rateeId && !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('peer_ratings')
        .select('*')
        .eq('rater_id', raterId!)
        .eq('ratee_id', rateeId!)
        .eq('group_id', groupId!)
        .eq('date', date)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

// ── Submit / update a peer rating ─────────────────────────────
export function useSubmitRating() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      rater_id: string
      ratee_id: string
      group_id: string
      date: string
      rating: number
      comment?: string
    }) => {
      const { error } = await supabase.rpc('submit_peer_rating', {
        p_rater_id: payload.rater_id,
        p_ratee_id: payload.ratee_id,
        p_group_id: payload.group_id,
        p_date: payload.date,
        p_rating: payload.rating,
        p_comment: payload.comment ?? null,
      })
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ['peerRating', variables.rater_id, variables.ratee_id],
      })
      qc.invalidateQueries({
        queryKey: ['dailySummary', variables.ratee_id, variables.group_id],
      })
      qc.invalidateQueries({ queryKey: ['groupMembers', variables.group_id] })
    },
  })
}
