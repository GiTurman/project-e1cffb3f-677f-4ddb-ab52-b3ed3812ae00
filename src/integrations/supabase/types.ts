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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      call_notes: {
        Row: {
          author_id: string | null
          author_name: string | null
          body: string
          call_id: string
          created_at: string
          id: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          body: string
          call_id: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          body?: string
          call_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_notes_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "service_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      call_status_history: {
        Row: {
          call_id: string
          changed_at: string
          changed_by: string | null
          id: string
          note: string | null
          status: Database["public"]["Enums"]["call_status"]
        }
        Insert: {
          call_id: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          note?: string | null
          status: Database["public"]["Enums"]["call_status"]
        }
        Update: {
          call_id?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["call_status"]
        }
        Relationships: [
          {
            foreignKeyName: "call_status_history_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "service_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      objects: {
        Row: {
          address: string
          client_name: string | null
          client_phone: string | null
          created_at: string
          elevator_code: string
          id: string
          last_maintenance_date: string | null
          maintenance_interval_months: number
          manufacturer: string | null
          name: string
          next_due_date: string | null
          notes: string | null
          serial_number: string | null
          under_contract: boolean
        }
        Insert: {
          address: string
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          elevator_code: string
          id?: string
          last_maintenance_date?: string | null
          maintenance_interval_months?: number
          manufacturer?: string | null
          name: string
          next_due_date?: string | null
          notes?: string | null
          serial_number?: string | null
          under_contract?: boolean
        }
        Update: {
          address?: string
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          elevator_code?: string
          id?: string
          last_maintenance_date?: string | null
          maintenance_interval_months?: number
          manufacturer?: string | null
          name?: string
          next_due_date?: string | null
          notes?: string | null
          serial_number?: string | null
          under_contract?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          is_active?: boolean
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
        }
        Relationships: []
      }
      service_calls: {
        Row: {
          address: string
          assigned_to: string | null
          call_no: number
          client_name: string | null
          client_phone: string | null
          closed_at: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          elevator_code: string | null
          id: string
          object_id: string | null
          priority: Database["public"]["Enums"]["call_priority"]
          received_at: string
          resolution: string | null
          responded_at: string | null
          scheduled_at: string | null
          serial_number: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          site_name: string
          sla_due_at: string | null
          status: Database["public"]["Enums"]["call_status"]
          updated_at: string
        }
        Insert: {
          address: string
          assigned_to?: string | null
          call_no?: number
          client_name?: string | null
          client_phone?: string | null
          closed_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          elevator_code?: string | null
          id?: string
          object_id?: string | null
          priority?: Database["public"]["Enums"]["call_priority"]
          received_at?: string
          resolution?: string | null
          responded_at?: string | null
          scheduled_at?: string | null
          serial_number?: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          site_name: string
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["call_status"]
          updated_at?: string
        }
        Update: {
          address?: string
          assigned_to?: string | null
          call_no?: number
          client_name?: string | null
          client_phone?: string | null
          closed_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          elevator_code?: string | null
          id?: string
          object_id?: string | null
          priority?: Database["public"]["Enums"]["call_priority"]
          received_at?: string
          resolution?: string | null
          responded_at?: string | null
          scheduled_at?: string | null
          serial_number?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          site_name?: string
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["call_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_calls_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_calls_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "objects"
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "dispatcher" | "technician" | "manager"
      call_priority: "kritikuli" | "maghali" | "sashualo" | "dabali"
      call_status:
        | "akhali"
        | "mighebuli"
        | "gzashi"
        | "mimdinare"
        | "shesrulebuli"
        | "dakhuruli"
        | "gaukmebuli"
      service_type: "avaria" | "gegmiuri" | "inspeqcia" | "chamokideba"
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
      app_role: ["dispatcher", "technician", "manager"],
      call_priority: ["kritikuli", "maghali", "sashualo", "dabali"],
      call_status: [
        "akhali",
        "mighebuli",
        "gzashi",
        "mimdinare",
        "shesrulebuli",
        "dakhuruli",
        "gaukmebuli",
      ],
      service_type: ["avaria", "gegmiuri", "inspeqcia", "chamokideba"],
    },
  },
} as const
