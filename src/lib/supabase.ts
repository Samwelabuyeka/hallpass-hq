import { createClient } from '@supabase/supabase-js'
import { Database } from './database-types'

const supabaseUrl = 'https://your-project-ref.supabase.co'
const supabaseAnonKey = 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type { Database } from './database-types'

export type OldDatabase = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          theme_preference: 'light' | 'dark' | 'system'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          theme_preference?: 'light' | 'dark' | 'system'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          theme_preference?: 'light' | 'dark' | 'system'
          created_at?: string
          updated_at?: string
        }
      }
      units: {
        Row: {
          id: string
          user_id: string
          code: string
          name: string
          color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          code: string
          name: string
          color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          code?: string
          name?: string
          color?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      timetables: {
        Row: {
          id: string
          user_id: string
          unit_id: string
          type: 'study' | 'exam'
          day: string | null
          time_start: string | null
          time_end: string | null
          exam_date: string | null
          venue: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          unit_id: string
          type: 'study' | 'exam'
          day?: string | null
          time_start?: string | null
          time_end?: string | null
          exam_date?: string | null
          venue?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          unit_id?: string
          type?: 'study' | 'exam'
          day?: string | null
          time_start?: string | null
          time_end?: string | null
          exam_date?: string | null
          venue?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}