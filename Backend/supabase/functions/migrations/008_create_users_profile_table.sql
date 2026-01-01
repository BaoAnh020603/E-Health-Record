-- 008_create_users_profile_table.sql
-- Create users_profile table with all necessary columns

BEGIN;

-- Create users_profile table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic information
  ho_ten TEXT,
  so_cccd TEXT,
  ngay_sinh DATE,
  gioi_tinh TEXT CHECK (gioi_tinh IN ('Nam', 'Nữ', 'Khác')),
  
  -- Contact information
  dien_thoai TEXT,
  email TEXT,
  dia_chi TEXT,
  dia_chi_chi_tiet TEXT,
  
  -- Medical information
  nhom_mau TEXT CHECK (nhom_mau IN ('A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  
  -- BHYT information
  ma_the_bhyt TEXT,
  ngay_cap_bhyt DATE,
  ngay_het_han_bhyt DATE,
  noi_dang_ky_kham_benh TEXT,
  
  -- Verification
  cccd_verified BOOLEAN DEFAULT FALSE,
  cccd_verified_at TIMESTAMP WITH TIME ZONE,
  cccd_front_image TEXT,
  cccd_back_image TEXT,
  
  -- Profile
  avatar_url TEXT,
  
  -- System fields
  role TEXT DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
  status TEXT DEFAULT 'pending_verification' CHECK (status IN ('active', 'inactive', 'pending_verification', 'suspended')),
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_bhyt_dates CHECK (
    (ma_the_bhyt IS NULL AND ngay_cap_bhyt IS NULL AND ngay_het_han_bhyt IS NULL) OR
    (ma_the_bhyt IS NOT NULL AND ngay_cap_bhyt IS NOT NULL AND ngay_het_han_bhyt IS NOT NULL AND ngay_cap_bhyt < ngay_het_han_bhyt)
  )
);

-- Enable RLS
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users_profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users_profile;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON public.users_profile
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users_profile
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users_profile
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_profile_so_cccd ON public.users_profile(so_cccd);
CREATE INDEX IF NOT EXISTS idx_users_profile_ma_the_bhyt ON public.users_profile(ma_the_bhyt);
CREATE INDEX IF NOT EXISTS idx_users_profile_updated_at ON public.users_profile(updated_at);
CREATE INDEX IF NOT EXISTS idx_users_profile_role ON public.users_profile(role);
CREATE INDEX IF NOT EXISTS idx_users_profile_status ON public.users_profile(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS users_profile_updated_at ON public.users_profile;
CREATE TRIGGER users_profile_updated_at
  BEFORE UPDATE ON public.users_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

COMMIT;