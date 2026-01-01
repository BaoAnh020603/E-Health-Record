-- Medical Validation System Database Schema
-- Run this in your Supabase SQL editor

-- Medical professionals table
CREATE TABLE IF NOT EXISTS medical_professionals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    hospital_affiliation VARCHAR(200),
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'suspended')),
    ministry_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical knowledge base for validated conditions
CREATE TABLE IF NOT EXISTS medical_knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    icd_code VARCHAR(20) NOT NULL,
    condition_name VARCHAR(200) NOT NULL,
    description TEXT,
    risk_factors JSONB,
    prevention_guidelines JSONB,
    warning_signs JSONB,
    evidence_level VARCHAR(20) CHECK (evidence_level IN ('A', 'B', 'C', 'D')) DEFAULT 'C',
    source_references JSONB,
    ministry_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced AI predictions with validation
CREATE TABLE IF NOT EXISTS ai_predictions_validated (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    disease_code VARCHAR(20) NOT NULL,
    symptoms JSONB NOT NULL,
    prediction_data JSONB NOT NULL,
    
    -- Validation fields
    validation_status VARCHAR(20) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'approved', 'rejected', 'needs_review')),
    validated_by UUID REFERENCES medical_professionals(id),
    validation_notes TEXT,
    validation_date TIMESTAMP WITH TIME ZONE,
    
    -- Safety and compliance
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
    requires_immediate_care BOOLEAN DEFAULT false,
    ministry_compliance_checked BOOLEAN DEFAULT false,
    
    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical review queue
CREATE TABLE IF NOT EXISTS medical_review_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prediction_id UUID REFERENCES ai_predictions_validated(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES medical_professionals(id),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'completed')),
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Emergency protocols
CREATE TABLE IF NOT EXISTS emergency_protocols (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    condition_pattern VARCHAR(200) NOT NULL,
    trigger_keywords JSONB NOT NULL,
    emergency_level VARCHAR(20) CHECK (emergency_level IN ('watch', 'urgent', 'critical')),
    protocol_actions JSONB NOT NULL,
    contact_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log for all medical interactions
CREATE TABLE IF NOT EXISTS medical_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    performed_by UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_predictions_user_id ON ai_predictions_validated (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_validation_status ON ai_predictions_validated (validation_status);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_disease_code ON ai_predictions_validated (disease_code);
CREATE INDEX IF NOT EXISTS idx_medical_review_queue_status ON medical_review_queue (status);
CREATE INDEX IF NOT EXISTS idx_medical_review_queue_priority ON medical_review_queue (priority);
CREATE INDEX IF NOT EXISTS idx_medical_audit_log_user_id ON medical_audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_medical_audit_log_created_at ON medical_audit_log (created_at);

-- Create function for review statistics
CREATE OR REPLACE FUNCTION get_review_stats(professional_id UUID)
RETURNS TABLE (
    total_reviews BIGINT,
    pending_reviews BIGINT,
    approved_reviews BIGINT,
    rejected_reviews BIGINT,
    average_review_time NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_reviews,
        COUNT(*) FILTER (WHERE mrq.status = 'pending') as pending_reviews,
        COUNT(*) FILTER (WHERE apv.validation_status = 'approved') as approved_reviews,
        COUNT(*) FILTER (WHERE apv.validation_status = 'rejected') as rejected_reviews,
        COALESCE(
            AVG(EXTRACT(EPOCH FROM (mrq.completed_at - mrq.created_at)) / 60) 
            FILTER (WHERE mrq.completed_at IS NOT NULL), 
            0
        ) as average_review_time
    FROM medical_review_queue mrq
    LEFT JOIN ai_predictions_validated apv ON mrq.prediction_id = apv.id
    WHERE mrq.assigned_to = professional_id OR professional_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE medical_professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions_validated ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Medical professionals can view their own profile" ON medical_professionals;
DROP POLICY IF EXISTS "Only verified professionals can access review queue" ON medical_review_queue;
DROP POLICY IF EXISTS "Users can view their own predictions" ON ai_predictions_validated;
DROP POLICY IF EXISTS "Users can insert their own predictions" ON ai_predictions_validated;
DROP POLICY IF EXISTS "Medical knowledge base is readable by all authenticated users" ON medical_knowledge_base;
DROP POLICY IF EXISTS "Only verified professionals can update knowledge base" ON medical_knowledge_base;
DROP POLICY IF EXISTS "Emergency protocols are readable by all authenticated users" ON emergency_protocols;
DROP POLICY IF EXISTS "Only verified professionals can manage emergency protocols" ON emergency_protocols;
DROP POLICY IF EXISTS "Medical professionals can view audit logs" ON medical_audit_log;

-- Policies for medical professionals
CREATE POLICY "Medical professionals can view their own profile" ON medical_professionals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Medical professionals can update their own profile" ON medical_professionals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Only verified professionals can access review queue" ON medical_review_queue
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM medical_professionals 
            WHERE user_id = auth.uid() 
            AND verification_status = 'verified'
        )
    );

-- Policies for patients
CREATE POLICY "Users can view their own predictions" ON ai_predictions_validated
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own predictions" ON ai_predictions_validated
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for medical knowledge base (read-only for authenticated users)
CREATE POLICY "Medical knowledge base is readable by all authenticated users" ON medical_knowledge_base
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only verified professionals can update knowledge base" ON medical_knowledge_base
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM medical_professionals 
            WHERE user_id = auth.uid() 
            AND verification_status = 'verified'
            AND ministry_approved = true
        )
    );

