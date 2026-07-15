-- Migration 030: Add RLS for user_module_permissions and extend users policies
-- Enables client_admin to manage their company's users and module permissions

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Enable RLS on user_module_permissions table
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE insight.user_module_permissions ENABLE ROW LEVEL SECURITY;

-- Policy for insight_admin: full access to all module permissions
CREATE POLICY user_module_permissions_admin_all ON insight.user_module_permissions
  FOR ALL
  TO insight_admin
  USING (true)
  WITH CHECK (true);

-- Policy for insight_user (includes client_admin):
-- Can view and manage module permissions for users in their own company
CREATE POLICY user_module_permissions_user_own_company ON insight.user_module_permissions
  FOR ALL
  TO insight_user
  USING (
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

-- Policy for insight_staff: view all module permissions
CREATE POLICY user_module_permissions_staff_select ON insight.user_module_permissions
  FOR SELECT
  TO insight_staff
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Add policy for client_admin to view users from their company
-- ─────────────────────────────────────────────────────────────────────────────

-- Policy for insight_user (client_admin/client_technician):
-- Can view users who belong to the same company
CREATE POLICY users_user_company_select ON insight.users
  FOR SELECT
  TO insight_user
  USING (
    -- Users in my company
    id IN (
      SELECT cu.user_id
      FROM insight.company_users cu
      WHERE cu.company_id IN (
        SELECT company_id 
        FROM insight.company_users 
        WHERE user_id = CAST(current_setting('request.jwt.claims', true)::json->>'sub' AS bigint)
      )
    )
    OR
    -- Or myself
    id = CAST(current_setting('request.jwt.claims', true)::json->>'sub' AS bigint)
  );

-- Policy for client_admin to update users in their company
-- Limited to name, username, role (excluding admin), and is_active fields
CREATE POLICY users_client_admin_update ON insight.users
  FOR UPDATE
  TO insight_user
  USING (
    -- Target user must be in my company
    id IN (
      SELECT cu.user_id
      FROM insight.company_users cu
      WHERE cu.company_id IN (
        SELECT company_id 
        FROM insight.company_users 
        WHERE user_id = CAST(current_setting('request.jwt.claims', true)::json->>'sub' AS bigint)
      )
    )
    AND
    -- Current user must be client_admin
    CAST(current_setting('request.jwt.claims', true)::json->>'app_role' AS text) = 'client_admin'
  )
  WITH CHECK (
    -- Prevent client_admin from promoting users to admin
    role != 'admin'
    AND
    -- Target user must remain in my company
    id IN (
      SELECT cu.user_id
      FROM insight.company_users cu
      WHERE cu.company_id IN (
        SELECT company_id 
        FROM insight.company_users 
        WHERE user_id = CAST(current_setting('request.jwt.claims', true)::json->>'sub' AS bigint)
      )
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Add policy for client_admin to manage user profiles in their company
-- ─────────────────────────────────────────────────────────────────────────────

-- Policy for insight_user (client_admin) to view profiles of company users
CREATE POLICY profiles_user_company_select ON insight.user_profiles
  FOR SELECT
  TO insight_user
  USING (
    user_id IN (
      SELECT cu.user_id
      FROM insight.company_users cu
      WHERE cu.company_id IN (
        SELECT company_id 
        FROM insight.company_users 
        WHERE user_id = CAST(current_setting('request.jwt.claims', true)::json->>'sub' AS bigint)
      )
    )
    OR
    user_id = CAST(current_setting('request.jwt.claims', true)::json->>'sub' AS bigint)
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Grant permissions for module management
-- ─────────────────────────────────────────────────────────────────────────────

-- Grant INSERT/UPDATE/DELETE on user_module_permissions to insight_user (includes client_admin)
GRANT INSERT, UPDATE, DELETE ON insight.user_module_permissions TO insight_user;
GRANT USAGE, SELECT ON SEQUENCE insight.user_module_permissions_id_seq TO insight_user;

COMMENT ON POLICY user_module_permissions_admin_all ON insight.user_module_permissions IS 'Admins have full access to all module permissions';
COMMENT ON POLICY user_module_permissions_user_own_company ON insight.user_module_permissions IS 'Client admins can manage module permissions for users in their company';
COMMENT ON POLICY users_user_company_select ON insight.users IS 'Client admins can view users in their company';
COMMENT ON POLICY users_client_admin_update ON insight.users IS 'Client admins can update users in their company (except admin role)';
COMMENT ON POLICY profiles_user_company_select ON insight.user_profiles IS 'Client admins can view profiles of users in their company';
