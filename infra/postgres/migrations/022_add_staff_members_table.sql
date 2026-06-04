-- Migration 022: Add staff_members table for HR module
-- Stores full staff/employee information

CREATE TABLE IF NOT EXISTS insight.staff_members (
  id                        BIGSERIAL     PRIMARY KEY,
  name                      TEXT          NOT NULL,
  surname                   TEXT          NOT NULL,
  address                   TEXT          NOT NULL DEFAULT '',
  landline_number           TEXT          NOT NULL DEFAULT '',
  email                     TEXT          NOT NULL DEFAULT '',
  mobile_number             TEXT          NOT NULL DEFAULT '',
  id_number                 TEXT          NOT NULL DEFAULT '',
  gender                    TEXT          NOT NULL DEFAULT '',
  next_of_kin               TEXT          NOT NULL DEFAULT '',
  next_of_kin_mobile        TEXT          NOT NULL DEFAULT '',
  date_joined               DATE,
  contract_renewal_date     DATE,
  trax_number               TEXT          NOT NULL DEFAULT '',
  uif_number                TEXT          NOT NULL DEFAULT '',
  role                      TEXT          NOT NULL DEFAULT '',
  team_allocation           TEXT          NOT NULL DEFAULT '',
  salary                    DECIMAL(12,2),
  frequency_paid            TEXT          NOT NULL DEFAULT '',
  additional_information    TEXT          NOT NULL DEFAULT '',
  is_active                 BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_members_name    ON insight.staff_members (name, surname);
CREATE INDEX idx_staff_members_role    ON insight.staff_members (role);
CREATE INDEX idx_staff_members_team    ON insight.staff_members (team_allocation);
CREATE INDEX idx_staff_members_active  ON insight.staff_members (is_active);

CREATE TRIGGER trg_staff_members_updated_at
  BEFORE UPDATE ON insight.staff_members
  FOR EACH ROW EXECUTE FUNCTION insight.set_updated_at();
