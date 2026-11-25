-- Migration 040: Per-user notification preferences.
-- Lets each user turn individual reminder types on/off, choose which
-- interval(s) before the date they want to be reminded, and pick what time
-- of day (always interpreted as SAST, UTC+2, no DST) the daily check is
-- allowed to fire for them. Rows are optional -- a user with no row for a
-- given type keeps the previous hardcoded defaults (90/30/1 days, 10:00 SAST).

CREATE TABLE IF NOT EXISTS insight.notification_preferences (
  id              BIGSERIAL   PRIMARY KEY,
  user_id         BIGINT      NOT NULL REFERENCES insight.users (id) ON DELETE CASCADE,
  type            TEXT        NOT NULL, -- 'next_service_due' | 'contract_renewal' | 'birthday'
  enabled         BOOLEAN     NOT NULL DEFAULT TRUE,
  -- Days-before-the-date to remind at, e.g. '{90,30,1}'. Empty array means
  -- "never fire" (distinct from a missing row, which means "use defaults").
  interval_days   SMALLINT[]  NOT NULL DEFAULT '{90,30,1}',
  -- Time of day, always SAST (UTC+2), that the daily check is allowed to
  -- send this type's reminders from.
  send_time_sast  TIME        NOT NULL DEFAULT '10:00',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, type)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON insight.notification_preferences (user_id);

ALTER TABLE insight.notification_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON insight.notification_preferences FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON insight.notification_preferences TO insight_admin;
GRANT USAGE, SELECT ON SEQUENCE insight.notification_preferences_id_seq TO insight_admin;

COMMENT ON TABLE insight.notification_preferences IS 'Per-user, per-type notification settings: on/off, reminder intervals (days before), and send time in SAST.';
COMMENT ON COLUMN insight.notification_preferences.send_time_sast IS 'Time of day in SAST (UTC+2, fixed, no DST) that this reminder type may be sent.';
