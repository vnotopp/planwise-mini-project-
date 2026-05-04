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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          annual_return: number | null
          category: string | null
          created_at: string
          current_value: number
          id: string
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_value: number | null
          user_id: string
        }
        Insert: {
          annual_return?: number | null
          category?: string | null
          created_at?: string
          current_value?: number
          id?: string
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          user_id: string
        }
        Update: {
          annual_return?: number | null
          category?: string | null
          created_at?: string
          current_value?: number
          id?: string
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          user_id?: string
        }
        Relationships: []
      }
      debts: {
        Row: {
          created_at: string
          id: string
          interest_rate: number
          minimum_payment: number
          name: string
          principal: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interest_rate?: number
          minimum_payment?: number
          name: string
          principal?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interest_rate?: number
          minimum_payment?: number
          name?: string
          principal?: number
          user_id?: string
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          buyer_id: string
          city: string | null
          created_at: string
          event_date: string | null
          guest_count: number | null
          id: string
          listing_id: string | null
          message: string | null
          seller_id: string
          status: string
        }
        Insert: {
          buyer_id: string
          city?: string | null
          created_at?: string
          event_date?: string | null
          guest_count?: number | null
          id?: string
          listing_id?: string | null
          message?: string | null
          seller_id: string
          status?: string
        }
        Update: {
          buyer_id?: string
          city?: string | null
          created_at?: string
          event_date?: string | null
          guest_count?: number | null
          id?: string
          listing_id?: string | null
          message?: string | null
          seller_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          budget: number
          created_at: string
          date: string | null
          id: string
          name: string
          type: string | null
          user_id: string
        }
        Insert: {
          budget?: number
          created_at?: string
          date?: string | null
          id?: string
          name: string
          type?: string | null
          user_id: string
        }
        Update: {
          budget?: number
          created_at?: string
          date?: string | null
          id?: string
          name?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          category: string
          cities: string[] | null
          created_at: string
          description: string | null
          id: string
          included: string[] | null
          is_active: boolean
          name: string
          price: number
          price_type: string | null
          rating: number
          review_count: number
          seller_id: string
          tags: string[] | null
          verified: boolean
        }
        Insert: {
          category: string
          cities?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          included?: string[] | null
          is_active?: boolean
          name: string
          price: number
          price_type?: string | null
          rating?: number
          review_count?: number
          seller_id: string
          tags?: string[] | null
          verified?: boolean
        }
        Update: {
          category?: string
          cities?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          included?: string[] | null
          is_active?: boolean
          name?: string
          price?: number
          price_type?: string | null
          rating?: number
          review_count?: number
          seller_id?: string
          tags?: string[] | null
          verified?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          actual_cost: number
          category: string | null
          created_at: string
          estimated_cost: number
          event_id: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          actual_cost?: number
          category?: string | null
          created_at?: string
          estimated_cost?: number
          event_id?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          actual_cost?: number
          category?: string | null
          created_at?: string
          estimated_cost?: number
          event_id?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_financial_settings: {
        Row: {
          id: string
          monthly_income: number
          monthly_savings: number
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          monthly_income?: number
          monthly_savings?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          monthly_income?: number
          monthly_savings?: number
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
