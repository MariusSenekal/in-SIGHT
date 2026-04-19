-- 01_extensions.sql
-- Enable extensions required by the insight schema.
-- Runs as 'insight_owner' (the POSTGRES_USER set in docker-compose).

-- pgcrypto: used for bcrypt password hashing (crypt / gen_salt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- pg_cron: scheduled job runner (shared_preload_libraries must be set in postgres startup command).
-- Installed in the insight_db database; configure jobs via cron.schedule().
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant the insight_owner (superuser) access to the cron schema so it can schedule jobs.
GRANT USAGE ON SCHEMA cron TO insight_owner;
