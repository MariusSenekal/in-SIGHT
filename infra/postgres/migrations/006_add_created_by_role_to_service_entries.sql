-- Migration 006: Add created_by_role column to service_entries
-- This stores the user's role at the time they created the entry,
-- ensuring history shows the correct role even if the user's role changes later.
-- Safe to run multiple times.

DO $$
BEGIN
  -- Add created_by_role column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'insight'
      AND table_name = 'service_entries'
      AND column_name = 'created_by_role'
  ) THEN
    ALTER TABLE insight.service_entries
      ADD COLUMN created_by_role TEXT;
    
    RAISE NOTICE 'Added created_by_role column to service_entries';
  ELSE
    RAISE NOTICE 'Column created_by_role already exists in service_entries, skipping';
  END IF;
END;
$$;
