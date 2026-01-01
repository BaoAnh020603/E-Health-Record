-- 007_check_users_profile_table.sql
-- Ensure users_profile table has all necessary columns and constraints

BEGIN;

-- Add any missing columns to users_profile table
DO $$ 
BEGIN
  -- Check and add missing columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'nhom_mau') THEN
    ALTER TABLE public.users_profile ADD COLUMN nhom_mau TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'ma_the_bhyt') THEN
    ALTER TABLE public.users_profile ADD COLUMN ma_the_bhyt TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'ngay_cap_bhyt') THEN
    ALTER TABLE public.users_profile ADD COLUMN ngay_cap_bhyt DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'ngay_het_han_bhyt') THEN
    ALTER TABLE public.users_profile ADD COLUMN ngay_het_han_bhyt DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'noi_dang_ky_kham_benh') THEN
    ALTER TABLE public.users_profile ADD COLUMN noi_dang_ky_kham_benh TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'so_cccd') THEN
    ALTER TABLE public.users_profile ADD COLUMN so_cccd TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'ngay_sinh') THEN
    ALTER TABLE public.users_profile ADD COLUMN ngay_sinh DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'gioi_tinh') THEN
    ALTER TABLE public.users_profile ADD COLUMN gioi_tinh TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'dia_chi') THEN
    ALTER TABLE public.users_profile ADD COLUMN dia_chi TEXT;
  END IF;
END $$;

-- Add constraints if they don't exist
DO $$
BEGIN
  -- Add check constraint for gioi_tinh if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'gioi_tinh_check' 
    AND table_name = 'users_profile'
  ) THEN
    ALTER TABLE public.users_profile 
    ADD CONSTRAINT gioi_tinh_check 
    CHECK (gioi_tinh IN ('Nam', 'Nữ', 'Khác'));
  END IF;

  -- Add check constraint for nhom_mau if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'nhom_mau_check' 
    AND table_name = 'users_profile'
  ) THEN
    ALTER TABLE public.users_profile 
    ADD CONSTRAINT nhom_mau_check 
    CHECK (nhom_mau IN ('A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'));
  END IF;

  -- Add check constraint for BHYT dates if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'valid_bhyt_dates' 
    AND table_name = 'users_profile'
  ) THEN
    ALTER TABLE public.users_profile 
    ADD CONSTRAINT valid_bhyt_dates 
    CHECK (
      (ma_the_bhyt IS NULL AND ngay_cap_bhyt IS NULL AND ngay_het_han_bhyt IS NULL) OR
      (ma_the_bhyt IS NOT NULL AND ngay_cap_bhyt IS NOT NULL AND ngay_het_han_bhyt IS NOT NULL AND ngay_cap_bhyt < ngay_het_han_bhyt)
    );
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_profile_so_cccd ON public.users_profile(so_cccd);
CREATE INDEX IF NOT EXISTS idx_users_profile_ma_the_bhyt ON public.users_profile(ma_the_bhyt);
CREATE INDEX IF NOT EXISTS idx_users_profile_updated_at ON public.users_profile(updated_at);

-- Ensure RLS is enabled
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;

-- Create or update RLS policies
DO $$
BEGIN
  -- Drop existing policies if they exist and recreate them
  DROP POLICY IF EXISTS "Users can view own profile" ON public.users_profile;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.users_profile;
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.users_profile;

  -- Create new policies
  CREATE POLICY "Users can view own profile" ON public.users_profile
    FOR SELECT USING (auth.uid() = id);

  CREATE POLICY "Users can update own profile" ON public.users_profile
    FOR UPDATE USING (auth.uid() = id);

  CREATE POLICY "Users can insert own profile" ON public.users_profile
    FOR INSERT WITH CHECK (auth.uid() = id);
END $$;

COMMIT;