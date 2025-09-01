-- Staff table (id as text)
CREATE TABLE staff (
  id text PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL,
  contract text,
  team_ids text[],
  phone text,
  email text,
  password text,
  has_law104 boolean DEFAULT false,
  special_rules text[],
  unavailable_shift_codes text[],
  night_squad boolean DEFAULT false
);

-- Teams table
CREATE TABLE teams (
  id text PRIMARY KEY,
  name text NOT NULL,
  locations text[]
);

-- Shift Definitions table
CREATE TABLE shift_definitions (
  code text PRIMARY KEY,
  name text NOT NULL,
  time text NOT NULL
);

-- Scheduled Shifts table
CREATE TABLE scheduled_shifts (
  id text PRIMARY KEY,
  staff_id text REFERENCES staff(id),
  date date NOT NULL,
  shift_code text REFERENCES shift_definitions(code),
  original_staff_id text
);

-- Absences table
CREATE TABLE absences (
  id text PRIMARY KEY,
  staff_id text REFERENCES staff(id),
  reason text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL
);
