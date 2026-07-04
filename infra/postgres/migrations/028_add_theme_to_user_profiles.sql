-- Migration 028: Add theme preference to user_profiles
-- Allows users to store their preferred app theme

ALTER TABLE insight.user_profiles 
  ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'arctic';
