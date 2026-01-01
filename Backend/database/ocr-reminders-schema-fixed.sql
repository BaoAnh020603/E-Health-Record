-- ============================================
-- BƯỚC 1: TẠO CÁC BẢNG
-- ============================================

-- Bảng lưu lịch khám bệnh
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  time TIME,
  doctor TEXT,
  location TEXT,
  notes TEXT,
  created_from TEXT DEFAULT 'manual',
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng lưu thông tin thuốc
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  instructions TEXT,
  start_date DATE,
  duration TEXT,
  created_from TEXT DEFAULT 'manual',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng lưu lịch nhắc uống thuốc
CREATE TABLE IF NOT EXISTS medication_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  time_of_day TEXT NOT NULL,
  specific_time TIME,
  enabled BOOLEAN DEFAULT TRUE,
  last_reminded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng lưu lịch sử nhắc nhở
CREATE TABLE IF NOT EXISTS reminder_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reminder_type TEXT NOT NULL,
  reference_id UUID NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent',
  message TEXT
);

-- ============================================
-- BƯỚC 2: TẠO INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON appointments(user_id, date);
CREATE INDEX IF NOT EXISTS idx_medications_user_active ON medications(user_id, active);
CREATE INDEX IF NOT EXISTS idx_medication_reminders_user ON medication_reminders(user_id, enabled);
CREATE INDEX IF NOT EXISTS idx_reminder_history_user ON reminder_history(user_id, sent_at);

-- ============================================
-- BƯỚC 3: TẮT RLS (ĐỂ TEST DỄ DÀNG)
-- Bật lại sau khi test xong
-- ============================================

ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE medications DISABLE ROW LEVEL SECURITY;
ALTER TABLE medication_reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_history DISABLE ROW LEVEL SECURITY;

-- ============================================
-- HOÀN TẤT!
-- ============================================
-- Các bảng đã được tạo:
-- ✅ appointments
-- ✅ medications  
-- ✅ medication_reminders
-- ✅ reminder_history
--
-- RLS đã TẮT để test dễ dàng
-- Để BẬT lại RLS, chạy:
-- ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE medication_reminders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reminder_history ENABLE ROW LEVEL SECURITY;
