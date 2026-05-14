-- Migration 011: Add Row Level Security for client roles
-- Ensures client admins and technicians only see their own company's data

-- ─────────────────────────────────────────────────────────────────────────────
-- Enable RLS on vehicles table
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE insight.vehicles ENABLE ROW LEVEL SECURITY;

-- Policy for insight_admin: see all vehicles
CREATE POLICY vehicles_admin_all ON insight.vehicles
  FOR ALL
  TO insight_admin
  USING (true)
  WITH CHECK (true);

-- Policy for insight_user (includes client_admin and client_technician):
-- Users can only see vehicles owned by their own company
CREATE POLICY vehicles_user_own_company ON insight.vehicles
  FOR ALL
  TO insight_user
  USING (
    owner_company_id IN (
      SELECT company_id 
      FROM insight.company_users 
      WHERE user_id = CAST(current_setting('request.jwt.claims', true)::json->>'sub' AS bigint)
    )
  )
  WITH CHECK (
    owner_company_id IN (
      SELECT company_id 
      FROM insight.company_users 
      WHERE user_id = CAST(current_setting('request.jwt.claims', true)::json->>'sub' AS bigint)
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Enable RLS on vehicle_service_history table
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE insight.vehicle_service_history ENABLE ROW LEVEL SECURITY;

-- Policy for insight_admin: see all service history
CREATE POLICY vehicle_service_history_admin_all ON insight.vehicle_service_history
  FOR ALL
  TO insight_admin
  USING (true)
  WITH CHECK (true);

-- Policy for insight_user: only see service history for vehicles in their company
CREATE POLICY vehicle_service_history_user_own_company ON insight.vehicle_service_history
  FOR ALL
  TO insight_user
  USING (
    vehicle_id IN (
      SELECT v.id 
      FROM insight.vehicles v
      WHERE v.owner_company_id IN (
        SELECT company_id 
        FROM insight.company_users 
        WHERE user_id = CAST(current_setting('request.jwt.claims', true)::json->>'sub' AS bigint)
      )
    )
  )
  WITH CHECK (
    vehicle_id IN (
      SELECT v.id 
      FROM insight.vehicles v
      WHERE v.owner_company_id IN (
        SELECT company_id 
        FROM insight.company_users 
        WHERE user_id = CAST(current_setting('request.jwt.claims', true)::json->>'sub' AS bigint)
      )
    )
  );
