-- Migration 004: Create service_entry_completion_history table
-- This table tracks every button click (completion action) with a timestamp,
-- providing a full audit trail of all task completions by Cleaner and UV Hero users.
-- Safe to run multiple times (uses IF NOT EXISTS guard).

DO $$
BEGIN
  -- Create the completion history table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'insight'
      AND table_name = 'service_entry_completion_history'
  ) THEN
    CREATE TABLE insight.service_entry_completion_history (
      id                BIGSERIAL   PRIMARY KEY,
      service_entry_id  BIGINT      NOT NULL REFERENCES insight.service_entries (id) ON DELETE CASCADE,
      action_type       TEXT        NOT NULL CHECK (action_type IN ('check', 'cleaning', 'uv-check', 'job-started', 'job-completed')),
      completed_at      TIMESTAMPTZ NOT NULL,
      completed_by      BIGINT      REFERENCES insight.users (id) ON DELETE SET NULL,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Create indexes for faster lookups
    CREATE INDEX idx_completion_history_entry_id ON insight.service_entry_completion_history (service_entry_id);
    CREATE INDEX idx_completion_history_action_type ON insight.service_entry_completion_history (action_type);
    CREATE INDEX idx_completion_history_completed_by ON insight.service_entry_completion_history (completed_by);
    CREATE INDEX idx_completion_history_completed_at ON insight.service_entry_completion_history (completed_at);

    RAISE NOTICE 'Created table insight.service_entry_completion_history with indexes';
  ELSE
    RAISE NOTICE 'Table insight.service_entry_completion_history already exists, skipping';
  END IF;
END;
$$;
