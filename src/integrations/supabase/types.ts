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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          created_at: string
          id: string
          match_score: number | null
          rating: number | null
          shift_id: string
          status: string
          updated_at: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_score?: number | null
          rating?: number | null
          shift_id: string
          status: string
          updated_at?: string
          worker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_score?: number | null
          rating?: number | null
          shift_id?: string
          status?: string
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          address: string
          area_name: string
          business_type: string
          created_at: string
          description: string
          is_demo: boolean
          lat: number | null
          lng: number | null
          name: string
          user_id: string
        }
        Insert: {
          address?: string
          area_name?: string
          business_type?: string
          created_at?: string
          description?: string
          is_demo?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          user_id: string
        }
        Update: {
          address?: string
          area_name?: string
          business_type?: string
          created_at?: string
          description?: string
          is_demo?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      shifts: {
        Row: {
          business_id: string
          created_at: string
          description: string
          ends_at: string
          hourly_rate: number
          id: string
          is_demo: boolean
          is_urgent: boolean
          lat: number
          lng: number
          location_name: string
          min_experience_years: number
          required_skills: string[]
          role: string
          starts_at: string
          status: string
          title: string
          workers_needed: number
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string
          ends_at: string
          hourly_rate: number
          id?: string
          is_demo?: boolean
          is_urgent?: boolean
          lat: number
          lng: number
          location_name?: string
          min_experience_years?: number
          required_skills?: string[]
          role: string
          starts_at: string
          status?: string
          title?: string
          workers_needed?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string
          ends_at?: string
          hourly_rate?: number
          id?: string
          is_demo?: boolean
          is_urgent?: boolean
          lat?: number
          lng?: number
          location_name?: string
          min_experience_years?: number
          required_skills?: string[]
          role?: string
          starts_at?: string
          status?: string
          title?: string
          workers_needed?: number
        }
        Relationships: [
          {
            foreignKeyName: "shifts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      worker_profiles: {
        Row: {
          area_name: string
          available_from: string | null
          available_until: string | null
          bio: string
          created_at: string
          experience_years: number
          full_name: string
          headline: string
          hourly_rate: number
          is_demo: boolean
          lat: number | null
          lng: number | null
          rating: number
          rating_count: number
          ready_to_work: boolean
          roles: string[]
          skills: string[]
          travel_radius_km: number
          updated_at: string
          user_id: string
        }
        Insert: {
          area_name?: string
          available_from?: string | null
          available_until?: string | null
          bio?: string
          created_at?: string
          experience_years?: number
          full_name?: string
          headline?: string
          hourly_rate?: number
          is_demo?: boolean
          lat?: number | null
          lng?: number | null
          rating?: number
          rating_count?: number
          ready_to_work?: boolean
          roles?: string[]
          skills?: string[]
          travel_radius_km?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          area_name?: string
          available_from?: string | null
          available_until?: string | null
          bio?: string
          created_at?: string
          experience_years?: number
          full_name?: string
          headline?: string
          hourly_rate?: number
          is_demo?: boolean
          lat?: number | null
          lng?: number | null
          rating?: number
          rating_count?: number
          ready_to_work?: boolean
          roles?: string[]
          skills?: string[]
          travel_radius_km?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _confirm_application: { Args: { _app_id: string }; Returns: undefined }
      apply_to_shift: {
        Args: { _match_score: number; _shift_id: string }
        Returns: string
      }
      business_has_listing: { Args: { _business_id: string }; Returns: boolean }
      business_linked_to_worker: {
        Args: { _worker_id: string }
        Returns: boolean
      }
      complete_shift: {
        Args: { _rating: number; _shift_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      offer_shift: {
        Args: { _match_score: number; _shift_id: string; _worker_id: string }
        Returns: string
      }
      public_ready_workers: {
        Args: { _limit?: number }
        Returns: {
          area_name: string
          display_name: string
          experience_years: number
          headline: string
          lat: number
          lng: number
          rating: number
          rating_count: number
          roles: string[]
          user_id: string
        }[]
      }
      respond_to_application: {
        Args: { _accept: boolean; _app_id: string }
        Returns: undefined
      }
      roll_demo_shifts: { Args: never; Returns: undefined }
      set_my_role: {
        Args: { _name: string; _role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
      worker_linked_to_business: {
        Args: { _business_id: string }
        Returns: boolean
      }
      worker_linked_to_shift: { Args: { _shift_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "worker" | "business"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["worker", "business"],
    },
  },
} as const
