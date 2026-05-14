-- Migration 010: Grant permissions for vehicles tables
-- Allow users to access their own vehicle data

-- ─────────────────────────────────────────────────────────────────────────────
-- Grant SELECT, INSERT, UPDATE on vehicles table
-- ─────────────────────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE ON insight.vehicles TO insight_user;
GRANT SELECT, INSERT, UPDATE ON insight.vehicles TO insight_staff;
GRANT SELECT, INSERT, UPDATE, DELETE ON insight.vehicles TO insight_admin;

-- Grant usage on the vehicles id sequence
GRANT USAGE, SELECT ON SEQUENCE insight.vehicles_id_seq TO insight_user;
GRANT USAGE, SELECT ON SEQUENCE insight.vehicles_id_seq TO insight_staff;
GRANT USAGE, SELECT ON SEQUENCE insight.vehicles_id_seq TO insight_admin;

-- ─────────────────────────────────────────────────────────────────────────────
-- Grant SELECT, INSERT, UPDATE on vehicle_service_history table
-- ─────────────────────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE ON insight.vehicle_service_history TO insight_user;
GRANT SELECT, INSERT, UPDATE ON insight.vehicle_service_history TO insight_staff;
GRANT SELECT, INSERT, UPDATE, DELETE ON insight.vehicle_service_history TO insight_admin;

-- Grant usage on the service history id sequence
GRANT USAGE, SELECT ON SEQUENCE insight.vehicle_service_history_id_seq TO insight_user;
GRANT USAGE, SELECT ON SEQUENCE insight.vehicle_service_history_id_seq TO insight_staff;
GRANT USAGE, SELECT ON SEQUENCE insight.vehicle_service_history_id_seq TO insight_admin;
