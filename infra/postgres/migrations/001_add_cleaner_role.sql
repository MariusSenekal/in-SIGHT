-- Migration 001: Add 'cleaner' role and completion timestamp columns
-- Run this against existing deployments that were initialised before this change.
-- Safe to run multiple times (uses IF NOT EXISTS / exception guards).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Extend the user_role enum with 'cleaner'
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'insight.user_role'::regtype
      AND enumlabel = 'cleaner'
  ) THEN
    ALTER TYPE insight.user_role ADD VALUE 'cleaner';
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Add completion timestamp columns to service_entries
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'insight'
      AND table_name   = 'service_entries'
      AND column_name  = 'check_completed_at'
  ) THEN
    ALTER TABLE insight.service_entries
      ADD COLUMN check_completed_at    TIMESTAMPTZ,
      ADD COLUMN cleaning_completed_at TIMESTAMPTZ;
  END IF;
END;
$$;
