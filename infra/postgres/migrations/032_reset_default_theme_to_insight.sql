-- Migration 032: One-time reset of the default theme to the new in-SIGHT brand theme.
--
-- Existing users who never explicitly picked a theme are currently stuck on the
-- old default ("arctic"). Switch them over to "inSight" once. Anyone who has
-- deliberately chosen a theme (including deliberately choosing "arctic" itself,
-- before or after this migration runs) is left alone.
--
-- The deploy script re-applies every file in this directory on every run, so the
-- one-time UPDATE below is guarded by a marker table — it can only ever fire once,
-- even across repeated deploys, and will never stomp on a later user's own choice.

CREATE TABLE IF NOT EXISTS insight._migration_markers (
  key         TEXT PRIMARY KEY,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM insight._migration_markers WHERE key = '032_reset_default_theme_to_insight'
  ) THEN
    UPDATE insight.user_profiles SET theme = 'inSight' WHERE theme = 'arctic';
    INSERT INTO insight._migration_markers (key) VALUES ('032_reset_default_theme_to_insight');
  END IF;
END $$;

-- New rows created directly in the database (bypassing the app's own default) should
-- also land on the new brand theme going forward.
ALTER TABLE insight.user_profiles ALTER COLUMN theme SET DEFAULT 'inSight';
