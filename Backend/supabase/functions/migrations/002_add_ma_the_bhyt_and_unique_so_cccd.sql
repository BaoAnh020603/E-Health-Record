-- 002_add_ma_the_bhyt_and_unique_so_cccd.sql
-- Adds `ma_the_bhyt` column to `users_profile` and ensures `so_cccd` is unique (when not null).
-- Idempotent: safe to run multiple times.

BEGIN;

-- Add BHYT card column if it doesn't exist
ALTER TABLE IF EXISTS public.users_profile
ADD COLUMN IF NOT EXISTS ma_the_bhyt TEXT;

-- Ensure there is a unique index on so_cccd (only for non-null values)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_users_profile_so_cccd_unique'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX idx_users_profile_so_cccd_unique ON public.users_profile(so_cccd) WHERE so_cccd IS NOT NULL';
  END IF;
END$$;

COMMIT;

-- Notes:
-- - This migration adds a nullable text column `ma_the_bhyt` so existing records are unaffected.
-- - The unique index enforces that two users cannot share the same `so_cccd` value (when provided).
