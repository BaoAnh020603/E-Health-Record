-- Add ten_ho_so column to medical_records table
-- This column allows users to give custom names to their medical records

ALTER TABLE medical_records 
ADD COLUMN IF NOT EXISTS ten_ho_so TEXT;

COMMENT ON COLUMN medical_records.ten_ho_so IS 'Tên/số thứ tự hồ sơ do người dùng đặt';

-- Verify column added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'medical_records' 
    AND column_name = 'ten_ho_so'
  ) THEN
    RAISE NOTICE '✅ Column ten_ho_so added successfully';
  ELSE
    RAISE WARNING '❌ Column ten_ho_so not found';
  END IF;
END $$;
