-- Migration 013: Add service_datetime column to vehicle_service_history
-- Allows tracking both date and time of service completion

-- ─────────────────────────────────────────────────────────────────────────────
-- Add service_datetime column to vehicle_service_history table
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE insight.vehicle_service_history 
  ADD COLUMN IF NOT EXISTS service_datetime TIMESTAMPTZ;

-- Migrate existing service_date data to service_datetime (set time to noon)
UPDATE insight.vehicle_service_history 
SET service_datetime = service_date::timestamp + interval '12 hours'
WHERE service_datetime IS NULL AND service_date IS NOT NULL;

-- Set default for service_datetime to NOW()
ALTER TABLE insight.vehicle_service_history 
  ALTER COLUMN service_datetime SET DEFAULT NOW();

-- Add index on service_datetime for efficient querying
CREATE INDEX IF NOT EXISTS idx_vehicle_service_history_datetime 
  ON insight.vehicle_service_history (service_datetime);

-- Add repair_completed column for clearer description of what was done
ALTER TABLE insight.vehicle_service_history 
  ADD COLUMN IF NOT EXISTS repair_completed TEXT NOT NULL DEFAULT '';

-- Migrate existing description/service_type data to repair_completed if empty
UPDATE insight.vehicle_service_history 
SET repair_completed = COALESCE(service_type || ' - ' || NULLIF(description, ''), service_type, description)
WHERE repair_completed = '' OR repair_completed IS NULL;
