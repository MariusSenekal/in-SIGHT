-- Migration 039: Add status to vehicles
-- Mirrors insight.clients' status tag (shown top-right on each card) so
-- client admins can mark a vehicle Active, Inactive, or In Maintenance.

ALTER TABLE insight.vehicles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vehicles_status_check'
  ) THEN
    ALTER TABLE insight.vehicles
      ADD CONSTRAINT vehicles_status_check
      CHECK (status IN ('active', 'inactive', 'in_maintenance'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON insight.vehicles (status);
