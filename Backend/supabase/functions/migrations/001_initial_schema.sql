-- 001_initial_schema.sql
-- Creates the initial schema for the medical records application
-- Includes users_profile table and proper RLS policies

BEGIN;

-- Create users_profile table
CREATE TABLE IF NOT EXISTS public.users_profile (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  ho_ten TEXT NOT NULL DEFAULT '',
  so_cccd TEXT,
  ma_the_bhyt TEXT,
  ngay_sinh DATE,
  gioi_tinh TEXT CHECK (gioi_tinh IN ('Nam', 'Nữ', 'Khác')),
  dien_thoai TEXT,
  email TEXT,
  raw_user_meta_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users_profile
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users_profile
-- Users can only see and modify their own profile
CREATE POLICY "Users can view own profile" ON public.users_profile
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users_profile
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users_profile
  FOR UPDATE USING (auth.uid() = id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_profile_updated_at
  BEFORE UPDATE ON public.users_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create unique index on so_cccd (for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_profile_so_cccd_unique 
  ON public.users_profile(so_cccd) 
  WHERE so_cccd IS NOT NULL;

COMMIT;