// Généré par `npm run db:types` à partir du schéma Supabase — ne pas modifier à la main.

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
      categories: {
        Row: {
          name_fr: string
          name_mg: string
          position: number
          slug: string
        }
        Insert: {
          name_fr: string
          name_mg: string
          position: number
          slug: string
        }
        Update: {
          name_fr?: string
          name_mg?: string
          position?: number
          slug?: string
        }
        Relationships: []
      }
      criteria: {
        Row: {
          category_slug: string
          label_fr: string
          label_mg: string
          position: number
          slug: string
        }
        Insert: {
          category_slug: string
          label_fr: string
          label_mg: string
          position: number
          slug: string
        }
        Update: {
          category_slug?: string
          label_fr?: string
          label_mg?: string
          position?: number
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "criteria_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
        ]
      }
      places: {
        Row: {
          address: string | null
          category_slug: string
          city: string
          cover_url: string | null
          created_at: string
          created_by: string | null
          criteria_avgs: Json
          district: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          osm_id: string | null
          phone: string | null
          rating_avg: number
          rating_count: number
          rating_distribution: number[]
          status: string
          subcategory: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          category_slug: string
          city?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          criteria_avgs?: Json
          district: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          osm_id?: string | null
          phone?: string | null
          rating_avg?: number
          rating_count?: number
          rating_distribution?: number[]
          status?: string
          subcategory?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          category_slug?: string
          city?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          criteria_avgs?: Json
          district?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          osm_id?: string | null
          phone?: string | null
          rating_avg?: number
          rating_count?: number
          rating_distribution?: number[]
          status?: string
          subcategory?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "places_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "places_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_id: string
          comment: string | null
          created_at: string
          criteria: Json
          id: string
          place_id: string
          rating: number
          updated_at: string
        }
        Insert: {
          author_id?: string
          comment?: string | null
          created_at?: string
          criteria?: Json
          id?: string
          place_id: string
          rating: number
          updated_at?: string
        }
        Update: {
          author_id?: string
          comment?: string | null
          created_at?: string
          criteria?: Json
          id?: string
          place_id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bayesian_score: {
        Args: {
          p_avg: number
          p_count: number
          p_prior?: number
          p_weight?: number
        }
        Returns: number
      }
      distance_meters: {
        Args: { p_lat1: number; p_lat2: number; p_lng1: number; p_lng2: number }
        Returns: number
      }
      nearby_places: {
        Args: {
          p_category?: string
          p_district?: string
          p_lat: number
          p_limit?: number
          p_lng: number
          p_offset?: number
          p_radius_m?: number
          p_search?: string
          p_sort?: string
        }
        Returns: {
          address: string
          category_slug: string
          city: string
          cover_url: string
          criteria_avgs: Json
          distance_m: number
          district: string
          id: string
          lat: number
          lng: number
          name: string
          phone: string
          rating_avg: number
          rating_count: number
          rating_distribution: number[]
          score: number
          subcategory: string
        }[]
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
    Enums: {},
  },
} as const
