-- Migration 007: Add geolocation tracking to service_entries
-- Store latitude and longitude for UV Hero completion actions.
-- Safe to run multiple times (uses IF NOT EXISTS guard).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'insight'
      AND table_name   = 'service_entries'
      AND column_name  = 'latitude'
  ) THEN
    ALTER TABLE insight.service_entries
      ADD COLUMN latitude  DECIMAL(10, 8),
      ADD COLUMN longitude DECIMAL(11, 8);
    
    RAISE NOTICE 'Added latitude and longitude columns to service_entries';
  ELSE
    RAISE NOTICE 'Latitude and longitude columns already exist in service_entries, skipping';
  END IF;
END;
$$;
