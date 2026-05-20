-- Migration 019: Update equipment table for tracking module
-- Aligns equipment with vehicle tracking functionality

-- ─────────────────────────────────────────────────────────────────────────────
-- Update equipment table structure to match vehicle tracking
-- ─────────────────────────────────────────────────────────────────────────────

-- Add make column (required field)
ALTER TABLE insight.equipment 
  ADD COLUMN IF NOT EXISTS make TEXT NOT NULL DEFAULT '';

-- Add model column
ALTER TABLE insight.equipment 
  ADD COLUMN IF NOT EXISTS model TEXT NOT NULL DEFAULT '';

-- Add year column
ALTER TABLE insight.equipment 
  ADD COLUMN IF NOT EXISTS year INT;

-- Add colour column
ALTER TABLE insight.equipment 
  ADD COLUMN IF NOT EXISTS colour TEXT NOT NULL DEFAULT '';

-- Add unit_allocation column
ALTER TABLE insight.equipment 
  ADD COLUMN IF NOT EXISTS unit_allocation TEXT NOT NULL DEFAULT '';

-- Add next_service_due column (date format)
ALTER TABLE insight.equipment 
  ADD COLUMN IF NOT EXISTS next_service_due DATE;

-- Keep the existing notes column for general notes
-- Remove old columns that won't be used in the new structure
-- ALTER TABLE insight.equipment DROP COLUMN IF EXISTS description;
-- ALTER TABLE insight.equipment DROP COLUMN IF EXISTS manufacturer;
-- ALTER TABLE insight.equipment DROP COLUMN IF EXISTS model_number;
-- ALTER TABLE insight.equipment DROP COLUMN IF EXISTS purchase_date;
-- ALTER TABLE insight.equipment DROP COLUMN IF EXISTS purchase_cost;
-- ALTER TABLE insight.equipment DROP COLUMN IF EXISTS warranty_expiry;

-- ─────────────────────────────────────────────────────────────────────────────
-- Update equipment_maintenance_history to match vehicle_service_history
-- ─────────────────────────────────────────────────────────────────────────────

-- Add service_datetime column for date+time tracking
ALTER TABLE insight.equipment_maintenance_history 
  ADD COLUMN IF NOT EXISTS service_datetime TIMESTAMPTZ;

-- Migrate existing maintenance_date data to service_datetime (set time to noon)
UPDATE insight.equipment_maintenance_history 
SET service_datetime = maintenance_date::timestamp
WHERE service_datetime IS NULL AND maintenance_date IS NOT NULL;

-- Set default for service_datetime to NOW()
ALTER TABLE insight.equipment_maintenance_history 
  ALTER COLUMN service_datetime SET DEFAULT NOW();

-- Add index on service_datetime for efficient querying
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_history_datetime 
  ON insight.equipment_maintenance_history (service_datetime);

-- Add repair_completed column for clearer description
ALTER TABLE insight.equipment_maintenance_history 
  ADD COLUMN IF NOT EXISTS repair_completed TEXT NOT NULL DEFAULT '';

-- Migrate existing data to repair_completed if empty
UPDATE insight.equipment_maintenance_history 
SET repair_completed = COALESCE(
  CASE 
    WHEN maintenance_type != '' AND description != '' THEN maintenance_type || ' - ' || description
    WHEN maintenance_type != '' THEN maintenance_type
    ELSE description
  END,
  ''
)
WHERE repair_completed = '' OR repair_completed IS NULL;

-- Add notes column if it doesn't exist (keep existing notes)
-- ALTER TABLE insight.equipment_maintenance_history 
--   ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';

-- Update existing equipment records to populate make from name if empty
UPDATE insight.equipment 
SET make = name
WHERE make = '' OR make IS NULL;

COMMENT ON COLUMN insight.equipment.make IS 'Equipment make/brand (required)';
COMMENT ON COLUMN insight.equipment.model IS 'Equipment model';
COMMENT ON COLUMN insight.equipment.year IS 'Year of manufacture';
COMMENT ON COLUMN insight.equipment.colour IS 'Equipment color';
COMMENT ON COLUMN insight.equipment.unit_allocation IS 'Unit/department allocation';
COMMENT ON COLUMN insight.equipment.next_service_due IS 'Next scheduled service date';
COMMENT ON COLUMN insight.equipment_maintenance_history.service_datetime IS 'Date and time of service completion';
COMMENT ON COLUMN insight.equipment_maintenance_history.repair_completed IS 'Description of repairs/maintenance completed';
