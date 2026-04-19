-- 03_schema.sql
-- Create the 'insight' schema and all application tables.

-- ─────────────────────────────────────────────────────────────────────────────
-- Schema
-- ─────────────────────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS insight;

-- Ensure the owner controls the schema; no public access.
REVOKE ALL ON SCHEMA insight FROM PUBLIC;
GRANT USAGE ON SCHEMA insight TO insight_authenticator;
GRANT USAGE ON SCHEMA insight TO anon;
GRANT USAGE ON SCHEMA insight TO insight_user;
GRANT USAGE ON SCHEMA insight TO insight_staff;
GRANT USAGE ON SCHEMA insight TO insight_admin;

-- ─────────────────────────────────────────────────────────────────────────────
-- Enum-like domains (enforced at DB level)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE insight.user_role        AS ENUM ('admin', 'staff', 'user');
CREATE TYPE insight.request_type     AS ENUM ('maintenance', 'cleaning', 'satisfaction');
CREATE TYPE insight.request_target   AS ENUM ('qr', 'site-room');
CREATE TYPE insight.request_status   AS ENUM ('open', 'resolved');
CREATE TYPE insight.satisfaction_val AS ENUM ('happy', 'sad');
CREATE TYPE insight.entry_status     AS ENUM ('Done', 'Incomplete', 'Not Done');
CREATE TYPE insight.message_from     AS ENUM ('admin', 'staff', 'site-user');

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: auto-update 'updated_at' column
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION insight.set_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: users
-- Core account table. Passwords are stored as bcrypt hashes (pgcrypto).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insight.users (
  id           BIGSERIAL              PRIMARY KEY,
  name         TEXT                   NOT NULL,
  username     TEXT                   NOT NULL UNIQUE,
  password_hash TEXT                  NOT NULL,
  role         insight.user_role      NOT NULL DEFAULT 'user',
  is_active    BOOLEAN                NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ            NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_username   ON insight.users (username);
CREATE INDEX idx_users_role       ON insight.users (role);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON insight.users
  FOR EACH ROW EXECUTE FUNCTION insight.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: user_profiles
-- Extended profile data for each user (1-to-1 with users).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insight.user_profiles (
  user_id      BIGINT    PRIMARY KEY
                           REFERENCES insight.users (id) ON DELETE CASCADE,
  display_name TEXT       NOT NULL DEFAULT '',
  phone        TEXT       NOT NULL DEFAULT '',
  location     TEXT       NOT NULL DEFAULT '',
  bio          TEXT       NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON insight.user_profiles
  FOR EACH ROW EXECUTE FUNCTION insight.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: companies
-- Client companies that own QR records and employ users.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insight.companies (
  id         BIGSERIAL   PRIMARY KEY,
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_companies_name ON insight.companies (name);

CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON insight.companies
  FOR EACH ROW EXECUTE FUNCTION insight.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: company_users
-- Many-to-many: which users are linked to which company.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insight.company_users (
  id         BIGSERIAL PRIMARY KEY,
  company_id BIGINT    NOT NULL REFERENCES insight.companies (id) ON DELETE CASCADE,
  user_id    BIGINT    NOT NULL REFERENCES insight.users     (id) ON DELETE CASCADE,
  UNIQUE (company_id, user_id)
);

CREATE INDEX idx_company_users_user_id    ON insight.company_users (user_id);
CREATE INDEX idx_company_users_company_id ON insight.company_users (company_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: records
-- QR-code records representing cleaning stations, cabinets, equipment, etc.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insight.records (
  id               BIGSERIAL  PRIMARY KEY,
  code             TEXT       NOT NULL UNIQUE,        -- e.g. REC-1A7C9D
  name             TEXT       NOT NULL,
  description      TEXT       NOT NULL DEFAULT '',
  type             TEXT       NOT NULL DEFAULT '',    -- 'Cleaning Station', etc.
  location         TEXT       NOT NULL DEFAULT '',
  owner_user_id    BIGINT     REFERENCES insight.users     (id) ON DELETE SET NULL,
  owner_company_id BIGINT     REFERENCES insight.companies (id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_records_code             ON insight.records (code);
CREATE INDEX idx_records_owner_user_id    ON insight.records (owner_user_id);
CREATE INDEX idx_records_owner_company_id ON insight.records (owner_company_id);

CREATE TRIGGER trg_records_updated_at
  BEFORE UPDATE ON insight.records
  FOR EACH ROW EXECUTE FUNCTION insight.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: service_requests
-- Any request submitted via a QR scan or from a site/room.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insight.service_requests (
  id                    BIGSERIAL               PRIMARY KEY,
  request_type          insight.request_type    NOT NULL,
  target_type           insight.request_target  NOT NULL,
  record_code           TEXT,                           -- FK-by-value for convenience
  site_room             TEXT,
  message               TEXT                    NOT NULL DEFAULT '',
  requested_by          TEXT                    NOT NULL,   -- display name (anon-friendly)
  requested_by_user_id  BIGINT                  REFERENCES insight.users (id) ON DELETE SET NULL,
  status                insight.request_status  NOT NULL DEFAULT 'open',
  satisfaction_emoji    insight.satisfaction_val,
  satisfaction_entry_id BIGINT                  REFERENCES insight.service_entries (id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_requests_status      ON insight.service_requests (status);
CREATE INDEX idx_service_requests_record_code ON insight.service_requests (record_code);
CREATE INDEX idx_service_requests_user_id     ON insight.service_requests (requested_by_user_id);

CREATE TRIGGER trg_service_requests_updated_at
  BEFORE UPDATE ON insight.service_requests
  FOR EACH ROW EXECUTE FUNCTION insight.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: service_entries
-- Individual cleaning/service session records tied to a QR record code.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insight.service_entries (
  id          BIGSERIAL           PRIMARY KEY,
  record_code TEXT                NOT NULL,
  start_time  TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  end_time    TIMESTAMPTZ,
  status      insight.entry_status NOT NULL DEFAULT 'Not Done',
  notes       TEXT                 NOT NULL DEFAULT '',
  created_by  BIGINT               REFERENCES insight.users (id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_entries_record_code ON insight.service_entries (record_code);
CREATE INDEX idx_service_entries_status      ON insight.service_entries (status);
CREATE INDEX idx_service_entries_created_by  ON insight.service_entries (created_by);

CREATE TRIGGER trg_service_entries_updated_at
  BEFORE UPDATE ON insight.service_entries
  FOR EACH ROW EXECUTE FUNCTION insight.set_updated_at();

-- Now the FK from service_requests → service_entries is valid; add it.
ALTER TABLE insight.service_requests
  ADD CONSTRAINT fk_satisfaction_entry
  FOREIGN KEY (satisfaction_entry_id)
  REFERENCES insight.service_entries (id)
  ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: service_tasks
-- Checklist items within a service_entry. Auto-generated serial PK.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insight.service_tasks (
  id               BIGSERIAL PRIMARY KEY,
  service_entry_id BIGINT    NOT NULL REFERENCES insight.service_entries (id) ON DELETE CASCADE,
  task             TEXT    NOT NULL,
  completed        BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order       INT     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_tasks_entry_id ON insight.service_tasks (service_entry_id);

CREATE TRIGGER trg_service_tasks_updated_at
  BEFORE UPDATE ON insight.service_tasks
  FOR EACH ROW EXECUTE FUNCTION insight.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: service_messages
-- In-entry thread between admin, staff and the site user.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insight.service_messages (
  id               BIGSERIAL              PRIMARY KEY,
  service_entry_id BIGINT                 NOT NULL REFERENCES insight.service_entries (id) ON DELETE CASCADE,
  from_role        insight.message_from   NOT NULL,
  from_name        TEXT                   NOT NULL,
  text             TEXT                   NOT NULL,
  created_at       TIMESTAMPTZ            NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_messages_entry_id ON insight.service_messages (service_entry_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: checklist_templates
-- Reusable task list assigned to a QR record code.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insight.checklist_templates (
  id          BIGSERIAL   PRIMARY KEY,
  record_code TEXT        NOT NULL UNIQUE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  TEXT        NOT NULL DEFAULT 'System'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: checklist_template_tasks
-- Individual task lines within a checklist template.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insight.checklist_template_tasks (
  id          BIGSERIAL PRIMARY KEY,
  record_code TEXT      NOT NULL REFERENCES insight.checklist_templates (record_code) ON DELETE CASCADE,
  task        TEXT      NOT NULL,
  sort_order  INT       NOT NULL DEFAULT 0
);

CREATE INDEX idx_clt_tasks_record_code ON insight.checklist_template_tasks (record_code);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: revoked_tokens
-- Tracks invalidated JWT IDs so logged-out sessions can't be replayed.
-- Nuxt server API cleans up expired rows periodically.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insight.revoked_tokens (
  id         BIGSERIAL   PRIMARY KEY,
  jti        TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_revoked_tokens_expires_at ON insight.revoked_tokens (expires_at);
