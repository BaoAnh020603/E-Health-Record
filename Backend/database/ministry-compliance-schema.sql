-- Ministry of Health Compliance Schema
-- Vietnam Healthcare Standards Implementation

-- ICD-10 Vietnam Official Codes Table
CREATE TABLE IF NOT EXISTS icd10_vietnam_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  description_vietnamese TEXT NOT NULL,
  description_english TEXT,
  category VARCHAR(100),
  chapter VARCHAR(100),
  severity_level VARCHAR(20) CHECK (severity_level IN ('low', 'moderate', 'high', 'critical')),
  ministry_approved BOOLEAN DEFAULT false,
  approval_date TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ministry Treatment Protocols
CREATE TABLE IF NOT EXISTS ministry_treatment_protocols (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  icd10_code VARCHAR(10) REFERENCES icd10_vietnam_codes(code),
  protocol_name_vi TEXT NOT NULL,
  protocol_name_en TEXT,
  treatment_steps JSONB NOT NULL,
  contraindications JSONB,
  drug_interactions JSONB,
  ministry_approved BOOLEAN DEFAULT false,
  approval_date TIMESTAMP WITH TIME ZONE,
  evidence_level VARCHAR(10) CHECK (evidence_level IN ('A', 'B', 'C', 'D')),
  guideline_source TEXT,
  last_reviewed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ministry Review Queue
CREATE TABLE IF NOT EXISTS ministry_review_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id UUID REFERENCES ai_predictions(id),
  icd10_code VARCHAR(10) REFERENCES icd10_vietnam_codes(code),
  symptoms JSONB,
  ai_confidence DECIMAL(3,2),
  patient_demographics JSONB,
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  review_status VARCHAR(30) DEFAULT 'pending_ministry_review' 
    CHECK (review_status IN ('pending_ministry_review', 'under_review', 'approved', 'rejected', 'requires_modification')),
  reviewer_id UUID REFERENCES medical_professionals(id),
  review_notes TEXT,
  ministry_approval_date TIMESTAMP WITH TIME ZONE,
  priority_level VARCHAR(20) DEFAULT 'standard' 
    CHECK (priority_level IN ('emergency', 'high', 'standard', 'low')),
  compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clinical Guidelines (Ministry Approved)
CREATE TABLE IF NOT EXISTS clinical_guidelines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guideline_code VARCHAR(20) UNIQUE NOT NULL,
  title_vi TEXT NOT NULL,
  title_en TEXT,
  guideline_text TEXT NOT NULL,
  applicable_icd10_codes TEXT[], -- Array of ICD-10 codes
  evidence_level VARCHAR(10) CHECK (evidence_level IN ('A', 'B', 'C', 'D')),
  ministry_approval_number VARCHAR(50),
  ministry_approval_date TIMESTAMP WITH TIME ZONE,
  effective_date TIMESTAMP WITH TIME ZONE,
  expiry_date TIMESTAMP WITH TIME ZONE,
  version VARCHAR(10) DEFAULT '1.0',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'superseded', 'withdrawn')),
  created_by UUID REFERENCES medical_professionals(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ministry Audit Log
CREATE TABLE IF NOT EXISTS ministry_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'prediction', 'protocol', 'guideline'
  entity_id UUID NOT NULL,
  action VARCHAR(30) NOT NULL, -- 'create', 'update', 'approve', 'reject'
  old_values JSONB,
  new_values JSONB,
  performed_by UUID REFERENCES auth.users(id),
  ministry_official_id VARCHAR(50), -- Ministry official identifier
  audit_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  compliance_notes TEXT,
  regulatory_reference TEXT
);

-- Quality Metrics for Ministry Reporting
CREATE TABLE IF NOT EXISTS ministry_quality_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(10,4) NOT NULL,
  metric_unit VARCHAR(20),
  measurement_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  measurement_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  sample_size INTEGER,
  confidence_interval DECIMAL(5,2),
  benchmark_value DECIMAL(10,4),
  meets_ministry_standard BOOLEAN,
  reported_to_ministry BOOLEAN DEFAULT false,
  report_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_icd10_vietnam_code ON icd10_vietnam_codes(code);
CREATE INDEX IF NOT EXISTS idx_icd10_vietnam_approved ON icd10_vietnam_codes(ministry_approved);
CREATE INDEX IF NOT EXISTS idx_ministry_review_status ON ministry_review_queue(review_status);
CREATE INDEX IF NOT EXISTS idx_ministry_review_priority ON ministry_review_queue(priority_level);
CREATE INDEX IF NOT EXISTS idx_clinical_guidelines_icd10 ON clinical_guidelines USING GIN(applicable_icd10_codes);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON ministry_audit_log(audit_timestamp);

