-- Migration 016: Add RLS policies for equipment table

-- Enable RLS on equipment table
ALTER TABLE insight.equipment ENABLE ROW LEVEL SECURITY;

-- Policy for insight_admin: see all equipment
CREATE POLICY equipment_admin_all ON insight.equipment
  FOR ALL
  TO insight_admin
  USING (TRUE)
  WITH CHECK (TRUE);

-- Policy for insight_user (includes client_admin and client_technician):
-- Users can only see equipment owned by their own company
CREATE POLICY equipment_user_own_company ON insight.equipment
  FOR SELECT
  TO insight_user
  USING (
    owner_company_id IN (
      SELECT company_id
      FROM insight.company_users
      WHERE user_id = (current_setting('request.jwt.claim.sub', true)::bigint)
    )
  );

-- Policy for insight_user to insert equipment into their own company
CREATE POLICY equipment_user_insert_own_company ON insight.equipment
  FOR INSERT
  TO insight_user
  WITH CHECK (
    owner_user_id = (current_setting('request.jwt.claim.sub', true)::bigint)
    AND owner_company_id IN (
      SELECT company_id
      FROM insight.company_users
      WHERE user_id = (current_setting('request.jwt.claim.sub', true)::bigint)
    )
  );

-- Enable RLS on equipment_maintenance_history table
ALTER TABLE insight.equipment_maintenance_history ENABLE ROW LEVEL SECURITY;

-- Admin can see all maintenance history
CREATE POLICY equipment_maintenance_history_admin_all ON insight.equipment_maintenance_history
  FOR ALL
  TO insight_admin
  USING (TRUE)
  WITH CHECK (TRUE);

-- Policy for insight_user: only see maintenance history for equipment in their company
CREATE POLICY equipment_maintenance_history_user_own_company ON insight.equipment_maintenance_history
  FOR SELECT
  TO insight_user
  USING (
    equipment_id IN (
      SELECT id
      FROM insight.equipment e
      WHERE e.owner_company_id IN (
        SELECT company_id
        FROM insight.company_users
        WHERE user_id = (current_setting('request.jwt.claim.sub', true)::bigint)
      )
    )
  );

-- Allow users to insert maintenance history for their company's equipment
CREATE POLICY equipment_maintenance_history_user_insert ON insight.equipment_maintenance_history
  FOR INSERT
  TO insight_user
  WITH CHECK (
    equipment_id IN (
      SELECT id
      FROM insight.equipment e
      WHERE e.owner_company_id IN (
        SELECT company_id
        FROM insight.company_users
        WHERE user_id = (current_setting('request.jwt.claim.sub', true)::bigint)
      )
    )
  );
