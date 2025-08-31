

import { createClient } from '@supabase/supabase-js';
import type { ContractType, StaffRole, Location, ShiftTime } from '../types';

// The user provided these values. They are safe to be exposed on the client-side.
const supabaseUrl = 'https://zfiiiiznnozljchqfdsm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmaWlpaXpubm96bGpjaHFmZHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2Njg4MDEsImV4cCI6MjA3MjI0NDgwMX0.sSfRKeSDdIR4UB1E2M72D5yuq3BHdDwlLfzylJDrON4';

// Define a type for our database schema for better type safety.
// This should match the tables created in Supabase.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      absences: {
        Row: {
          id: string
          staff_id: string
          start_date: string
          end_date: string
          reason: string
        }
        Insert: {
          staff_id: string
          start_date: string
          end_date: string
          reason: string
        }
        Update: {
          staff_id?: string
          start_date?: string
          end_date?: string
          reason?: string
        }
      }
      scheduled_shifts: {
        Row: {
          id: string
          date: string
          staff_id: string
          shift_code: string | null
          original_staff_id: string | null
        }
        Insert: {
          id: string
          date: string
          staff_id: string
          shift_code: string | null
          original_staff_id?: string | null
        }
        Update: {
          id?: string
          date?: string
          staff_id?: string
          shift_code?: string | null
          original_staff_id?: string | null
        }
      }
      shift_definitions: {
        Row: {
          code: string
          description: string
          location: string
          time: string
          color: string
          textColor: string
          roles: string[]
        }
        Insert: {
          code: string
          description: string
          location: string
          time: string
          color: string
          textColor: string
          roles: string[]
        }
        Update: {
          code?: string
          description?: string
          location?: string
          time?: string
          color?: string
          textColor?: string
          roles?: string[]
        }
      }
      staff: {
        Row: {
          id: string
          name: string
          role: string
          contract: string
          phone: string | null
          email: string | null
          password: string | null
          hasLaw104: boolean | null
          specialRules: string | null
          unavailableShiftCodes: string[] | null
          nightSquad: number | null
        }
        Insert: {
          name: string
          role: string
          contract: string
          phone: string | null
          email: string | null
          password: string | null
          hasLaw104: boolean | null
          specialRules: string | null
          unavailableShiftCodes: string[] | null
          nightSquad: number | null
        }
        Update: {
          name?: string
          role?: string
          contract?: string
          phone?: string | null
          email?: string | null
          password?: string | null
          hasLaw104?: boolean | null
          specialRules?: string | null
          unavailableShiftCodes?: string[] | null
          nightSquad?: number | null
        }
      }
      staff_teams: {
        Row: {
          staff_id: string
          team_id: string
        }
        Insert: {
          staff_id: string
          team_id: string
        }
        Update: {
          staff_id?: string
          team_id?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          locations: string[]
          allowedShiftCodes: string[] | null
        }
        Insert: {
          id: string
          name: string
          locations: string[]
          allowedShiftCodes: string[] | null
        }
        Update: {
          id?: string
          name?: string
          locations?: string[]
          allowedShiftCodes?: string[] | null
        }
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

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);