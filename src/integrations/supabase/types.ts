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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_logs: {
        Row: {
          created_at: string
          dustbin_id: string
          id: string
          nonce: string | null
          payload: Json
          reported_at: string
          signature_valid: boolean
        }
        Insert: {
          created_at?: string
          dustbin_id: string
          id?: string
          nonce?: string | null
          payload: Json
          reported_at?: string
          signature_valid: boolean
        }
        Update: {
          created_at?: string
          dustbin_id?: string
          id?: string
          nonce?: string | null
          payload?: Json
          reported_at?: string
          signature_valid?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "device_logs_dustbin_id_fkey"
            columns: ["dustbin_id"]
            isOneToOne: false
            referencedRelation: "dustbins"
            referencedColumns: ["id"]
          },
        ]
      }
      dustbins: {
        Row: {
          api_endpoint: string | null
          api_key: string
          created_at: string | null
          created_by: string | null
          device_secret: string | null
          dustbin_code: string
          dustbin_id: string
          firmware_version: string | null
          id: string
          institution_id: string
          last_seen: string | null
          latitude: number
          location_name: string | null
          longitude: number
          module_id: string | null
          updated_at: string | null
          wifi_ssid: string | null
        }
        Insert: {
          api_endpoint?: string | null
          api_key?: string
          created_at?: string | null
          created_by?: string | null
          device_secret?: string | null
          dustbin_code: string
          dustbin_id: string
          firmware_version?: string | null
          id?: string
          institution_id: string
          last_seen?: string | null
          latitude: number
          location_name?: string | null
          longitude: number
          module_id?: string | null
          updated_at?: string | null
          wifi_ssid?: string | null
        }
        Update: {
          api_endpoint?: string | null
          api_key?: string
          created_at?: string | null
          created_by?: string | null
          device_secret?: string | null
          dustbin_code?: string
          dustbin_id?: string
          firmware_version?: string | null
          id?: string
          institution_id?: string
          last_seen?: string | null
          latitude?: number
          location_name?: string | null
          longitude?: number
          module_id?: string | null
          updated_at?: string | null
          wifi_ssid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dustbins_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_admins: {
        Row: {
          admin_user_id: string | null
          created_at: string
          id: string
          institution_id: string
          supervisor_user_id: string | null
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string
          id?: string
          institution_id: string
          supervisor_user_id?: string | null
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string
          id?: string
          institution_id?: string
          supervisor_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institution_admins_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_admins_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_admins_supervisor_user_id_fkey"
            columns: ["supervisor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          institution_id: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id: string
          institution_id?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          institution_id?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      readings: {
        Row: {
          created_at: string | null
          dustbin_id: string
          fill_percentage: number
          id: string
          sensor1_value: number | null
          sensor2_value: number | null
        }
        Insert: {
          created_at?: string | null
          dustbin_id: string
          fill_percentage: number
          id?: string
          sensor1_value?: number | null
          sensor2_value?: number | null
        }
        Update: {
          created_at?: string | null
          dustbin_id?: string
          fill_percentage?: number
          id?: string
          sensor1_value?: number | null
          sensor2_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "readings_dustbin_id_fkey"
            columns: ["dustbin_id"]
            isOneToOne: false
            referencedRelation: "dustbins"
            referencedColumns: ["id"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_dustbin_status: {
        Args: { bin_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_resource_id?: string
          p_resource_type: string
          p_user_id: string
        }
        Returns: string
      }
      verify_device_signature: {
        Args: { p_dustbin_code: string; p_payload: string; p_signature: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "superuser" | "admin" | "user" | "supervisor"
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
      app_role: ["superuser", "admin", "user", "supervisor"],
    },
  },
} as const