-- Row Level Security Policies
ALTER TABLE icd10_vietnam_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_treatment_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_quality_metrics ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (detailed policies created in fix-medical-professionals-table.sql)
CREATE POLICY "Public can view approved ICD-10 codes" ON icd10_vietnam_codes
  FOR SELECT USING (ministry_approved = true);

CREATE POLICY "Medical professionals can view approved protocols" ON ministry_treatment_protocols
  FOR SELECT USING (
    ministry_approved = true OR
    EXISTS (
      SELECT 1 FROM medical_professionals mp
      WHERE mp.user_id = auth.uid()
      AND mp.verification_status = 'verified'
    )
  );

CREATE POLICY "Professionals can submit for ministry review" ON ministry_review_queue
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM medical_professionals mp
      WHERE mp.user_id = auth.uid()
      AND mp.verification_status = 'verified'
    )
  );

-- Functions for Ministry Compliance

-- Function to validate ICD-10 code format
CREATE OR REPLACE FUNCTION validate_icd10_format(code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Vietnam ICD-10 format validation
  RETURN code ~ '^[A-Z][0-9]{2}(\.[0-9]{1,2})?$';
END;
$$ LANGUAGE plpgsql;

-- Function to calculate compliance score
CREATE OR REPLACE FUNCTION calculate_compliance_score(
  prediction_accuracy DECIMAL,
  protocol_adherence DECIMAL,
  documentation_completeness DECIMAL
)
RETURNS INTEGER AS $$
BEGIN
  RETURN ROUND(
    (prediction_accuracy * 0.4 + 
     protocol_adherence * 0.4 + 
     documentation_completeness * 0.2) * 100
  )::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log all ministry-related changes
CREATE OR REPLACE FUNCTION log_ministry_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ministry_audit_log (
    audit_type,
    entity_type,
    entity_id,
    action,
    old_values,
    new_values,
    performed_by
  ) VALUES (
    'ministry_compliance',
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers
CREATE TRIGGER ministry_audit_icd10_codes
  AFTER INSERT OR UPDATE OR DELETE ON icd10_vietnam_codes
  FOR EACH ROW EXECUTE FUNCTION log_ministry_audit();

CREATE TRIGGER ministry_audit_treatment_protocols
  AFTER INSERT OR UPDATE OR DELETE ON ministry_treatment_protocols
  FOR EACH ROW EXECUTE FUNCTION log_ministry_audit();

CREATE TRIGGER ministry_audit_review_queue
  AFTER INSERT OR UPDATE OR DELETE ON ministry_review_queue
  FOR EACH ROW EXECUTE FUNCTION log_ministry_audit();

-- Sample Ministry-Approved ICD-10 Codes (Common Vietnamese conditions)
INSERT INTO icd10_vietnam_codes (code, description_vietnamese, description_english, category, severity_level, ministry_approved, approval_date) VALUES
('J45.9', 'Hen phế quản không xác định', 'Asthma, unspecified', 'Respiratory', 'moderate', true, NOW()),
('I10', 'Tăng huyết áp nguyên phát', 'Essential hypertension', 'Cardiovascular', 'moderate', true, NOW()),
('E11.9', 'Đái tháo đường type 2 không biến chứng', 'Type 2 diabetes mellitus without complications', 'Endocrine', 'moderate', true, NOW()),
('K59.0', 'Táo bón', 'Constipation', 'Digestive', 'low', true, NOW()),
('M79.3', 'Viêm cơ không xác định', 'Panniculitis, unspecified', 'Musculoskeletal', 'low', true, NOW()),
('I21.9', 'Nhồi máu cơ tim cấp không xác định', 'Acute myocardial infarction, unspecified', 'Cardiovascular', 'critical', true, NOW()),
('J44.1', 'Bệnh phổi tắc nghẽn mạn tính cấp tính', 'Chronic obstructive pulmonary disease with acute exacerbation', 'Respiratory', 'high', true, NOW()),
('N39.0', 'Nhiễm trùng đường tiết niệu', 'Urinary tract infection, site not specified', 'Genitourinary', 'moderate', true, NOW());

COMMENT ON TABLE icd10_vietnam_codes IS 'Official ICD-10 codes approved by Vietnam Ministry of Health';
COMMENT ON TABLE ministry_treatment_protocols IS 'Treatment protocols approved by Ministry of Health';
COMMENT ON TABLE ministry_review_queue IS 'Queue for Ministry of Health review and approval';
COMMENT ON TABLE clinical_guidelines IS 'Clinical guidelines approved by Ministry of Health';
COMMENT ON TABLE ministry_audit_log IS 'Audit log for all Ministry-related activities';
COMMENT ON TABLE ministry_quality_metrics IS 'Quality metrics for Ministry reporting';