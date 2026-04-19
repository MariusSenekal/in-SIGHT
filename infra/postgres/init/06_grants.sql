-- 06_grants.sql
-- Grant privileges to each role on tables and functions.
-- insight_owner (the DB superuser) already has full access.

-- ─────────────────────────────────────────────────────────────────────────────
-- REVOKE defaults – start from a clean slate
-- ─────────────────────────────────────────────────────────────────────────────
REVOKE ALL ON ALL TABLES    IN SCHEMA insight FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA insight FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA insight FROM PUBLIC;

-- ─────────────────────────────────────────────────────────────────────────────
-- insight_admin – full DML on every table and sequence
-- ─────────────────────────────────────────────────────────────────────────────
GRANT ALL ON ALL TABLES    IN SCHEMA insight TO insight_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA insight TO insight_admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA insight TO insight_admin;

-- ─────────────────────────────────────────────────────────────────────────────
-- insight_staff – read/write on operational tables; read-only on user accounts
-- ─────────────────────────────────────────────────────────────────────────────

-- Read everything
GRANT SELECT ON ALL TABLES IN SCHEMA insight TO insight_staff;

-- Manage records
GRANT INSERT, UPDATE, DELETE ON insight.records TO insight_staff;
GRANT USAGE, SELECT ON SEQUENCE insight.records_id_seq TO insight_staff;

-- Manage companies and membership
GRANT INSERT, UPDATE, DELETE ON insight.companies    TO insight_staff;
GRANT INSERT, UPDATE, DELETE ON insight.company_users TO insight_staff;
GRANT USAGE, SELECT ON SEQUENCE insight.companies_id_seq TO insight_staff;

-- Create / manage users (but password changes go through the function)
GRANT INSERT, UPDATE, DELETE ON insight.users         TO insight_staff;
GRANT INSERT, UPDATE, DELETE ON insight.user_profiles TO insight_staff;
GRANT USAGE, SELECT ON SEQUENCE insight.users_id_seq TO insight_staff;

-- Manage service operations
GRANT INSERT, UPDATE, DELETE ON insight.service_requests         TO insight_staff;
GRANT INSERT, UPDATE, DELETE ON insight.service_entries          TO insight_staff;
GRANT INSERT, UPDATE, DELETE ON insight.service_tasks            TO insight_staff;
GRANT INSERT, UPDATE, DELETE ON insight.service_messages         TO insight_staff;
GRANT INSERT, UPDATE, DELETE ON insight.checklist_templates      TO insight_staff;
GRANT INSERT, UPDATE, DELETE ON insight.checklist_template_tasks TO insight_staff;

GRANT USAGE, SELECT ON SEQUENCE insight.service_requests_id_seq          TO insight_staff;
GRANT USAGE, SELECT ON SEQUENCE insight.service_entries_id_seq           TO insight_staff;
GRANT USAGE, SELECT ON SEQUENCE insight.service_tasks_id_seq             TO insight_staff;
GRANT USAGE, SELECT ON SEQUENCE insight.service_messages_id_seq          TO insight_staff;
GRANT USAGE, SELECT ON SEQUENCE insight.checklist_templates_id_seq       TO insight_staff;
GRANT USAGE, SELECT ON SEQUENCE insight.checklist_template_tasks_id_seq  TO insight_staff;
GRANT USAGE, SELECT ON SEQUENCE insight.company_users_id_seq             TO insight_staff;

-- Functions
GRANT EXECUTE ON FUNCTION insight.authenticate(TEXT, TEXT)                   TO insight_staff;
GRANT EXECUTE ON FUNCTION insight.change_password(BIGINT, TEXT)              TO insight_staff;
GRANT EXECUTE ON FUNCTION insight.recompute_entry_status(BIGINT)             TO insight_staff;
GRANT EXECUTE ON FUNCTION insight.purge_expired_revoked_tokens()             TO insight_staff;

-- ─────────────────────────────────────────────────────────────────────────────
-- insight_user – access to own data; can create service requests / messages
-- ─────────────────────────────────────────────────────────────────────────────

GRANT SELECT        ON insight.users                     TO insight_user;
GRANT UPDATE        ON insight.users                     TO insight_user;   -- RLS restricts to own row
GRANT SELECT, INSERT, UPDATE
                    ON insight.user_profiles             TO insight_user;

GRANT SELECT        ON insight.companies                 TO insight_user;
GRANT SELECT        ON insight.company_users             TO insight_user;
GRANT SELECT        ON insight.records                   TO insight_user;

GRANT SELECT, INSERT ON insight.service_requests         TO insight_user;
GRANT USAGE, SELECT ON SEQUENCE insight.service_requests_id_seq TO insight_user;

GRANT SELECT        ON insight.service_entries           TO insight_user;
GRANT SELECT        ON insight.service_tasks             TO insight_user;
GRANT SELECT, INSERT ON insight.service_messages         TO insight_user;
GRANT USAGE, SELECT ON SEQUENCE insight.service_messages_id_seq TO insight_user;

GRANT SELECT        ON insight.checklist_templates       TO insight_user;
GRANT SELECT        ON insight.checklist_template_tasks  TO insight_user;

GRANT EXECUTE ON FUNCTION insight.authenticate(TEXT, TEXT) TO insight_user;
GRANT EXECUTE ON FUNCTION insight.change_password(BIGINT, TEXT) TO insight_user;

-- ─────────────────────────────────────────────────────────────────────────────
-- anon – no table access; can only call the authenticate function
-- (QR scan endpoints are handled server-side with insight_staff credentials)
-- ─────────────────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION insight.authenticate(TEXT, TEXT) TO anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- Future tables: ensure roles inherit grants automatically
-- ─────────────────────────────────────────────────────────────────────────────
ALTER DEFAULT PRIVILEGES IN SCHEMA insight
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO insight_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA insight
  GRANT USAGE, SELECT ON SEQUENCES TO insight_admin;
