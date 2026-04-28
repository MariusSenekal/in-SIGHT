-- Migration 005: Grant permissions for service_entry_completion_history table
-- Allows staff/cleaner/uv-hero roles to insert completion history records
-- Safe to run multiple times.

-- Grant insight_admin full access
GRANT ALL ON TABLE insight.service_entry_completion_history TO insight_admin;
GRANT ALL ON SEQUENCE insight.service_entry_completion_history_id_seq TO insight_admin;

-- Grant insight_staff (used by staff, cleaner, uv-hero) INSERT and SELECT
GRANT SELECT, INSERT ON insight.service_entry_completion_history TO insight_staff;
GRANT USAGE, SELECT ON SEQUENCE insight.service_entry_completion_history_id_seq TO insight_staff;

-- Grant insight_user read-only access (can view history but not modify)
GRANT SELECT ON insight.service_entry_completion_history TO insight_user;
