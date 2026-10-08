-- 033_add_user_sessions.sql
-- Server-side login sessions. Each login creates one row; the browser only
-- holds an opaque random session id in an HttpOnly cookie, and the server
-- stores its SHA-256 hash here. Every API request is validated against this
-- table, so sessions are per user, per device, and revocable.

CREATE TABLE IF NOT EXISTS insight.user_sessions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       BIGINT      NOT NULL REFERENCES insight.users (id) ON DELETE CASCADE,
  token_hash    TEXT        NOT NULL UNIQUE,
  user_agent    TEXT        NOT NULL DEFAULT '',
  ip_address    TEXT        NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id    ON insight.user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON insight.user_sessions (expires_at);

-- Only the Nuxt server (via the insight_admin role) touches sessions.
ALTER TABLE insight.user_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON insight.user_sessions FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON insight.user_sessions TO insight_admin;

-- End every session of a user who is deactivated.
CREATE OR REPLACE FUNCTION insight.trg_revoke_sessions_on_deactivate()
  RETURNS TRIGGER LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = insight, public
AS $$
BEGIN
  IF NEW.is_active = FALSE AND OLD.is_active = TRUE THEN
    UPDATE insight.user_sessions
       SET revoked_at = NOW()
     WHERE user_id = NEW.id AND revoked_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_revoke_sessions ON insight.users;
CREATE TRIGGER trg_users_revoke_sessions
  AFTER UPDATE OF is_active ON insight.users
  FOR EACH ROW EXECUTE FUNCTION insight.trg_revoke_sessions_on_deactivate();

-- Housekeeping: drop sessions that ended more than 30 days ago (hourly).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'purge_user_sessions';
    PERFORM cron.schedule(
      'purge_user_sessions',
      '17 * * * *',
      $job$DELETE FROM insight.user_sessions
           WHERE COALESCE(revoked_at, expires_at) < NOW() - INTERVAL '30 days'$job$
    );
  END IF;
END;
$$;
