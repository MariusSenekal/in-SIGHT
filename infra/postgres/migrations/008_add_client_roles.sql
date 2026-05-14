-- Migration 008: Add Client Admin and Client Technician roles
-- These roles allow clients to access module management and tracking features

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Extend the user_role enum with 'client_admin' and 'client_technician'
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'insight.user_role'::regtype
      AND enumlabel = 'client_admin'
  ) THEN
    ALTER TYPE insight.user_role ADD VALUE 'client_admin';
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'insight.user_role'::regtype
      AND enumlabel = 'client_technician'
  ) THEN
    ALTER TYPE insight.user_role ADD VALUE 'client_technician';
  END IF;
END;
$$;
