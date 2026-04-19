-- 02_roles.sql
-- Create all PostgreSQL roles used by the insight application.
-- insight_owner (the POSTGRES_USER) is already the superuser for this DB.

-- ─────────────────────────────────────────────────────────────────────────────
-- Anonymous role – PostgREST uses this for unauthenticated requests.
-- No logins, no grants on business tables; can only call the authenticate RPC.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE;
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- insight_user – regular authenticated users (clients/site personnel)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'insight_user') THEN
    CREATE ROLE insight_user NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE;
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- insight_staff – staff members (cleaners, supervisors)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'insight_staff') THEN
    CREATE ROLE insight_staff NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE;
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- insight_admin – full application administration; bypasses RLS.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'insight_admin') THEN
    CREATE ROLE insight_admin NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE BYPASSRLS;
  END IF;
END;
$$;

-- BYPASSRLS so admins always see all rows regardless of policies.
ALTER ROLE insight_admin BYPASSRLS;

-- ─────────────────────────────────────────────────────────────────────────────
-- insight_authenticator – the single LOGIN role PostgREST connects as.
-- It can switch into any of the application roles via SET ROLE.
-- Password is injected from the AUTHENTICATOR_PASSWORD env var at init time.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'insight_authenticator') THEN
    -- Password placeholder; the deploy script replaces this before applying.
    CREATE ROLE insight_authenticator
      NOINHERIT
      LOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      PASSWORD 'PLACEHOLDER_REPLACED_BY_DEPLOY';
  END IF;
END;
$$;

-- Allow the authenticator to switch into every application role.
GRANT anon          TO insight_authenticator;
GRANT insight_user  TO insight_authenticator;
GRANT insight_staff TO insight_authenticator;
GRANT insight_admin TO insight_authenticator;
