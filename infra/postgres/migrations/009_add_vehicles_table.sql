-- Migration 009: Add vehicles table and service history tracking
-- Supports vehicle tracking module for client admins

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: vehicles
-- Vehicle information tracked by client admins
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insight.vehicles (
  id                      BIGSERIAL   PRIMARY KEY,
  owner_user_id           BIGINT      NOT NULL REFERENCES insight.users (id) ON DELETE CASCADE,
  owner_company_id        BIGINT      REFERENCES insight.companies (id) ON DELETE SET NULL,
  make                    TEXT        NOT NULL,
  model                   TEXT        NOT NULL,
  year                    INT         NOT NULL,
  colour                  TEXT        NOT NULL DEFAULT '',
  registration_number     TEXT        NOT NULL,
  vin_number              TEXT        NOT NULL DEFAULT '',
  license_disc_renewal    DATE,
  next_service_due_km     INT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_owner_user_id    ON insight.vehicles (owner_user_id);
CREATE INDEX idx_vehicles_owner_company_id ON insight.vehicles (owner_company_id);
CREATE INDEX idx_vehicles_registration     ON insight.vehicles (registration_number);

CREATE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON insight.vehicles
  FOR EACH ROW EXECUTE FUNCTION insight.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: vehicle_service_history
-- Service records for vehicles
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insight.vehicle_service_history (
  id                BIGSERIAL   PRIMARY KEY,
  vehicle_id        BIGINT      NOT NULL REFERENCES insight.vehicles (id) ON DELETE CASCADE,
  service_date      DATE        NOT NULL,
  service_type      TEXT        NOT NULL,
  description       TEXT        NOT NULL DEFAULT '',
  cost              DECIMAL(10, 2),
  odometer_reading  INT,
  performed_by      TEXT        NOT NULL DEFAULT '',
  notes             TEXT        NOT NULL DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicle_service_history_vehicle_id ON insight.vehicle_service_history (vehicle_id);
CREATE INDEX idx_vehicle_service_history_date       ON insight.vehicle_service_history (service_date);

CREATE TRIGGER trg_vehicle_service_history_updated_at
  BEFORE UPDATE ON insight.vehicle_service_history
  FOR EACH ROW EXECUTE FUNCTION insight.set_updated_at();
