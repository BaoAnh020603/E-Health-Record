-- Migration: Add ten_ho_so column to medical_records table
-- Description: Allow users to set custom name/number for their medical records
-- Date: 2024-01-28

-- Add column
ALTER TABLE medical_records 
ADD COLUMN IF NOT EXISTS ten_ho_so TEXT;

-- Add comment
COMMENT ON COLUMN medical_records.ten_ho_so IS 'Tên hoặc số thứ tự hồ sơ do người dùng đặt (tùy chọn)';

-- Create index for searching
CREATE INDEX IF NOT EXISTS idx_medical_records_ten_ho_so 
ON medical_records(ten_ho_so) 
WHERE ten_ho_so IS NOT NULL;

-- Update existing records (optional - set default name based on date)
-- UPDATE medical_records 
-- SET ten_ho_so = 'Hồ sơ ' || TO_CHAR(ngay_kham, 'DD/MM/YYYY')
-- WHERE ten_ho_so IS NULL;

COMMENT ON TABLE medical_records IS 'Bảng lưu trữ hồ sơ bệnh án. Mỗi hồ sơ có mã tự động (ma_hsba) và có thể có tên tùy chỉnh (ten_ho_so)';
