-- =====================================================
-- MEDICATION REMINDERS SCHEMA
-- Hệ thống nhắc nhở uống thuốc dựa trên đơn thuốc của bác sĩ
-- =====================================================

-- Bảng lưu trữ nhắc nhở uống thuốc
CREATE TABLE IF NOT EXISTS medication_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  
  -- Thông tin thuốc
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL, -- Liều dùng theo đơn bác sĩ
  frequency TEXT NOT NULL, -- Tần suất (VD: "2 lần/ngày")
  instructions TEXT, -- Hướng dẫn sử dụng
  
  -- Thời gian nhắc nhở
  reminder_time TIME NOT NULL, -- Giờ nhắc nhở (VD: 08:00)
  next_reminder_at TIMESTAMPTZ, -- Thời điểm nhắc nhở tiếp theo
  
  -- Liên kết với đơn thuốc gốc
  prescription_id UUID, -- ID của medical_record chứa đơn thuốc
  doctor_name TEXT NOT NULL, -- Bác sĩ kê đơn
  hospital TEXT, -- Bệnh viện
  diagnosis TEXT, -- Chẩn đoán
  prescription_date DATE, -- Ngày kê đơn
  
  -- Xác minh từ bác sĩ
  verified_by_doctor BOOLEAN DEFAULT false,
  user_confirmed BOOLEAN DEFAULT false, -- Người dùng cam kết đơn từ bác sĩ
  
  -- Trạng thái
  is_active BOOLEAN DEFAULT true,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE, -- Ngày kết thúc (nếu có)
  
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
  
  scheduled_time TIMESTAMPTZ NOT NULL, -- Thời gian dự định
  actual_time TIMESTAMPTZ, -- Thời gian thực tế uống
  status TEXT NOT NULL CHECK (status IN ('taken', 'missed', 'skipped', 'pending')),
  
  notes TEXT, -- Ghi chú của người dùng
  side_effects TEXT, -- Tác dụng phụ (nếu có)
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_medication_reminders_user ON medication_reminders(user_id);
CREATE INDEX idx_medication_reminders_active ON medication_reminders(is_active) WHERE is_active = true;
CREATE INDEX idx_medication_reminders_next ON medication_reminders(next_reminder_at) WHERE is_active = true;
CREATE INDEX idx_medication_reminders_prescription ON medication_reminders(prescription_id);

CREATE INDEX idx_medication_history_reminder ON medication_history(reminder_id);
CREATE INDEX idx_medication_history_user ON medication_history(user_id);
CREATE INDEX idx_medication_history_status ON medication_history(status);

-- RLS Policies
ALTER TABLE medication_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_history ENABLE ROW LEVEL SECURITY;

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

CREATE TRIGGER update_medication_reminder_timestamp
  BEFORE UPDATE ON medication_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_medication_reminder_timestamp();

-- Comments
COMMENT ON TABLE medication_reminders IS 'Nhắc nhở uống thuốc dựa trên đơn thuốc của bác sĩ';
COMMENT ON COLUMN medication_reminders.verified_by_doctor IS 'Xác minh đơn thuốc từ bác sĩ';
COMMENT ON COLUMN medication_reminders.user_confirmed IS 'Người dùng cam kết đơn thuốc theo chỉ định bác sĩ';
COMMENT ON TABLE medication_history IS 'Lịch sử uống thuốc của người dùng';
