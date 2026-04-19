-- 05_rls.sql
-- Row-Level Security policies for every table in the insight schema.
-- insight_admin bypasses RLS (BYPASSRLS set in 02_roles.sql).
-- PostgREST passes the JWT sub claim via request.jwt.claims GUC.

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: extract the authenticated user's ID from the JWT claims.
-- Returns NULL when there is no JWT (anon requests).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION insight.current_user_id()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = insight, public
AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', TRUE)::jsonb ->> 'sub',
    ''
  )::BIGINT;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: extract the authenticated user's role from the JWT claims.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION insight.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = insight, public
AS $$
  SELECT current_setting('request.jwt.claims', TRUE)::jsonb ->> 'role';
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- TABLE: users
-- ═════════════════════════════════════════════════════════════════════════════
ALTER TABLE insight.users ENABLE ROW LEVEL SECURITY;

-- Staff can see all users (for management dashboard).
CREATE POLICY users_staff_select ON insight.users
  FOR SELECT TO insight_staff
  USING (TRUE);

-- Regular users can only see their own row.
CREATE POLICY users_self_select ON insight.users
  FOR SELECT TO insight_user
  USING (id = insight.current_user_id());

-- Users can update only their own non-sensitive fields (name).
-- Password changes go through the change_password() function instead.
CREATE POLICY users_self_update ON insight.users
  FOR UPDATE TO insight_user
  USING  (id = insight.current_user_id())
  WITH CHECK (
    id   = insight.current_user_id()
    -- Prevent self-promotion of role or disabling own account
    AND role      = (SELECT role      FROM insight.users WHERE id = insight.current_user_id())
    AND is_active = TRUE
  );

-- anon: no access to users table at all.

-- ═════════════════════════════════════════════════════════════════════════════
-- TABLE: user_profiles
-- ═════════════════════════════════════════════════════════════════════════════
ALTER TABLE insight.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_staff_select ON insight.user_profiles
  FOR SELECT TO insight_staff
  USING (TRUE);

CREATE POLICY profiles_self_all ON insight.user_profiles
  FOR ALL TO insight_user
  USING  (user_id = insight.current_user_id())
  WITH CHECK (user_id = insight.current_user_id());

-- ═════════════════════════════════════════════════════════════════════════════
-- TABLE: companies
-- ═════════════════════════════════════════════════════════════════════════════
ALTER TABLE insight.companies ENABLE ROW LEVEL SECURITY;

-- Staff can see all companies.
CREATE POLICY companies_staff_select ON insight.companies
  FOR SELECT TO insight_staff
  USING (TRUE);

-- Regular users can see only companies they belong to.
CREATE POLICY companies_user_select ON insight.companies
  FOR SELECT TO insight_user
  USING (
    id IN (
      SELECT company_id FROM insight.company_users
      WHERE user_id = insight.current_user_id()
    )
  );

-- ═════════════════════════════════════════════════════════════════════════════
-- TABLE: company_users
-- ═════════════════════════════════════════════════════════════════════════════
ALTER TABLE insight.company_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_users_staff_select ON insight.company_users
  FOR SELECT TO insight_staff
  USING (TRUE);

CREATE POLICY company_users_self_select ON insight.company_users
  FOR SELECT TO insight_user
  USING (user_id = insight.current_user_id());

-- ═════════════════════════════════════════════════════════════════════════════
-- TABLE: records
-- ═════════════════════════════════════════════════════════════════════════════
ALTER TABLE insight.records ENABLE ROW LEVEL SECURITY;

-- Staff sees all records.
CREATE POLICY records_staff_all ON insight.records
  FOR ALL TO insight_staff
  USING (TRUE)
  WITH CHECK (TRUE);

-- Regular users see records they personally own, OR records owned by their company.
CREATE POLICY records_user_select ON insight.records
  FOR SELECT TO insight_user
  USING (
    owner_user_id = insight.current_user_id()
    OR owner_company_id IN (
      SELECT company_id FROM insight.company_users
      WHERE user_id = insight.current_user_id()
    )
  );

-- anon: no access. (QR scan pages are served via the Nuxt server which uses a
-- privileged server-side PostgREST call, not the anon role.)

-- ═════════════════════════════════════════════════════════════════════════════
-- TABLE: service_requests
-- ═════════════════════════════════════════════════════════════════════════════
ALTER TABLE insight.service_requests ENABLE ROW LEVEL SECURITY;

-- Staff sees and manages all requests.
CREATE POLICY service_requests_staff_all ON insight.service_requests
  FOR ALL TO insight_staff
  USING (TRUE)
  WITH CHECK (TRUE);

-- Users see their own requests and any request linked to their QR records.
CREATE POLICY service_requests_user_select ON insight.service_requests
  FOR SELECT TO insight_user
  USING (
    requested_by_user_id = insight.current_user_id()
    OR record_code IN (
      SELECT code FROM insight.records
      WHERE owner_user_id = insight.current_user_id()
         OR owner_company_id IN (
           SELECT company_id FROM insight.company_users
           WHERE user_id = insight.current_user_id()
         )
    )
  );

