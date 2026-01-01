-- =====================================================
-- STORAGE POLICIES FOR MEDICAL FILES
-- Setup policies cho bucket medical-files
-- 
-- LƯU Ý: Bucket phải được tạo qua Dashboard trước!
-- 1. Vào Supabase Dashboard > Storage
-- 2. Click "New bucket"
-- 3. Name: medical-files
-- 4. Public: ON (bật)
-- 5. File size limit: 10 MB
-- 6. Sau đó chạy SQL này
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload medical files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own medical files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own medical files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own medical files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view medical files" ON storage.objects;

-- Storage policies for medical-files bucket

-- Policy: Users can upload files to their own folder
CREATE POLICY "Users can upload medical files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own files
CREATE POLICY "Users can view own medical files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own medical files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'medical-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own medical files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'medical-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access (since bucket is public)
CREATE POLICY "Public can view medical files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'medical-files');

-- Comments
COMMENT ON TABLE storage.buckets IS 'Storage buckets configuration';
COMMENT ON TABLE storage.objects IS 'Stored files metadata';

-- Verify setup
DO $$
DECLARE
  bucket_exists boolean;
BEGIN
  -- Check if bucket exists
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'medical-files'
  ) INTO bucket_exists;
  
  IF bucket_exists THEN
    RAISE NOTICE '✅ Storage bucket "medical-files" found';
    RAISE NOTICE '✅ Policies have been configured';
    RAISE NOTICE 'ℹ️  Bucket should be PUBLIC for easy access';
    RAISE NOTICE 'ℹ️  File size limit: 10MB (set in Dashboard)';
    RAISE NOTICE 'ℹ️  Allowed types: Images, PDF, Word, Excel';
  ELSE
    RAISE WARNING '⚠️  Bucket "medical-files" NOT FOUND!';
    RAISE WARNING 'Please create bucket via Dashboard first:';
    RAISE WARNING '1. Go to Storage > New bucket';
    RAISE WARNING '2. Name: medical-files';
    RAISE WARNING '3. Public: ON';
    RAISE WARNING '4. File size limit: 10 MB';
    RAISE WARNING '5. Then run this SQL again';
  END IF;
END $$;
