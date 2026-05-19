-- Migration 015: Add equipment table with QR codes
-- Supports equipment tracking module for client admins

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: equipment
-- Equipment/asset information tracked by client admins
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insight.equipment (
  id                      BIGSERIAL   PRIMARY KEY,
  code                    TEXT        NOT NULL UNIQUE,
  owner_user_id           BIGINT      NOT NULL REFERENCES insight.users (id) ON DELETE CASCADE,
  owner_company_id        BIGINT      REFERENCES insight.companies (id) ON DELETE SET NULL,
  name                    TEXT        NOT NULL,
  description             TEXT        NOT NULL DEFAULT '',
  category                TEXT        NOT NULL DEFAULT '',
  manufacturer            TEXT        NOT NULL DEFAULT '',
  model_number            TEXT        NOT NULL DEFAULT '',
  serial_number           TEXT        NOT NULL DEFAULT '',
  purchase_date           DATE,
  purchase_cost           DECIMAL(10, 2),
  warranty_expiry         DATE,
  location                TEXT        NOT NULL DEFAULT '',
  status                  TEXT        NOT NULL DEFAULT 'active',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_equipment_owner_user_id    ON insight.equipment (owner_user_id);
CREATE INDEX idx_equipment_owner_company_id ON insight.equipment (owner_company_id);
CREATE INDEX idx_equipment_code             ON insight.equipment (code);
CREATE INDEX idx_equipment_status           ON insight.equipment (status);
CREATE INDEX idx_equipment_category         ON insight.equipment (category);

CREATE TRIGGER trg_equipment_updated_at
  BEFORE UPDATE ON insight.equipment
  FOR EACH ROW EXECUTE FUNCTION insight.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: equipment_maintenance_history
-- Maintenance records for equipment
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insight.equipment_maintenance_history (
  id                BIGSERIAL   PRIMARY KEY,
  equipment_id      BIGINT      NOT NULL REFERENCES insight.equipment (id) ON DELETE CASCADE,
  maintenance_date  TIMESTAMPTZ NOT NULL,
  maintenance_type  TEXT        NOT NULL,
  description       TEXT        NOT NULL DEFAULT '',
  cost              DECIMAL(10, 2),
  performed_by      TEXT        NOT NULL DEFAULT '',
  notes             TEXT        NOT NULL DEFAULT '',
  next_due_date     DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_equipment_maintenance_history_equipment_id ON insight.equipment_maintenance_history (equipment_id);
CREATE INDEX idx_equipment_maintenance_history_date         ON insight.equipment_maintenance_history (maintenance_date);

CREATE TRIGGER trg_equipment_maintenance_history_updated_at
  BEFORE UPDATE ON insight.equipment_maintenance_history
  FOR EACH ROW EXECUTE FUNCTION insight.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Function to generate unique equipment codes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION insight.generate_equipment_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
  v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_length INT := 8;
  v_attempts INT := 0;
  v_max_attempts INT := 100;
BEGIN
  LOOP
    v_code := '';
    FOR i IN 1..v_length LOOP
      v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    END LOOP;
    
    -- Add EQ prefix for equipment
    v_code := 'EQ-' || v_code;
    
    SELECT EXISTS(SELECT 1 FROM insight.equipment WHERE code = v_code) INTO v_exists;
    
    IF NOT v_exists THEN
      RETURN v_code;
    END IF;
    
    v_attempts := v_attempts + 1;
    IF v_attempts >= v_max_attempts THEN
      RAISE EXCEPTION 'Unable to generate unique equipment code after % attempts', v_max_attempts;
    END IF;
  END LOOP;
END;
$$;

-- Add trigger to auto-generate code on INSERT
CREATE OR REPLACE FUNCTION insight.set_equipment_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.code IS NULL THEN
    NEW.code := insight.generate_equipment_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_equipment_set_code
  BEFORE INSERT ON insight.equipment
  FOR EACH ROW
  EXECUTE FUNCTION insight.set_equipment_code();
