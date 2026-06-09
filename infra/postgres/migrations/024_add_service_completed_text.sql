-- Migration 024: Add text description for completed service in client history
ALTER TABLE insight.client_service_history
  ADD COLUMN IF NOT EXISTS service_completed_text TEXT NOT NULL DEFAULT '';

-- Backfill existing completed rows with a default description for better UX
UPDATE insight.client_service_history
SET service_completed_text = 'Completed'
WHERE service_completed = TRUE
  AND COALESCE(service_completed_text, '') = '';
