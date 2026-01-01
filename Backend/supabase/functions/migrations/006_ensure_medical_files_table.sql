-- 006_ensure_medical_files_table.sql
-- Ensure medical_files table exists and has proper structure for file uploads

BEGIN;

-- Create medical_files table if it doesn't exist (it should already exist from migration 004)
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

-- Enable RLS
ALTER TABLE public.medical_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'medical_files' 
    AND policyname = 'Users can view own medical files'
  ) THEN
    CREATE POLICY "Users can view own medical files" ON public.medical_files
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'medical_files' 
    AND policyname = 'Users can insert own medical files'
  ) THEN
    CREATE POLICY "Users can insert own medical files" ON public.medical_files
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'medical_files' 
    AND policyname = 'Users can update own medical files'
  ) THEN
    CREATE POLICY "Users can update own medical files" ON public.medical_files
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'medical_files' 
    AND policyname = 'Users can delete own medical files'
  ) THEN
    CREATE POLICY "Users can delete own medical files" ON public.medical_files
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medical_files_record_id ON public.medical_files(record_id);
CREATE INDEX IF NOT EXISTS idx_medical_files_user_id ON public.medical_files(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_files_trang_thai ON public.medical_files(trang_thai);

-- Create updated_at trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'medical_files_updated_at'
  ) THEN
    CREATE TRIGGER medical_files_updated_at
      BEFORE UPDATE ON public.medical_files
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- Create storage bucket for medical files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-files', 'medical-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
DO $$
BEGIN
  -- Allow authenticated users to upload files
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'medical-files' 
    AND name = 'Users can upload own medical files'
  ) THEN
    CREATE POLICY "Users can upload own medical files" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'medical-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  -- Allow authenticated users to view their own files
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'medical-files' 
    AND name = 'Users can view own medical files'
  ) THEN
    CREATE POLICY "Users can view own medical files" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'medical-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  -- Allow authenticated users to delete their own files
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'medical-files' 
    AND name = 'Users can delete own medical files'
  ) THEN
    CREATE POLICY "Users can delete own medical files" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'medical-files' 
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

COMMIT;