-- Migration 020: Fix equipment permissions and RLS policies
-- Add UPDATE and DELETE policies for equipment and maintenance history

-- ─────────────────────────────────────────────────────────────────────────────
-- Grant UPDATE and DELETE permissions to insight_user
-- ─────────────────────────────────────────────────────────────────────────────
GRANT UPDATE, DELETE ON insight.equipment TO insight_user;
GRANT UPDATE, DELETE ON insight.equipment_maintenance_history TO insight_user;

-- ─────────────────────────────────────────────────────────────────────────────
-- Add UPDATE policy for equipment (users can update their company's equipment)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'insight' 
    AND tablename = 'equipment' 
    AND policyname = 'equipment_user_update_own_company'
  ) THEN
    CREATE POLICY equipment_user_update_own_company ON insight.equipment
      FOR UPDATE
      TO insight_user
      USING (
        owner_company_id IN (
          SELECT company_id
          FROM insight.company_users
          WHERE user_id = (current_setting('request.jwt.claim.sub', true)::bigint)
        )
      )
      WITH CHECK (
        owner_company_id IN (
          SELECT company_id
          FROM insight.company_users
          WHERE user_id = (current_setting('request.jwt.claim.sub', true)::bigint)
        )
      );
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Add DELETE policy for equipment (users can delete their company's equipment)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'insight' 
    AND tablename = 'equipment' 
    AND policyname = 'equipment_user_delete_own_company'
  ) THEN
    CREATE POLICY equipment_user_delete_own_company ON insight.equipment
      FOR DELETE
      TO insight_user
      USING (
        owner_company_id IN (
          SELECT company_id
          FROM insight.company_users
          WHERE user_id = (current_setting('request.jwt.claim.sub', true)::bigint)
        )
      );
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Add UPDATE policy for equipment_maintenance_history
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'insight' 
    AND tablename = 'equipment_maintenance_history' 
    AND policyname = 'equipment_maintenance_history_user_update'
  ) THEN
    CREATE POLICY equipment_maintenance_history_user_update ON insight.equipment_maintenance_history
      FOR UPDATE
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
      )
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
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Add DELETE policy for equipment_maintenance_history
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'insight' 
    AND tablename = 'equipment_maintenance_history' 
    AND policyname = 'equipment_maintenance_history_user_delete'
  ) THEN
    CREATE POLICY equipment_maintenance_history_user_delete ON insight.equipment_maintenance_history
      FOR DELETE
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
  END IF;
END $$;
