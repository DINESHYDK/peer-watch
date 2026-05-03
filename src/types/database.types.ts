// Auto-generated types matching the Supabase schema.
// Regenerate with: supabase gen types typescript --local > src/types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          nickname: string
          avatar_url: string | null
          current_streak: number
          global_score: number
          status_tag: string
          timezone: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          nickname: string
          avatar_url?: string | null
          current_streak?: number
          global_score?: number
          status_tag?: string
          timezone?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      groups: {
        Row: {
          id: string
          name: string
          leader_id: string | null
          end_of_day_time: string
          invite_code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          leader_id?: string | null
          end_of_day_time?: string
          invite_code?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['groups']['Insert']>
      }
      group_members: {
        Row: {
          user_id: string
          group_id: string
          joined_at: string
        }
        Insert: {
          user_id: string
          group_id: string
          joined_at?: string
        }
        Update: Partial<Database['public']['Tables']['group_members']['Insert']>
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          date: string
          title: string
          hardness_level: number
          status: boolean
          start_time: string | null
          end_time: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date?: string
          title: string
          hardness_level?: number
          status?: boolean
          start_time?: string | null
          end_time?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>
      }
      daily_summaries: {
        Row: {
          id: string
          user_id: string
          group_id: string
          date: string
          completion_percentage: number
          peer_rating_sum: number
          peer_rating_count: number
          daily_score: number
        }
        Insert: {
          id?: string
          user_id: string
          group_id: string
          date?: string
          completion_percentage?: number
          peer_rating_sum?: number
          peer_rating_count?: number
          daily_score?: number
        }
        Update: Partial<Database['public']['Tables']['daily_summaries']['Insert']>
      }
      peer_ratings: {
        Row: {
          id: string
          rater_id: string
          ratee_id: string
          group_id: string
          date: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          rater_id: string
          ratee_id: string
          group_id: string
          date?: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['peer_ratings']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          group_id: string | null
          type: string
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          group_id?: string | null
          type: string
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      submit_peer_rating: {
        Args: {
          p_rater_id: string
          p_ratee_id: string
          p_group_id: string
          p_date: string
          p_rating: number
          p_comment?: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ── Convenience Row Types ──────────────────────────────────────
export type UserRow          = Database['public']['Tables']['users']['Row']
export type GroupRow         = Database['public']['Tables']['groups']['Row']
export type GroupMemberRow   = Database['public']['Tables']['group_members']['Row']
export type TaskRow          = Database['public']['Tables']['tasks']['Row']
export type DailySummaryRow  = Database['public']['Tables']['daily_summaries']['Row']
export type PeerRatingRow    = Database['public']['Tables']['peer_ratings']['Row']
export type NotificationRow  = Database['public']['Tables']['notifications']['Row']

// ── Enriched Types (with joins) ────────────────────────────────
export interface MemberWithTasks extends UserRow {
  tasks: TaskRow[]
  todaySummary: DailySummaryRow | null
  myRating: PeerRatingRow | null
}
