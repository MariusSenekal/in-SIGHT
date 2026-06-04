-- Migration 021: Add clients table for Client module
-- Stores full client/company relationship data

CREATE TABLE IF NOT EXISTS insight.clients (
  id                      BIGSERIAL     PRIMARY KEY,
  company_name            TEXT          NOT NULL,
  name                    TEXT          NOT NULL DEFAULT '',
  surname                 TEXT          NOT NULL DEFAULT '',
  address                 TEXT          NOT NULL DEFAULT '',
  email                   TEXT          NOT NULL DEFAULT '',
  industry                TEXT          NOT NULL DEFAULT '',
  relationship_allocation TEXT          NOT NULL DEFAULT '',
  annual_revenue          DECIMAL(15,2),
  special_requirements    TEXT          NOT NULL DEFAULT '',
  last_serviced           DATE,
  company_registration    TEXT          NOT NULL DEFAULT '',
  landline_number         TEXT          NOT NULL DEFAULT '',
  mobile_number           TEXT          NOT NULL DEFAULT '',
  status                  TEXT          NOT NULL DEFAULT 'active',
  service_type            TEXT          NOT NULL DEFAULT '',
  contract_renewal_date   DATE,
  reg_flags_notes         TEXT          NOT NULL DEFAULT '',
  next_service_due        DATE,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_company_name        ON insight.clients (company_name);
CREATE INDEX idx_clients_status              ON insight.clients (status);
CREATE INDEX idx_clients_contract_renewal    ON insight.clients (contract_renewal_date);
CREATE INDEX idx_clients_next_service_due    ON insight.clients (next_service_due);

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON insight.clients
  FOR EACH ROW EXECUTE FUNCTION insight.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: client_service_history
-- Service visit records for each client
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insight.client_service_history (
  id                   BIGSERIAL     PRIMARY KEY,
  client_id            BIGINT        NOT NULL REFERENCES insight.clients (id) ON DELETE CASCADE,
  service_date         DATE          NOT NULL,
  service_time         TIME          NOT NULL,
  service_completed    BOOLEAN       NOT NULL DEFAULT FALSE,
  staff_on_site        TEXT          NOT NULL DEFAULT '',
  additional_info      TEXT          NOT NULL DEFAULT '',
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_service_history_client_id    ON insight.client_service_history (client_id);
CREATE INDEX idx_client_service_history_service_date ON insight.client_service_history (service_date);

CREATE TRIGGER trg_client_service_history_updated_at
  BEFORE UPDATE ON insight.client_service_history
  FOR EACH ROW EXECUTE FUNCTION insight.set_updated_at();
