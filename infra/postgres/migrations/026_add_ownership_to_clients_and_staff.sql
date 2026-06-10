-- Migration 026: Add explicit ownership fields to clients/staff tables
-- This aligns visibility rules with records/vehicles/equipment ownership.

-- ─────────────────────────────────────────────────────────────────────────────
-- clients ownership columns
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE insight.clients
  ADD COLUMN IF NOT EXISTS owner_user_id BIGINT REFERENCES insight.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS owner_company_id BIGINT REFERENCES insight.companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clients_owner_user_id ON insight.clients (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_clients_owner_company_id ON insight.clients (owner_company_id);

-- Best-effort backfill by matching company names.
UPDATE insight.clients c
SET owner_company_id = co.id
FROM insight.companies co
WHERE c.owner_company_id IS NULL
  AND lower(trim(c.company_name)) = lower(trim(co.name));

-- ─────────────────────────────────────────────────────────────────────────────
-- staff_members ownership columns
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE insight.staff_members
  ADD COLUMN IF NOT EXISTS owner_user_id BIGINT REFERENCES insight.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS owner_company_id BIGINT REFERENCES insight.companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_staff_members_owner_user_id ON insight.staff_members (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_owner_company_id ON insight.staff_members (owner_company_id);

-- Best-effort backfill by matching team allocations to company names.
UPDATE insight.staff_members s
SET owner_company_id = co.id
FROM insight.companies co
WHERE s.owner_company_id IS NULL
  AND lower(trim(s.team_allocation)) = lower(trim(co.name));