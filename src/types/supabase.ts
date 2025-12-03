export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          content: string
          course_id: string
          created_at: string
          id: string
          lecturer_user_id: string
          title: string
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string
          id?: string
          lecturer_user_id: string
          title: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          lecturer_user_id?: string
          title?: string
        }
        Relationships: []
      }
      attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_type: string
          id: string
          message_id: number
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_type: string
          id?: string
          message_id: number
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          message_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      call_participants: {
        Row: {
          call_id: number
          created_at: string
          id: number
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          call_id: number
          created_at?: string
          id?: number
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          call_id?: number
          created_at?: string
          id?: number
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      calls: {
        Row: {
          call_type: string
          caller_id: string
          chat_id: number
          created_at: string
          duration: number | null
          id: string
          receiver_id: string
          status: string
        }
        Insert: {
          call_type: string
          caller_id: string
          chat_id: number
          created_at?: string
          duration?: number | null
          id?: string
          receiver_id: string
          status?: string
        }
        Update: {
          call_type?: string
          caller_id?: string
          chat_id?: number
          created_at?: string
          duration?: number | null
          id?: string
          receiver_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "calls_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          chat_id: number
          created_at: string
          id: number
          last_read_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_id: number
          created_at?: string
          id?: number
          last_read_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_id?: number
          created_at?: string
          id?: number
          last_read_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      chats: {
        Row: {
          course_id: string | null
          created_at: string
          created_by: string | null
          id: number
          name: string | null
          type: string
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: number
          name?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: number
          name?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      class_rep_applications: {
        Row: {
          contact_number: string
          created_at: string
          email: string
          full_name: string
          id: string
          reason_for_applying: string
          status: string
          student_id: string
          updated_at: string
          user_id: string
          year_of_study: string
        }
        Insert: {
          contact_number: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          reason_for_applying: string
          status?: string
          student_id: string
          updated_at?: string
          user_id: string
          year_of_study: string
        }
        Update: {
          contact_number?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          reason_for_applying?: string
          status?: string
          student_id?: string
          updated_at?: string
          user_id?: string
          year_of_study?: string
        }
        Relationships: []
      }
      class_reps: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          semester: number
          unit_code: string
          unit_name: string
          university_id: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          semester: number
          unit_code: string
          unit_name: string
          university_id: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          semester?: number
          unit_code?: string
          unit_name?: string
          university_id?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "class_reps_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      course_unit_set_units: {
        Row: {
          created_at: string
          id: string
          unit_code: string
          unit_name: string
          unit_set_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          unit_code: string
          unit_name: string
          unit_set_id: string
        }
        Update: {
          created_at?: string
          id?: string
          unit_code?: string
          unit_name?: string
          unit_set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_unit_set_units_unit_set_id_fkey"
            columns: ["unit_set_id"]
            isOneToOne: false
            referencedRelation: "course_unit_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      course_unit_sets: {
        Row: {
          combination: string | null
          course_id: string
          created_at: string
          created_by: string | null
          id: string
          semester: number
          year: number
        }
        Insert: {
          combination?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          semester: number
          year: number
        }
        Update: {
          combination?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          semester?: number
          year?: number
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_timetables: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_time: string | null
          exam_date: string | null
          id: number
          instructor: string | null
          metadata: Json | null
          room: string | null
          semester: string | null
          start_time: string | null
          unit_code: string
          unit_name: string | null
          updated_at: string | null
          year: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_time?: string | null
          exam_date?: string | null
          id?: never
          instructor?: string | null
          metadata?: Json | null
          room?: string | null
          semester?: string | null
          start_time?: string | null
          unit_code: string
          unit_name?: string | null
          updated_at?: string | null
          year?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_time?: string | null
          exam_date?: string | null
          id?: never
          instructor?: string | null
          metadata?: Json | null
          room?: string | null
          semester?: string | null
          start_time?: string | null
          unit_code?: string
          unit_name?: string | null
          updated_at?: string | null
          year?: string | null
        }
        Relationships: []
      }
      imported_rows: {
        Row: {
          created_at: string | null
          id: number
          payload: Json | null
          source_file: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          payload?: Json | null
          source_file?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          payload?: Json | null
          source_file?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      kv_store_81199d2c: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      kv_store_e083a758: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      lecturer_courses: {
        Row: {
          course_id: string
          created_at: string
          id: string
          lecturer_user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          lecturer_user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          lecturer_user_id?: string
        }
        Relationships: []
      }
      main_timetables: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_time: string | null
          id: number
          instructor: string | null
          metadata: Json | null
          room: string | null
          semester: string | null
          start_time: string | null
          unit_code: string
          unit_name: string | null
          updated_at: string | null
          year: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_time?: string | null
          id?: never
          instructor?: string | null
          metadata?: Json | null
          room?: string | null
          semester?: string | null
          start_time?: string | null
          unit_code: string
          unit_name?: string | null
          updated_at?: string | null
          year?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_time?: string | null
          id?: never
          instructor?: string | null
          metadata?: Json | null
          room?: string | null
          semester?: string | null
          start_time?: string | null
          unit_code?: string
          unit_name?: string | null
          updated_at?: string | null
          year?: string | null
        }
        Relationships: []
      }
      master_timetables: {
        Row: {
          created_at: string
          day: string | null
          exam_date: string | null
          id: string
          lecturer: string | null
          semester: number
          time_end: string | null
          time_start: string | null
          type: string
          unit_code: string
          unit_name: string
          university_id: string
          venue: string | null
          year: number
        }
        Insert: {
          created_at?: string
          day?: string | null
          exam_date?: string | null
          id?: string
          lecturer?: string | null
          semester: number
          time_end?: string | null
          time_start?: string | null
          type: string
          unit_code: string
          unit_name: string
          university_id: string
          venue?: string | null
          year: number
        }
        Update: {
          created_at?: string
          day?: string | null
          exam_date?: string | null
          id?: string
          lecturer?: string | null
          semester?: number
          time_end?: string | null
          time_start?: string | null
          type?: string
          unit_code?: string
          unit_name?: string
          university_id?: string
          venue?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "master_timetables_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      master_units: {
        Row: {
          created_at: string
          credits: number | null
          department: string | null
          id: string
          semester: number
          unit_code: string
          unit_name: string
          university_id: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          credits?: number | null
          department?: string | null
          id?: string
          semester: number
          unit_code: string
          unit_name: string
          university_id: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          credits?: number | null
          department?: string | null
          id?: string
          semester?: number
          unit_code?: string
          unit_name?: string
          university_id?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "master_units_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: number
          content: string
          created_at: string
          id: number
          read_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_id: number
          content: string
          created_at?: string
          id?: number
          read_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_id?: number
          content?: string
          created_at?: string
          id?: number
          read_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notification_recipients: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          notification_id: string
          read_at: string | null
          recipient_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          notification_id: string
          read_at?: string | null
          recipient_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          notification_id?: string
          read_at?: string | null
          recipient_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          course_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean
          is_class_rep: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          semester: number | null
          student_id: string | null
          university_id: string | null
          updated_at: string
          user_id: string
          year: number | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean
          is_class_rep?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          semester?: number | null
          student_id?: string | null
          university_id?: string | null
          updated_at?: string
          user_id: string
          year?: number | null
        }
        Update: {
          course_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean
          is_class_rep?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          semester?: number | null
          student_id?: string | null
          university_id?: string | null
          updated_at?: string
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          keys: Json
          platform: string | null
          updated_at: string | null
          user_id: string | null
          vapid_key: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          keys: Json
          platform?: string | null
          updated_at?: string | null
          user_id?: string | null
          vapid_key?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          keys?: Json
          platform?: string | null
          updated_at?: string | null
          user_id?: string | null
          vapid_key?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          content_url: string
          created_at: string
          expires_at: string
          id: string
          story_type: string
          user_id: string
        }
        Insert: {
          content_url: string
          created_at?: string
          expires_at?: string
          id?: string
          story_type?: string
          user_id: string
        }
        Update: {
          content_url?: string
          created_at?: string
          expires_at?: string
          id?: string
          story_type?: string
          user_id?: string
        }
        Relationships: []
      }
      student_units: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          semester: number
          unit_code: string
          unit_name: string
          university_id: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          semester: number
          unit_code: string
          unit_name: string
          university_id: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          semester?: number
          unit_code?: string
          unit_name?: string
          university_id?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_units_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_audit: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: number
          new_row: Json | null
          old_row: Json | null
          operation: string
          table_name: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: never
          new_row?: Json | null
          old_row?: Json | null
          operation: string
          table_name: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: never
          new_row?: Json | null
          old_row?: Json | null
          operation?: string
          table_name?: string
        }
        Relationships: []
      }
      universities: {
        Row: {
          code: string
          country: string
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          country: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_unread_messages: {
        Args: { p_chat_id: string; p_user_id: string }
        Returns: number
      }
      create_or_get_chat_with_class_rep: {
        Args: { p_course_id: string }
        Returns: string
      }
      is_in_same_university: { Args: { p_user_id: string }; Returns: boolean }
      mark_chat_as_read: { Args: { p_chat_id: string }; Returns: undefined }
      mark_messages_as_read: {
        Args: { chat_id_param: string; user_id_param: string }
        Returns: undefined
      }
      search_units_fuzzy: {
        Args: {
          search_term: string
          semester_param: number
          university_id_param: string
          year_param: number
        }
        Returns: {
          credits: number
          department: string
          id: string
          semester: number
          similarity_score: number
          unit_code: string
          unit_name: string
          year: number
        }[]
      }
    }
    Enums: {
      chat_type: "direct" | "group" | "course_channel"
      user_role: "student" | "lecturer" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      chat_type: ["direct", "group", "course_channel"],
      user_role: ["student", "lecturer", "admin"],
    },
  },
} as const
A new version of Supabase CLI is available: v2.65.2 (currently installed v1.226.4)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
