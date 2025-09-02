/*
Consolidated idempotent migration to align Supabase schema with frontend TypeScript models.

Key goals:
1. Rename snake_case columns to camelCase expected by frontend (staff / shift_definitions / teams).
2. Align data semantics:
   - role: English -> Italian labels (HeadNurse->Caposala, Nurse->Infermiere, Doctor->Medico)
   - contract: uppercase H6/H12/H24 -> lowercase h6/h12/h24
3. Convert staff.specialRules (array) to single text (string) as per TS interface.
4. Convert nightSquad boolean to integer (1..5 or NULL). Here boolean TRUE becomes 1 (can be edited later).
5. Add missing columns on shift_definitions: location, color, textColor.
6. Add teams.allowedShiftCodes.
7. Seed / upsert consistent reference data for teams and shift_definitions using Italian role labels and Tailwind/color values matching constants.ts.
8. Ensure arrays present where required (roles, allowedShiftCodes).
9. Upsert UNASSIGNED staff row.

Safe to run multiple times (uses IF NOT EXISTS / ON CONFLICT).
*/

-- 1. Ensure base tables exist (if a fresh project)
CREATE TABLE IF NOT EXISTS staff (
  id text PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL,
  contract text,
  "teamIds" text[],
  phone text,
  email text,
  password text,
  "hasLaw104" boolean DEFAULT false,
  "specialRules" text,
  "unavailableShiftCodes" text[],
  "nightSquad" integer
);

CREATE TABLE IF NOT EXISTS teams (
  id text PRIMARY KEY,
  name text NOT NULL,
  locations text[],
  "allowedShiftCodes" text[]
);

