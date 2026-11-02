-- Migration 037: Add attachments table for S3-backed photo/document uploads
-- Generic across modules (hr, clients, vehicles, equipment, ...) so any module
-- can attach files to a record without a new table. Files themselves live in
-- S3 under Module/<company-or-user>/<record>/<purpose>/<file>; this table only
-- stores the pointer + ownership metadata used for access control.

CREATE TABLE IF NOT EXISTS insight.attachments (
  id                    BIGSERIAL     PRIMARY KEY,
  module                TEXT          NOT NULL,
  record_id             BIGINT        NOT NULL,
  purpose               TEXT          NOT NULL DEFAULT 'general',
  file_name             TEXT          NOT NULL,
  s3_key                TEXT          NOT NULL UNIQUE,
  content_type          TEXT          NOT NULL DEFAULT 'application/octet-stream',
  size_bytes            BIGINT        NOT NULL DEFAULT 0,
  owner_user_id         BIGINT        REFERENCES insight.users (id) ON DELETE SET NULL,
  owner_company_id      BIGINT        REFERENCES insight.companies (id) ON DELETE SET NULL,
  uploaded_by_user_id   BIGINT        REFERENCES insight.users (id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_module_record ON insight.attachments (module, record_id);
CREATE INDEX IF NOT EXISTS idx_attachments_owner_user_id ON insight.attachments (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_owner_company_id ON insight.attachments (owner_company_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- GRANTS
-- All access goes through server-side endpoints using the admin PostgREST
-- token with JS-side ownership checks (same pattern as clients/staff_members),
-- so only insight_admin needs write access; insight_staff gets read access.
-- ─────────────────────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON insight.attachments TO insight_admin;
GRANT USAGE, SELECT ON SEQUENCE insight.attachments_id_seq TO insight_admin;
GRANT SELECT ON insight.attachments TO insight_staff;

ALTER TABLE insight.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY attachments_staff_select ON insight.attachments
  FOR SELECT TO insight_staff
  USING (TRUE);
