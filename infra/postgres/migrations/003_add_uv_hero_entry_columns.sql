-- Migration 003: Add UV Hero completion columns to service_entries
-- Safe to run multiple times (uses IF NOT EXISTS guard).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'insight'
      AND table_name   = 'service_entries'
      AND column_name  = 'uv_check_completed_at'
  ) THEN
    ALTER TABLE insight.service_entries
      ADD COLUMN uv_check_completed_at TIMESTAMPTZ,
      ADD COLUMN job_started_at        TIMESTAMPTZ,
      ADD COLUMN job_completed_at      TIMESTAMPTZ;
  END IF;
END;
$$;
