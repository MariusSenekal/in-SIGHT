-- 025_enforce_strict_company_record_scope.sql
-- Enforce strict tenant visibility for insight_user:
-- 1) If user is linked to one or more companies, they can only see records from those companies.
-- 2) If user is not linked to any company, they can only see records they personally own.
-- Admin/staff behavior remains unchanged (existing policies for insight_admin/insight_staff).

-- ─────────────────────────────────────────────────────────────────────────────
-- records
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS records_user_select ON insight.records;

CREATE POLICY records_user_select ON insight.records
  FOR SELECT TO insight_user
  USING (
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM insight.company_users cu
        WHERE cu.user_id = insight.current_user_id()
      )
      THEN owner_company_id IN (
        SELECT cu.company_id
        FROM insight.company_users cu
        WHERE cu.user_id = insight.current_user_id()
      )
      ELSE owner_user_id = insight.current_user_id()
    END
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- service_entries
-- Use record visibility as the source of truth.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS service_entries_user_select ON insight.service_entries;

CREATE POLICY service_entries_user_select ON insight.service_entries
  FOR SELECT TO insight_user
  USING (
    record_code IN (
      SELECT r.code
      FROM insight.records r
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- service_tasks
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS service_tasks_user_select ON insight.service_tasks;

CREATE POLICY service_tasks_user_select ON insight.service_tasks
  FOR SELECT TO insight_user
  USING (
    service_entry_id IN (
      SELECT e.id
      FROM insight.service_entries e
      WHERE e.record_code IN (
        SELECT r.code
        FROM insight.records r
      )
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- service_messages
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS service_messages_user_select ON insight.service_messages;

CREATE POLICY service_messages_user_select ON insight.service_messages
  FOR SELECT TO insight_user
  USING (
    service_entry_id IN (
      SELECT e.id
      FROM insight.service_entries e
      WHERE e.record_code IN (
        SELECT r.code
        FROM insight.records r
      )
    )
  );

DROP POLICY IF EXISTS service_messages_user_insert ON insight.service_messages;

CREATE POLICY service_messages_user_insert ON insight.service_messages
  FOR INSERT TO insight_user
  WITH CHECK (
    from_role = 'site-user'
    AND service_entry_id IN (
      SELECT e.id
      FROM insight.service_entries e
      WHERE e.record_code IN (
        SELECT r.code
        FROM insight.records r
      )
    )
  );
