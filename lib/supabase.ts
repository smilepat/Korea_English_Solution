import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      problems: {
        Row: {
          id: number
          text: string
          checked: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          text: string
          checked?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          text?: string
          checked?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      lexile_test_results: {
        Row: {
          id: number
          user_id: string | null
          score: number | null
          level: string | null
          test_date: string
          answers: any | null
        }
        Insert: {
          id?: number
          user_id?: string | null
          score?: number | null
          level?: string | null
          test_date?: string
          answers?: any | null
        }
        Update: {
          id?: number
          user_id?: string | null
          score?: number | null
          level?: string | null
          test_date?: string
          answers?: any | null
        }
      }
    }
  }
}
