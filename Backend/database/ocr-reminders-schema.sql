-- Bảng lưu lịch khám bệnh
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  time TIME,
  doctor TEXT,
  location TEXT,
  notes TEXT,
  created_from TEXT DEFAULT 'manual', -- 'manual' hoặc 'ocr'
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
  created_from TEXT DEFAULT 'manual', -- 'manual' hoặc 'ocr'
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng lưu lịch nhắc uống thuốc
CREATE TABLE IF NOT EXISTS medication_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  time_of_day TEXT NOT NULL, -- 'sáng', 'trưa', 'chiều', 'tối'
  specific_time TIME, -- Thời gian cụ thể (tùy chọn)
  enabled BOOLEAN DEFAULT TRUE,
  last_reminded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng lưu lịch sử nhắc nhở đã gửi
CREATE TABLE IF NOT EXISTS reminder_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reminder_type TEXT NOT NULL, -- 'appointment' hoặc 'medication'
  reference_id UUID NOT NULL, -- ID của appointment hoặc medication
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'acknowledged'
  message TEXT
);

-- Indexes để tăng tốc truy vấn
CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON appointments(user_id, date);
CREATE INDEX IF NOT EXISTS idx_medications_user_active ON medications(user_id, active);
CREATE INDEX IF NOT EXISTS idx_medication_reminders_user ON medication_reminders(user_id, enabled);
CREATE INDEX IF NOT EXISTS idx_reminder_history_user ON reminder_history(user_id, sent_at);

-- Row Level Security (RLS)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_history ENABLE ROW LEVEL SECURITY;

-- Policies cho appointments
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
CREATE POLICY "Users can view their own appointments"
  ON appointments FOR SELECT
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can insert their own appointments" ON appointments;
CREATE POLICY "Users can insert their own appointments"
  ON appointments FOR INSERT
  WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can update their own appointments" ON appointments;
CREATE POLICY "Users can update their own appointments"
  ON appointments FOR UPDATE
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can delete their own appointments" ON appointments;
CREATE POLICY "Users can delete their own appointments"
  ON appointments FOR DELETE
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policies cho medications
DROP POLICY IF EXISTS "Users can view their own medications" ON medications;
CREATE POLICY "Users can view their own medications"
  ON medications FOR SELECT
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can insert their own medications" ON medications;
CREATE POLICY "Users can insert their own medications"
  ON medications FOR INSERT
  WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can update their own medications" ON medications;
CREATE POLICY "Users can update their own medications"
  ON medications FOR UPDATE
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can delete their own medications" ON medications;
CREATE POLICY "Users can delete their own medications"
  ON medications FOR DELETE
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policies cho medication_reminders
DROP POLICY IF EXISTS "Users can view their own medication reminders" ON medication_reminders;
CREATE POLICY "Users can view their own medication reminders"
  ON medication_reminders FOR SELECT
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can insert their own medication reminders" ON medication_reminders;
CREATE POLICY "Users can insert their own medication reminders"
  ON medication_reminders FOR INSERT
  WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can update their own medication reminders" ON medication_reminders;
CREATE POLICY "Users can update their own medication reminders"
  ON medication_reminders FOR UPDATE
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can delete their own medication reminders" ON medication_reminders;
CREATE POLICY "Users can delete their own medication reminders"
  ON medication_reminders FOR DELETE
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policies cho reminder_history
DROP POLICY IF EXISTS "Users can view their own reminder history" ON reminder_history;
CREATE POLICY "Users can view their own reminder history"
  ON reminder_history FOR SELECT
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can insert their own reminder history" ON reminder_history;
CREATE POLICY "Users can insert their own reminder history"
  ON reminder_history FOR INSERT
  WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');
