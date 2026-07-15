-- Migration 029: Add User Module Permissions
-- Allows admins to grant specific module access to client_admin, client_technician, and staff users

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Create module_type enum
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'module_type') THEN
    CREATE TYPE insight.module_type AS ENUM (
      'vehicle',
      'equipment',
      'cleaning',
      'qr-codes',
      'clients',
      'hr'
    );
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Create user_module_permissions table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insight.user_module_permissions (
  id         BIGSERIAL              PRIMARY KEY,
  user_id    BIGINT                 NOT NULL REFERENCES insight.users (id) ON DELETE CASCADE,
  module     insight.module_type    NOT NULL,
  granted_by BIGINT                 REFERENCES insight.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, module)
);

CREATE INDEX idx_user_module_permissions_user_id ON insight.user_module_permissions (user_id);
CREATE INDEX idx_user_module_permissions_module  ON insight.user_module_permissions (module);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Grant permissions on the new table
-- ─────────────────────────────────────────────────────────────────────────────

-- Admins can manage all module permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON insight.user_module_permissions TO insight_admin;
GRANT USAGE, SELECT ON SEQUENCE insight.user_module_permissions_id_seq TO insight_admin;

-- Client admins can view module permissions (for themselves and their team)
GRANT SELECT ON insight.user_module_permissions TO insight_user;

-- Staff can view their own permissions
GRANT SELECT ON insight.user_module_permissions TO insight_staff;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Add default permissions for client_technician role (Vehicle & Equipment)
-- This ensures all client_technician users have access to these modules by default
-- ─────────────────────────────────────────────────────────────────────────────
-- Note: This will be handled by the application logic when users are created
-- or roles are updated. No seed data needed here.

COMMENT ON TABLE insight.user_module_permissions IS 'Tracks which modules each user has access to. Admins have full access to all modules. Client admins can be granted selective access.';
COMMENT ON COLUMN insight.user_module_permissions.module IS 'The module this user has access to';
COMMENT ON COLUMN insight.user_module_permissions.granted_by IS 'Admin user who granted this permission';
