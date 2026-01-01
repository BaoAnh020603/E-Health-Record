-- 005_update_share_tokens_schema.sql
-- Update share_tokens table to include profile_data and medical_records columns

BEGIN;

-- Add missing columns to share_tokens table
ALTER TABLE public.share_tokens 
ADD COLUMN IF NOT EXISTS profile_data JSONB,
ADD COLUMN IF NOT EXISTS medical_records JSONB;

-- Update the existing record_ids column to be optional since we're now storing full data
ALTER TABLE public.share_tokens 
ALTER COLUMN record_ids DROP NOT NULL;

-- Create indexes for the new JSONB columns for better performance
CREATE INDEX IF NOT EXISTS idx_share_tokens_profile_data ON public.share_tokens USING GIN (profile_data);
CREATE INDEX IF NOT EXISTS idx_share_tokens_medical_records ON public.share_tokens USING GIN (medical_records);

COMMIT;