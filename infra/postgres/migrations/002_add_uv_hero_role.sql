-- Migration 002: Add 'uv-hero' role
-- Run this against existing deployments that were initialised before this change.
-- Safe to run multiple times (uses exception guard).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'insight.user_role'::regtype
      AND enumlabel = 'uv-hero'
  ) THEN
    ALTER TYPE insight.user_role ADD VALUE 'uv-hero';
  END IF;
END;
$$;