-- Users can create requests for their own records (or site-room submissions).
CREATE POLICY service_requests_user_insert ON insight.service_requests
  FOR INSERT TO insight_user
  WITH CHECK (
    requested_by_user_id = insight.current_user_id()
  );

-- ═════════════════════════════════════════════════════════════════════════════
-- TABLE: service_entries
-- ═════════════════════════════════════════════════════════════════════════════
ALTER TABLE insight.service_entries ENABLE ROW LEVEL SECURITY;

-- Staff can create and manage entries.
CREATE POLICY service_entries_staff_all ON insight.service_entries
  FOR ALL TO insight_staff
  USING (TRUE)
  WITH CHECK (TRUE);

-- Users can view entries for their records.
CREATE POLICY service_entries_user_select ON insight.service_entries
  FOR SELECT TO insight_user
  USING (
    record_code IN (
      SELECT code FROM insight.records
      WHERE owner_user_id = insight.current_user_id()
         OR owner_company_id IN (
           SELECT company_id FROM insight.company_users
           WHERE user_id = insight.current_user_id()
         )
    )
  );

-- ═════════════════════════════════════════════════════════════════════════════
-- TABLE: service_tasks
-- ═════════════════════════════════════════════════════════════════════════════
ALTER TABLE insight.service_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_tasks_staff_all ON insight.service_tasks
  FOR ALL TO insight_staff
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY service_tasks_user_select ON insight.service_tasks
  FOR SELECT TO insight_user
  USING (
    service_entry_id IN (
      SELECT e.id FROM insight.service_entries e
      WHERE e.record_code IN (
        SELECT code FROM insight.records
        WHERE owner_user_id = insight.current_user_id()
           OR owner_company_id IN (
             SELECT company_id FROM insight.company_users
             WHERE user_id = insight.current_user_id()
           )
      )
    )
  );

-- ═════════════════════════════════════════════════════════════════════════════
-- TABLE: service_messages
-- ═════════════════════════════════════════════════════════════════════════════
ALTER TABLE insight.service_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_messages_staff_all ON insight.service_messages
  FOR ALL TO insight_staff
  USING (TRUE)
  WITH CHECK (TRUE);

-- Users can read and post messages on entries for their records.
CREATE POLICY service_messages_user_select ON insight.service_messages
  FOR SELECT TO insight_user
  USING (
    service_entry_id IN (
      SELECT e.id FROM insight.service_entries e
      WHERE e.record_code IN (
        SELECT code FROM insight.records
        WHERE owner_user_id = insight.current_user_id()
           OR owner_company_id IN (
             SELECT company_id FROM insight.company_users
             WHERE user_id = insight.current_user_id()
           )
      )
    )
  );

CREATE POLICY service_messages_user_insert ON insight.service_messages
  FOR INSERT TO insight_user
  WITH CHECK (
    from_role = 'site-user'
    AND service_entry_id IN (
      SELECT e.id FROM insight.service_entries e
      WHERE e.record_code IN (
        SELECT code FROM insight.records
        WHERE owner_user_id = insight.current_user_id()
           OR owner_company_id IN (
             SELECT company_id FROM insight.company_users
             WHERE user_id = insight.current_user_id()
           )
      )
    )
  );

-- ═════════════════════════════════════════════════════════════════════════════
-- TABLE: checklist_templates
-- ═════════════════════════════════════════════════════════════════════════════
ALTER TABLE insight.checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY checklist_templates_staff_all ON insight.checklist_templates
  FOR ALL TO insight_staff
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY checklist_templates_user_select ON insight.checklist_templates
  FOR SELECT TO insight_user
  USING (
    record_code IN (
      SELECT code FROM insight.records
      WHERE owner_user_id = insight.current_user_id()
         OR owner_company_id IN (
           SELECT company_id FROM insight.company_users
           WHERE user_id = insight.current_user_id()
         )
    )
  );

-- ═════════════════════════════════════════════════════════════════════════════
-- TABLE: checklist_template_tasks
-- ═════════════════════════════════════════════════════════════════════════════
ALTER TABLE insight.checklist_template_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY clt_tasks_staff_all ON insight.checklist_template_tasks
  FOR ALL TO insight_staff
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY clt_tasks_user_select ON insight.checklist_template_tasks
  FOR SELECT TO insight_user
  USING (
    record_code IN (
      SELECT code FROM insight.records
      WHERE owner_user_id = insight.current_user_id()
         OR owner_company_id IN (
           SELECT company_id FROM insight.company_users
           WHERE user_id = insight.current_user_id()
         )
    )
  );

-- ═════════════════════════════════════════════════════════════════════════════
-- TABLE: revoked_tokens
-- Only the server (via SECURITY DEFINER functions) interacts with this table.
-- No direct role access needed.
-- ═════════════════════════════════════════════════════════════════════════════
ALTER TABLE insight.revoked_tokens ENABLE ROW LEVEL SECURITY;
-- No policies: all roles denied by default. Only SECURITY DEFINER functions access it.
