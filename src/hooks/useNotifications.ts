import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { NotificationRow } from '@/types/database.types'

export function useNotifications(userId: string | undefined) {
  const queryClient = useQueryClient()

  // 1. Fetch current notifications
  const query = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return data as NotificationRow[]
    },
    enabled: !!userId,
  })

  // 2. Subscribe to new notifications
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])

  // 3. Mark as read mutation
  const markAsRead = useMutation({
    mutationFn: async (notificationIds?: string[]) => {
      if (!userId) return
      let q = supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
      if (notificationIds && notificationIds.length > 0) {
        q = q.in('id', notificationIds)
      }
      const { error } = await q
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
    },
  })

  return {
    ...query,
    markAsRead,
  }
}
