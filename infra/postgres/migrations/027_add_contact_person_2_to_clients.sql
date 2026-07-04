-- Migration 027: Add Contact Person 2 fields to clients table
-- Adds fields for a second contact person

ALTER TABLE insight.clients
  ADD COLUMN IF NOT EXISTS contact_person_2_name       TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_person_2_surname    TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_person_2_email      TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_person_2_mobile     TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_person_2_landline   TEXT NOT NULL DEFAULT '';
