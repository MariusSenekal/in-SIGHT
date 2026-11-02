-- Migration 034: Allow plain "user" role (DB role insight_user) to see their own
-- module permissions even when they are not linked via insight.company_users.
--
-- Migration 030 scoped insight_user's access to user_module_permissions to rows
-- belonging to users sharing a company (for client_admin managing client_technician).
-- A normal "user" role is also mapped to insight_user but is never inserted into
-- company_users, so the subquery matched zero rows and self-reads of their own
-- assigned modules silently returned an empty set (no error, just no modules).

DROP POLICY IF EXISTS user_module_permissions_user_own_company ON insight.user_module_permissions;

CREATE POLICY user_module_permissions_user_own_company ON insight.user_module_permissions
  FOR ALL
  TO insight_user
  USING (
    user_id = CAST(current_setting('request.jwt.claims', true)::json->>'sub' AS bigint)
    OR
    user_id IN (
      SELECT cu.user_id
      FROM insight.company_users cu
      WHERE cu.company_id IN (
        SELECT company_id
        FROM insight.company_users
        WHERE user_id = CAST(current_setting('request.jwt.claims', true)::json->>'sub' AS bigint)
      )
    )
  )
  WITH CHECK (
    user_id = CAST(current_setting('request.jwt.claims', true)::json->>'sub' AS bigint)
    OR
    user_id IN (
      SELECT cu.user_id
      FROM insight.company_users cu
      WHERE cu.company_id IN (
        SELECT company_id
        FROM insight.company_users
        WHERE user_id = CAST(current_setting('request.jwt.claims', true)::json->>'sub' AS bigint)
      )
    )
  );

COMMENT ON POLICY user_module_permissions_user_own_company ON insight.user_module_permissions IS 'Client admins can manage module permissions for users in their company; any insight_user can also always view/manage their own rows';
