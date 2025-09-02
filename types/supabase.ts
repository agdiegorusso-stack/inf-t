// Auto-generated manual Supabase schema types (aligned with supabase_seed.sql)
// If you regenerate via CLI, you can overwrite this file.
// Command example:
// npx supabase gen types typescript --project-id $SUPABASE_PROJECT_ID --schema public > types/supabase.ts

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
      teams: {
        Row: {
          id: string
          name: string
          locations: string[] | null
          allowedShiftCodes: string[] | null
        }
        Insert: {
          id: string
          name: string
          locations?: string[] | null
          allowedShiftCodes?: string[] | null
        }
        Update: {
          id?: string
          name?: string
          locations?: string[] | null
          allowedShiftCodes?: string[] | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          id: string
          name: string
          role: string
          contract: string | null
          teamIds: string[] | null
          phone: string | null
          email: string | null
          password: string | null
          hasLaw104: boolean | null
          specialRules: string | null
          unavailableShiftCodes: string[] | null
          nightSquad: number | null
        }
        Insert: {
            id: string
            name: string
            role: string
            contract?: string | null
            teamIds?: string[] | null
            phone?: string | null
            email?: string | null
            password?: string | null
            hasLaw104?: boolean | null
            specialRules?: string | null
            unavailableShiftCodes?: string[] | null
            nightSquad?: number | null
        }
        Update: {
            id?: string
            name?: string
            role?: string
            contract?: string | null
            teamIds?: string[] | null
            phone?: string | null
            email?: string | null
            password?: string | null
            hasLaw104?: boolean | null
            specialRules?: string | null
            unavailableShiftCodes?: string[] | null
            nightSquad?: number | null
        }
        Relationships: []
      }
      shift_definitions: {
        Row: {
          code: string
          description: string
          location: string | null
          time: string
          color: string | null
          textColor: string | null
          roles: string[] | null
        }
        Insert: {
          code: string
          description: string
          location?: string | null
          time: string
          color?: string | null
          textColor?: string | null
          roles?: string[] | null
        }
        Update: {
          code?: string
          description?: string
          location?: string | null
          time?: string
          color?: string | null
          textColor?: string | null
          roles?: string[] | null
        }
        Relationships: []
      }
      scheduled_shifts: {
        Row: {
          id: string
          staffId: string | null
          date: string
          shiftCode: string | null
          originalStaffId: string | null
        }
        Insert: {
          id: string
          staffId?: string | null
          date: string
          shiftCode?: string | null
          originalStaffId?: string | null
        }
        Update: {
          id?: string
          staffId?: string | null
          date?: string
          shiftCode?: string | null
          originalStaffId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_shifts_staffId_fkey"
            columns: ["staffId"]
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_shifts_originalStaffId_fkey"
            columns: ["originalStaffId"]
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_shifts_shiftCode_fkey"
            columns: ["shiftCode"]
            referencedRelation: "shift_definitions"
            referencedColumns: ["code"]
          }
        ]
      }
      absences: {
        Row: {
          id: string
          staffId: string | null
          reason: string
          startDate: string
          endDate: string
        }
        Insert: {
          id: string
          staffId?: string | null
          reason: string
          startDate: string
          endDate: string
        }
        Update: {
          id?: string
          staffId?: string | null
          reason?: string
          startDate?: string
          endDate?: string
        }
        Relationships: [
          {
            foreignKeyName: "absences_staffId_fkey"
            columns: ["staffId"]
            referencedRelation: "staff"
            referencedColumns: ["id"]
          }
        ]
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

export type PublicSchema = Database['public']

// Helper generic types
export type Tables<
  Name extends keyof PublicSchema['Tables']
> = PublicSchema['Tables'][Name]['Row'];

export type TablesInsert<
  Name extends keyof PublicSchema['Tables']
> = PublicSchema['Tables'][Name]['Insert'];

export type TablesUpdate<
  Name extends keyof PublicSchema['Tables']
> = PublicSchema['Tables'][Name]['Update'];

export type TeamRow = Tables<'teams'>
export type StaffRow = Tables<'staff'>
export type ShiftDefinitionRow = Tables<'shift_definitions'>
export type ScheduledShiftRow = Tables<'scheduled_shifts'>
export type AbsenceRow = Tables<'absences'>
