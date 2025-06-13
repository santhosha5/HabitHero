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
      habits: {
        Row: {
          id: string
          created_at: string
          user_id: string
          title: string
          description: string | null
          frequency: string
          category: string
          points: number
          streak: number
          last_completed: string | null
          is_archived: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          title: string
          description?: string | null
          frequency: string
          category: string
          points: number
          streak?: number
          last_completed?: string | null
          is_archived?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          title?: string
          description?: string | null
          frequency?: string
          category?: string
          points?: number
          streak?: number
          last_completed?: string | null
          is_archived?: boolean
        }
      }
      completions: {
        Row: {
          id: string
          created_at: string
          habit_id: string
          user_id: string
          completed_at: string
          points_earned: number
        }
        Insert: {
          id?: string
          created_at?: string
          habit_id: string
          user_id: string
          completed_at: string
          points_earned: number
        }
        Update: {
          id?: string
          created_at?: string
          habit_id?: string
          user_id?: string
          completed_at?: string
          points_earned?: number
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          username: string
          full_name: string | null
          avatar_url: string | null
          points: number
          level: number
          family_id: string | null
        }
        Insert: {
          id: string
          created_at?: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          points?: number
          level?: number
          family_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          points?: number
          level?: number
          family_id?: string | null
        }
      }
      families: {
        Row: {
          id: string
          created_at: string
          name: string
          created_by: string
          member_count: number
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          created_by: string
          member_count?: number
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          created_by?: string
          member_count?: number
        }
      }
      medals: {
        Row: {
          id: string
          created_at: string
          user_id: string
          type: string
          category: string
          points_required: number
          earned_at: string
          three_d_model_url: string | null
          animation_type: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          type: string
          category: string
          points_required: number
          earned_at: string
          three_d_model_url?: string | null
          animation_type: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          type?: string
          category?: string
          points_required?: number
          earned_at?: string
          three_d_model_url?: string | null
          animation_type?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 