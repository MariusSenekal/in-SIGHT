-- Migration 017: Grant permissions for equipment tables

-- Grant permissions for equipment table
GRANT SELECT, INSERT, UPDATE, DELETE ON insight.equipment TO insight_admin;
GRANT SELECT, INSERT ON insight.equipment TO insight_user;
GRANT USAGE, SELECT ON SEQUENCE insight.equipment_id_seq TO insight_admin, insight_user;

-- Grant permissions for equipment_maintenance_history table
GRANT SELECT, INSERT, UPDATE, DELETE ON insight.equipment_maintenance_history TO insight_admin;
GRANT SELECT, INSERT ON insight.equipment_maintenance_history TO insight_user;
GRANT USAGE, SELECT ON SEQUENCE insight.equipment_maintenance_history_id_seq TO insight_admin, insight_user;

-- Grant execute on equipment code generation function
GRANT EXECUTE ON FUNCTION insight.generate_equipment_code() TO insight_admin, insight_user;
