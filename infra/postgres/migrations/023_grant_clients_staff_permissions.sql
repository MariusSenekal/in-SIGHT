-- Migration 023: Grant permissions and RLS for clients and staff_members tables
-- Admin-only access for both tables (insight_admin bypasses RLS)

-- ─────────────────────────────────────────────────────────────────────────────
-- GRANTS: clients
-- ─────────────────────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON insight.clients TO insight_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON insight.client_service_history TO insight_admin;
GRANT USAGE, SELECT ON SEQUENCE insight.clients_id_seq TO insight_admin;
GRANT USAGE, SELECT ON SEQUENCE insight.client_service_history_id_seq TO insight_admin;

-- Staff can read clients
GRANT SELECT ON insight.clients TO insight_staff;
GRANT SELECT ON insight.client_service_history TO insight_staff;

-- ─────────────────────────────────────────────────────────────────────────────
-- GRANTS: staff_members
-- ─────────────────────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON insight.staff_members TO insight_admin;
GRANT USAGE, SELECT ON SEQUENCE insight.staff_members_id_seq TO insight_admin;

-- Staff can read staff_members
GRANT SELECT ON insight.staff_members TO insight_staff;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: clients
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE insight.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY clients_staff_select ON insight.clients
  FOR SELECT TO insight_staff
  USING (TRUE);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: client_service_history
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE insight.client_service_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY client_service_history_staff_select ON insight.client_service_history
  FOR SELECT TO insight_staff
  USING (TRUE);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: staff_members
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE insight.staff_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_members_staff_select ON insight.staff_members
  FOR SELECT TO insight_staff
  USING (TRUE);
