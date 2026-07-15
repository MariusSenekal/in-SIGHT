-- 031_grant_rls_helper_functions.sql
-- Ensure roles used by PostgREST can execute helper functions referenced by RLS policies.

GRANT EXECUTE ON FUNCTION insight.current_user_id() TO insight_user;
GRANT EXECUTE ON FUNCTION insight.current_user_role() TO insight_user;
GRANT EXECUTE ON FUNCTION insight.current_user_id() TO insight_staff;
GRANT EXECUTE ON FUNCTION insight.current_user_role() TO insight_staff;
