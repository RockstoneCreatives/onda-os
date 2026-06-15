import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      wines: {
        Row: {
          id: string
          colour_style: string
          region: string | null
          country: string | null
          producer: string
          name: string
          vintage: string | null
          grapes: string | null
          btg: boolean
          importer: string | null
          cost_price: number | null
          sale_price: number | null
          glass_price: number | null
          inventory_location: string | null
          tasting_notes: string | null
          status: 'Active' | 'Inactive'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['wines']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['wines']['Insert']>
      }
      menus: {
        Row: {
          id: string
          title: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['menus']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['menus']['Insert']>
      }
      menu_sections: {
        Row: {
          id: string
          menu_id: string
          name: string
          sort_order: number
        }
        Insert: Omit<Database['public']['Tables']['menu_sections']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['menu_sections']['Insert']>
      }
      menu_items: {
        Row: {
          id: string
          section_id: string
          wine_id: string
          sort_order: number
        }
        Insert: Omit<Database['public']['Tables']['menu_items']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['menu_items']['Insert']>
      }
    }
  }
}
