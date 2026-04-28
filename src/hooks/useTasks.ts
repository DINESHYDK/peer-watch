import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TaskRow } from '@/types/database.types'

const todayStr = () => new Date().toISOString().split('T')[0]

// ── Read ─────────────────────────────────────────────────────
export function useTasks(userId: string | null, date?: string) {
  const d = date ?? todayStr()
  return useQuery<TaskRow[]>({
    queryKey: ['tasks', userId, d],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId!)
        .eq('date', d)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

// ── Add task ─────────────────────────────────────────────────
export function useAddTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      user_id: string
      title: string
      hardness_level: number
      start_time?: string | null
      end_time?: string | null
      date?: string
    }) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...payload, date: payload.date ?? todayStr() })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tasks', data.user_id, data.date] })
    },
  })
}

// ── Toggle status ─────────────────────────────────────────────
export function useToggleTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, userId, date }: {
      id: string; status: boolean; userId: string; date: string
    }) => {
      const { error } = await supabase.from('tasks').update({ status }).eq('id', id)
      if (error) throw error
      return { userId, date }
    },
    onSuccess: ({ userId, date }) => {
      qc.invalidateQueries({ queryKey: ['tasks', userId, date] })
    },
  })
}

// ── Update time slot (drag-drop in FullCalendar) ──────────────
export function useUpdateTaskTime() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, start_time, end_time, userId, date }: {
      id: string; start_time: string; end_time: string; userId: string; date: string
    }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ start_time, end_time })
        .eq('id', id)
      if (error) throw error
      return { userId, date }
    },
    onSuccess: ({ userId, date }) => {
      qc.invalidateQueries({ queryKey: ['tasks', userId, date] })
    },
  })
}

// ── Delete task ───────────────────────────────────────────────
export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, userId, date }: {
      id: string; userId: string; date: string
    }) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
      return { userId, date }
    },
    onSuccess: ({ userId, date }) => {
      qc.invalidateQueries({ queryKey: ['tasks', userId, date] })
    },
  })
}
