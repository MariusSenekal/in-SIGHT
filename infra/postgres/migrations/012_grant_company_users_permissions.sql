-- Migration 012: Grant permissions on company_users table
-- This allows users to query their own company memberships

-- Grant SELECT on company_users to roles that need to check company membership
GRANT SELECT ON TABLE insight.company_users TO insight_user;
GRANT SELECT ON TABLE insight.company_users TO insight_staff;
GRANT SELECT ON TABLE insight.company_users TO insight_admin;

-- Grant usage on the sequence
GRANT USAGE, SELECT ON SEQUENCE insight.company_users_id_seq TO insight_user;
GRANT USAGE, SELECT ON SEQUENCE insight.company_users_id_seq TO insight_staff;
GRANT USAGE, SELECT ON SEQUENCE insight.company_users_id_seq TO insight_admin;
