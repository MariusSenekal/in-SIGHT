-- Migration 035: Add optional date_of_birth to clients and staff_members
-- Birthdays are optional; no backfill, no NOT NULL constraint.

ALTER TABLE insight.clients
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

ALTER TABLE insight.staff_members
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

COMMENT ON COLUMN insight.clients.date_of_birth IS 'Optional date of birth for the primary contact';
COMMENT ON COLUMN insight.staff_members.date_of_birth IS 'Optional date of birth';
