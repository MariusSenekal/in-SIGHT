-- Migration 038: In-app notifications table for client reminders
-- (next service due, birthday, contract renewal). Rows are inserted
-- server-side (see server/plugins/client-reminders.ts) and read back by the
-- notification bell; push delivery continues to use push_subscriptions
-- separately. All access goes through server-side endpoints using the admin
-- PostgREST token with JS-side ownership checks (same pattern as
-- attachments/clients), so only insight_admin needs write access.

CREATE TABLE IF NOT EXISTS insight.notifications (
  id          BIGSERIAL   PRIMARY KEY,
  user_id     BIGINT      NOT NULL REFERENCES insight.users (id) ON DELETE CASCADE,
  type        TEXT        NOT NULL, -- 'next_service_due' | 'birthday' | 'contract_renewal'
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  link_type   TEXT        NOT NULL DEFAULT 'clients',
  link_id     BIGINT,
  -- De-dupe key so the same client+type+interval never inserts twice, even
  -- if the daily job re-runs after a restart (e.g. "client-42-service-30").
  dedupe_key  TEXT        NOT NULL,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, dedupe_key)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON insight.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON insight.notifications (user_id, read_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON insight.notifications TO insight_admin;
GRANT USAGE, SELECT ON SEQUENCE insight.notifications_id_seq TO insight_admin;

ALTER TABLE insight.notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON insight.notifications FROM PUBLIC;
