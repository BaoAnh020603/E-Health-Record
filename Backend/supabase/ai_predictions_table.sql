-- Create ai_predictions table for storing AI predictions
-- Run this in Supabase SQL Editor

-- Create the table
CREATE TABLE IF NOT EXISTS ai_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  disease_code TEXT NOT NULL,
  prediction_data JSONB NOT NULL,
  flare_up_probability INTEGER,
  risk_level TEXT CHECK (risk_level IN ('low', 'moderate', 'high', 'very_high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_predictions_user_id ON ai_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_created_at ON ai_predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_risk_level ON ai_predictions(risk_level);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_disease_code ON ai_predictions(disease_code);

-- Enable Row Level Security
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own predictions" ON ai_predictions;
DROP POLICY IF EXISTS "Users can insert their own predictions" ON ai_predictions;
DROP POLICY IF EXISTS "Users can update their own predictions" ON ai_predictions;
DROP POLICY IF EXISTS "Users can delete their own predictions" ON ai_predictions;

-- Create policies for data access
CREATE POLICY "Users can view their own predictions"
  ON ai_predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own predictions"
  ON ai_predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions"
  ON ai_predictions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own predictions"
  ON ai_predictions FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_ai_predictions_updated_at ON ai_predictions;
CREATE TRIGGER update_ai_predictions_updated_at
  BEFORE UPDATE ON ai_predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE ai_predictions IS 'Stores AI predictions for disease flare-ups and prevention advice';
COMMENT ON COLUMN ai_predictions.user_id IS 'Reference to the user who owns this prediction';
COMMENT ON COLUMN ai_predictions.disease_code IS 'ICD-10 or other disease classification code';
COMMENT ON COLUMN ai_predictions.prediction_data IS 'Complete prediction result as JSON';
COMMENT ON COLUMN ai_predictions.flare_up_probability IS 'Probability of disease flare-up (0-100)';
COMMENT ON COLUMN ai_predictions.risk_level IS 'Risk level: low, moderate, high, very_high';