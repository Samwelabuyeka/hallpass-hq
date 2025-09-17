export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          university_id: string | null
          student_id: string | null
          theme_preference: 'light' | 'dark' | 'system'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          university_id?: string | null
          student_id?: string | null
          theme_preference?: 'light' | 'dark' | 'system'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          university_id?: string | null
          student_id?: string | null
          theme_preference?: 'light' | 'dark' | 'system'
          created_at?: string
          updated_at?: string
        }
      }
      universities: {
        Row: {
          id: string
          name: string
          code: string
          country: string
          logo_url: string | null
          api_endpoint: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          country: string
          logo_url?: string | null
          api_endpoint?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          country?: string
          logo_url?: string | null
          api_endpoint?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      master_units: {
        Row: {
          id: string
          university_id: string
          code: string
          name: string
          department: string | null
          semester: string | null
          year: number | null
          credits: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          university_id: string
          code: string
          name: string
          department?: string | null
          semester?: string | null
          year?: number | null
          credits?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          university_id?: string
          code?: string
          name?: string
          department?: string | null
          semester?: string | null
          year?: number | null
          credits?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      master_timetables: {
        Row: {
          id: string
          university_id: string
          unit_id: string
          type: 'lecture' | 'tutorial' | 'lab' | 'exam'
          day: string | null
          time_start: string | null
          time_end: string | null
          exam_date: string | null
          venue: string | null
          lecturer: string | null
          semester: string | null
          year: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          university_id: string
          unit_id: string
          type: 'lecture' | 'tutorial' | 'lab' | 'exam'
          day?: string | null
          time_start?: string | null
          time_end?: string | null
          exam_date?: string | null
          venue?: string | null
          lecturer?: string | null
          semester?: string | null
          year?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          university_id?: string
          unit_id?: string
          type?: 'lecture' | 'tutorial' | 'lab' | 'exam'
          day?: string | null
          time_start?: string | null
          time_end?: string | null
          exam_date?: string | null
          venue?: string | null
          lecturer?: string | null
          semester?: string | null
          year?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      student_units: {
        Row: {
          id: string
          student_id: string
          unit_id: string
          semester: string
          year: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          unit_id: string
          semester: string
          year: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          unit_id?: string
          semester?: string
          year?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}