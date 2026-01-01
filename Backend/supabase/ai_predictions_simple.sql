-- Simple version - Run this step by step if needed

-- Step 1: Create the table
CREATE TABLE ai_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  disease_code TEXT NOT NULL,
  prediction_data JSONB NOT NULL,
  flare_up_probability INTEGER,
  risk_level TEXT CHECK (risk_level IN ('low', 'moderate', 'high', 'very_high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes
CREATE INDEX idx_ai_predictions_user_id ON ai_predictions(user_id);
CREATE INDEX idx_ai_predictions_created_at ON ai_predictions(created_at DESC);
CREATE INDEX idx_ai_predictions_risk_level ON ai_predictions(risk_level);

-- Step 3: Enable RLS
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies (run one by one)
CREATE POLICY "Users can view their own predictions"
  ON ai_predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own predictions"
  ON ai_predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);