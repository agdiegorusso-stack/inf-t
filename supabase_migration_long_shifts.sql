-- Migration script to add long shift management fields to the staff table

-- Add new columns to the staff table
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS available_for_long_shifts BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS max_long_shifts_per_month INTEGER DEFAULT 1;

-- Update existing staff records with default values
UPDATE staff 
SET available_for_long_shifts = true,
    max_long_shifts_per_month = CASE 
        WHEN contract = 'h24' THEN 3
        WHEN contract = 'h12' THEN 1
        ELSE 0
    END
WHERE available_for_long_shifts IS NULL OR max_long_shifts_per_month IS NULL;

-- Add comments to describe the new columns
COMMENT ON COLUMN staff.available_for_long_shifts IS 'Indicates if the staff member is available for long shifts (Ps, etc.)';
COMMENT ON COLUMN staff.max_long_shifts_per_month IS 'Maximum number of long shifts allowed per month (0-3)';