-- Policies for emergency protocols (read-only for authenticated users)
CREATE POLICY "Emergency protocols are readable by all authenticated users" ON emergency_protocols
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only verified professionals can manage emergency protocols" ON emergency_protocols
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM medical_professionals 
            WHERE user_id = auth.uid() 
            AND verification_status = 'verified'
            AND ministry_approved = true
        )
    );

-- Policies for audit logs (restricted to medical professionals)
CREATE POLICY "Medical professionals can view audit logs" ON medical_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM medical_professionals 
            WHERE user_id = auth.uid() 
            AND verification_status = 'verified'
        )
    );

CREATE POLICY "System can insert audit logs" ON medical_audit_log
    FOR INSERT WITH CHECK (true);

-- Insert sample emergency protocols
INSERT INTO emergency_protocols (condition_pattern, trigger_keywords, emergency_level, protocol_actions, contact_info) VALUES
('Chest Pain', '["chest pain", "heart attack", "cardiac", "angina"]', 'critical', 
 '{"immediate_actions": ["Call 115 immediately", "Do not drive yourself", "Take aspirin if not allergic"], "warning": "This could be a heart attack - seek immediate medical attention"}',
 '{"emergency_number": "115", "backup": "113"}'),
 
('Severe Breathing Difficulty', '["cannot breathe", "severe shortness of breath", "choking"]', 'critical',
 '{"immediate_actions": ["Call 115 immediately", "Sit upright", "Use rescue inhaler if available"], "warning": "Severe breathing problems require immediate medical attention"}',
 '{"emergency_number": "115", "backup": "113"}'),
 
('Stroke Symptoms', '["sudden weakness", "face drooping", "speech problems", "confusion"]', 'critical',
 '{"immediate_actions": ["Call 115 immediately", "Note time symptoms started", "Do not give food or water"], "warning": "These may be stroke symptoms - time is critical"}',
 '{"emergency_number": "115", "backup": "113"}');

-- Insert sample medical knowledge base entries
INSERT INTO medical_knowledge_base (icd_code, condition_name, description, risk_factors, prevention_guidelines, warning_signs, evidence_level, ministry_approved) VALUES
('J45', 'Asthma', 'Chronic respiratory condition characterized by airway inflammation and bronchospasm',
 '{"genetic": "Family history of asthma", "environmental": "Allergens, pollution, smoking", "lifestyle": "Obesity, stress"}',
 '{"avoid_triggers": "Identify and avoid allergens", "medication_compliance": "Take controller medications as prescribed", "lifestyle": "Maintain healthy weight, regular exercise"}',
 '["Severe shortness of breath", "Chest tightness", "Wheezing that worsens", "Difficulty speaking in full sentences"]',
 'A', true),
 
('I25', 'Chronic Ischemic Heart Disease', 'Long-term heart condition due to reduced blood flow to heart muscle',
 '{"modifiable": "Smoking, high cholesterol, diabetes, hypertension", "non_modifiable": "Age, gender, family history"}',
 '{"lifestyle": "Heart-healthy diet, regular exercise, smoking cessation", "medical": "Control blood pressure, cholesterol, diabetes"}',
 '["New or worsening chest pain", "Shortness of breath", "Unusual fatigue", "Swelling in legs"]',
 'A', true);