-- 004_create_medical_records_table.sql
-- Creates the medical_records table and related tables with proper RLS policies
-- Includes all necessary indexes and triggers

BEGIN;

-- Create medical_records table
CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ma_hsba TEXT UNIQUE, -- Medical record number (auto-generated)
  
  -- Basic information
  ngay_kham DATE NOT NULL,
  ten_benh_vien TEXT,
  ma_benh_vien TEXT,
  ten_khoa TEXT,
  bac_si_kham TEXT,
  
  -- Medical details
  ly_do_kham TEXT,
  chan_doan_vao TEXT,
  chan_doan_ra TEXT,
  ma_benh_chinh TEXT,
  ma_benh_phu TEXT[], -- Array of secondary disease codes
  
  -- Treatment
  phuong_phap_dieu_tri TEXT,
  ket_qua_dieu_tri TEXT,
  so_ngay_dieu_tri INTEGER,
  ghi_chu_bac_si TEXT,
  
  -- Prescription (stored as JSONB)
  toa_thuoc JSONB DEFAULT '[]'::jsonb,
  
  -- Costs (stored as JSONB)
  chi_phi JSONB DEFAULT '{}'::jsonb,
  
  -- Type of examination
  loai_kham TEXT CHECK (loai_kham IN ('Ngoại trú', 'Nội trú', 'Cấp cứu')),
  
  -- Status
  trang_thai TEXT DEFAULT 'active' CHECK (trang_thai IN ('active', 'deleted')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medical_files table for file attachments
CREATE TABLE IF NOT EXISTS public.medical_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id UUID REFERENCES public.medical_records(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- File information
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  
  -- File metadata
  description TEXT,
  loai_file TEXT CHECK (loai_file IN ('Kết quả xét nghiệm', 'Hình ảnh y khoa', 'Đơn thuốc', 'Khác')),
  
  -- Status
  trang_thai TEXT DEFAULT 'active' CHECK (trang_thai IN ('active', 'deleted')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create share_tokens table for sharing medical records
CREATE TABLE IF NOT EXISTS public.share_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  
  -- Share details
  record_ids UUID[] NOT NULL, -- Array of medical record IDs
  shared_with_name TEXT,
  shared_with_email TEXT,
  shared_with_phone TEXT,
  
  -- Access control
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  access_count INTEGER DEFAULT 0,
  max_access_count INTEGER DEFAULT 1,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for medical_records
CREATE POLICY "Users can view own medical records" ON public.medical_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medical records" ON public.medical_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medical records" ON public.medical_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medical records" ON public.medical_records
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for medical_files
CREATE POLICY "Users can view own medical files" ON public.medical_files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medical files" ON public.medical_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medical files" ON public.medical_files
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medical files" ON public.medical_files
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for share_tokens
CREATE POLICY "Users can view own share tokens" ON public.share_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own share tokens" ON public.share_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own share tokens" ON public.share_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own share tokens" ON public.share_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medical_records_user_id ON public.medical_records(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_ngay_kham ON public.medical_records(ngay_kham DESC);
CREATE INDEX IF NOT EXISTS idx_medical_records_trang_thai ON public.medical_records(trang_thai);
CREATE INDEX IF NOT EXISTS idx_medical_records_loai_kham ON public.medical_records(loai_kham);
CREATE INDEX IF NOT EXISTS idx_medical_records_ma_hsba ON public.medical_records(ma_hsba);

CREATE INDEX IF NOT EXISTS idx_medical_files_record_id ON public.medical_files(record_id);
CREATE INDEX IF NOT EXISTS idx_medical_files_user_id ON public.medical_files(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_files_trang_thai ON public.medical_files(trang_thai);

CREATE INDEX IF NOT EXISTS idx_share_tokens_token ON public.share_tokens(token);
CREATE INDEX IF NOT EXISTS idx_share_tokens_user_id ON public.share_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_share_tokens_expires_at ON public.share_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_share_tokens_is_active ON public.share_tokens(is_active);

-- Create updated_at triggers
CREATE TRIGGER medical_records_updated_at
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER medical_files_updated_at
  BEFORE UPDATE ON public.medical_files
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER share_tokens_updated_at
  BEFORE UPDATE ON public.share_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to generate medical record number (ma_hsba)
CREATE OR REPLACE FUNCTION public.generate_ma_hsba()
RETURNS TRIGGER AS $$
DECLARE
  year_suffix TEXT;
  sequence_num INTEGER;
  new_ma_hsba TEXT;
BEGIN
  -- Get current year suffix (last 2 digits)
  year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
  
  -- Get next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(ma_hsba FROM 5 FOR 6) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.medical_records
  WHERE ma_hsba LIKE 'HSB' || year_suffix || '%';
  
  -- Generate new ma_hsba: HSB + YY + 6-digit sequence
  new_ma_hsba := 'HSB' || year_suffix || LPAD(sequence_num::TEXT, 6, '0');
  
  NEW.ma_hsba := new_ma_hsba;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate ma_hsba
CREATE TRIGGER generate_ma_hsba_trigger
  BEFORE INSERT ON public.medical_records
  FOR EACH ROW
  WHEN (NEW.ma_hsba IS NULL)
  EXECUTE FUNCTION public.generate_ma_hsba();

COMMIT;