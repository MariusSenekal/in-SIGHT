-- Migration 014: Add QR code to vehicles table
-- Allows vehicles to have unique QR codes for tracking

-- Add code column to vehicles table
ALTER TABLE insight.vehicles 
  ADD COLUMN IF NOT EXISTS code TEXT;

-- Create a function to generate unique vehicle codes
CREATE OR REPLACE FUNCTION insight.generate_vehicle_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
  v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excludes confusing chars
  v_length INT := 8;
  v_attempts INT := 0;
  v_max_attempts INT := 100;
BEGIN
  LOOP
    -- Generate random code
    v_code := '';
    FOR i IN 1..v_length LOOP
      v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    END LOOP;
    
    -- Add VH prefix for vehicles
    v_code := 'VH-' || v_code;
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM insight.vehicles WHERE code = v_code) INTO v_exists;
    
    IF NOT v_exists THEN
      RETURN v_code;
    END IF;
    
    v_attempts := v_attempts + 1;
    IF v_attempts >= v_max_attempts THEN
      RAISE EXCEPTION 'Unable to generate unique vehicle code after % attempts', v_max_attempts;
    END IF;
  END LOOP;
END;
$$;

-- Generate codes for existing vehicles (if any)
UPDATE insight.vehicles 
SET code = insight.generate_vehicle_code()
WHERE code IS NULL;

-- Make code required and unique
ALTER TABLE insight.vehicles 
  ALTER COLUMN code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_code_unique 
  ON insight.vehicles (code);

-- Add trigger to auto-generate code on INSERT
CREATE OR REPLACE FUNCTION insight.set_vehicle_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.code IS NULL THEN
    NEW.code := insight.generate_vehicle_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_vehicles_set_code
  BEFORE INSERT ON insight.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION insight.set_vehicle_code();
