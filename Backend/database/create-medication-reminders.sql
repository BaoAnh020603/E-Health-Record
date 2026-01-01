-- =====================================================
-- CREATE MEDICATION REMINDERS TABLES
-- Tạo bảng nhắc nhở uống thuốc
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bảng lưu trữ nhắc nhở uống thuốc
CREATE TABLE IF NOT EXISTS medication_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  
  -- Thông tin thuốc
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  instructions TEXT,
  
  -- Thời gian nhắc nhở
  reminder_time TIME NOT NULL,
  next_reminder_at TIMESTAMPTZ,
  
  -- Liên kết với đơn thuốc gốc
  prescription_id UUID,
  doctor_name TEXT NOT NULL,
  hospital TEXT,
  diagnosis TEXT,
  prescription_date DATE,
  
  -- Xác minh từ bác sĩ
  verified_by_doctor BOOLEAN DEFAULT false,
  user_confirmed BOOLEAN DEFAULT false,
  
  -- Trạng thái
  is_active BOOLEAN DEFAULT true,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  
  -- Thống kê
  total_reminders INT DEFAULT 0,
  completed_count INT DEFAULT 0,
  missed_count INT DEFAULT 0,
  last_taken_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng lịch sử uống thuốc
CREATE TABLE IF NOT EXISTS medication_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reminder_id UUID NOT NULL REFERENCES medication_reminders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  
  scheduled_time TIMESTAMPTZ NOT NULL,
  actual_time TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('taken', 'missed', 'skipped', 'pending')),
  
  notes TEXT,
  side_effects TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_medication_reminders_user ON medication_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_reminders_active ON medication_reminders(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_medication_reminders_next ON medication_reminders(next_reminder_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_medication_reminders_prescription ON medication_reminders(prescription_id);

CREATE INDEX IF NOT EXISTS idx_medication_history_reminder ON medication_history(reminder_id);
CREATE INDEX IF NOT EXISTS idx_medication_history_user ON medication_history(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_history_status ON medication_history(status);

-- RLS Policies
ALTER TABLE medication_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own reminders" ON medication_reminders;
DROP POLICY IF EXISTS "Users can insert own reminders" ON medication_reminders;
DROP POLICY IF EXISTS "Users can update own reminders" ON medication_reminders;
DROP POLICY IF EXISTS "Users can delete own reminders" ON medication_reminders;
DROP POLICY IF EXISTS "Users can view own history" ON medication_history;
DROP POLICY IF EXISTS "Users can insert own history" ON medication_history;

-- Users can only see their own reminders
CREATE POLICY "Users can view own reminders"
  ON medication_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
  ON medication_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON medication_reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON medication_reminders FOR DELETE
  USING (auth.uid() = user_id);

-- History policies
CREATE POLICY "Users can view own history"
  ON medication_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
  ON medication_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to update next_reminder_at
CREATE OR REPLACE FUNCTION update_next_reminder()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate next reminder time based on current time and reminder_time
  NEW.next_reminder_at := (CURRENT_DATE + NEW.reminder_time::TIME)::TIMESTAMPTZ;
  
  -- If the time has passed today, schedule for tomorrow
  IF NEW.next_reminder_at < NOW() THEN
    NEW.next_reminder_at := NEW.next_reminder_at + INTERVAL '1 day';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_next_reminder ON medication_reminders;
CREATE TRIGGER set_next_reminder
  BEFORE INSERT OR UPDATE OF reminder_time ON medication_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_next_reminder();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_medication_reminder_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_medication_reminder_timestamp ON medication_reminders;
CREATE TRIGGER update_medication_reminder_timestamp
  BEFORE UPDATE ON medication_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_medication_reminder_timestamp();

-- Verify tables created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medication_reminders') THEN
    RAISE NOTICE '✅ Table medication_reminders created successfully';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medication_history') THEN
    RAISE NOTICE '✅ Table medication_history created successfully';
  END IF;
  
  RAISE NOTICE '✅ Medication reminders system is ready!';
END $$;
