-- Migration 018: Backfill codes for existing vehicles and equipment
-- This ensures all existing records have unique QR codes

-- Update any vehicles without codes
UPDATE insight.vehicles 
SET code = insight.generate_vehicle_code()
WHERE code IS NULL OR code = '';

-- Update any equipment without codes
UPDATE insight.equipment 
SET code = insight.generate_equipment_code()
WHERE code IS NULL OR code = '';

-- Verify all vehicles have codes
DO $$
DECLARE
  v_missing_codes INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_missing_codes 
  FROM insight.vehicles 
  WHERE code IS NULL OR code = '';
  
  IF v_missing_codes > 0 THEN
    RAISE WARNING 'Found % vehicles without codes after migration', v_missing_codes;
  ELSE
    RAISE NOTICE 'All vehicles have codes';
  END IF;
END $$;

-- Verify all equipment have codes
DO $$
DECLARE
  v_missing_codes INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_missing_codes 
  FROM insight.equipment 
  WHERE code IS NULL OR code = '';
  
  IF v_missing_codes > 0 THEN
    RAISE WARNING 'Found % equipment items without codes after migration', v_missing_codes;
  ELSE
    RAISE NOTICE 'All equipment items have codes';
  END IF;
END $$;
