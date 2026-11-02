-- Migration 036: Web Push subscriptions + a tiny idempotency marker for the
-- daily birthday-notification run.
--
-- A subscription belongs to exactly one user_id. The same physical device/
-- browser can hold one row per account that has ever subscribed from it
-- (unique on user_id+endpoint, not endpoint alone) so one shared device used
-- by multiple accounts gets a separate, correctly-addressed notification per
-- account rather than leaking one account's data into another's.

CREATE TABLE IF NOT EXISTS insight.push_subscriptions (
  id          BIGSERIAL   PRIMARY KEY,
  user_id     BIGINT      NOT NULL REFERENCES insight.users (id) ON DELETE CASCADE,
  endpoint    TEXT        NOT NULL,
  p256dh      TEXT        NOT NULL,
  auth        TEXT        NOT NULL,
  user_agent  TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON insight.push_subscriptions (user_id);

ALTER TABLE insight.push_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON insight.push_subscriptions FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON insight.push_subscriptions TO insight_admin;
GRANT USAGE, SELECT ON SEQUENCE insight.push_subscriptions_id_seq TO insight_admin;

-- One row per calendar date the daily birthday-push job has already run for,
-- so a container restart mid-day can't double-send.
CREATE TABLE IF NOT EXISTS insight.notification_runs (
  run_date DATE        NOT NULL,
  kind     TEXT        NOT NULL,
  ran_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (run_date, kind)
);

REVOKE ALL ON insight.notification_runs FROM PUBLIC;
GRANT SELECT, INSERT ON insight.notification_runs TO insight_admin;
