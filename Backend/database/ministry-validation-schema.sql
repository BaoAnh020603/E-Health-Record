-- Ministry of Health Validation Database Schema
-- Supports official validation and approval processes for AI medical systems

-- Ministry Validation Submissions Table
CREATE TABLE IF NOT EXISTS ministry_validation_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    submission_id VARCHAR(50) UNIQUE NOT NULL,
    system_name VARCHAR(255) NOT NULL,
    system_version VARCHAR(50) NOT NULL,
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'requires_revision')),
    validation_type VARCHAR(100) NOT NULL,
    clinical_scope TEXT NOT NULL,
    intended_use TEXT NOT NULL,
    submission_data JSONB NOT NULL,
    validation_checklist JSONB,
    estimated_review_time INTEGER, -- in days
    priority_level VARCHAR(20) DEFAULT 'standard' CHECK (priority_level IN ('low', 'standard', 'high', 'urgent')),
    assigned_reviewer_id UUID,
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ministry Validations Table - Detailed validation results
CREATE TABLE IF NOT EXISTS ministry_validations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    submission_id UUID REFERENCES ministry_validation_submissions(id) ON DELETE CASCADE,
    system_id VARCHAR(100) NOT NULL,
    validation_type VARCHAR(100) NOT NULL,
    validation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    overall_compliance BOOLEAN DEFAULT false,
    compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
    validation_results JSONB NOT NULL,
    recommendations TEXT[],
    required_actions TEXT[],
    validator_id UUID,
    validation_notes TEXT,
    next_review_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ministry Certificates Table - Official approval certificates
CREATE TABLE IF NOT EXISTS ministry_certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    certificate_id VARCHAR(50) UNIQUE NOT NULL,
    validation_id UUID REFERENCES ministry_validations(id) ON DELETE CASCADE,
    system_id VARCHAR(100) NOT NULL,
    certificate_type VARCHAR(100) NOT NULL,
    approval_number VARCHAR(50) UNIQUE NOT NULL,
    issue_date DATE NOT NULL,
    valid_until DATE NOT NULL,
    scope TEXT NOT NULL,
    conditions TEXT[],
    compliance_standards TEXT[],
    certificate_status VARCHAR(50) DEFAULT 'active' CHECK (certificate_status IN ('active', 'suspended', 'revoked', 'expired')),
    issuing_authority VARCHAR(255) DEFAULT 'Vietnam Ministry of Health',
    authorized_by VARCHAR(255),
    certificate_data JSONB,
    renewal_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ministry Reviewers Table - Official reviewers and validators
CREATE TABLE IF NOT EXISTS ministry_reviewers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL,
    reviewer_code VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    title VARCHAR(100),
    department VARCHAR(255),
    specialization TEXT[],
    credentials TEXT,
    authorization_level VARCHAR(50) DEFAULT 'reviewer' CHECK (authorization_level IN ('reviewer', 'senior_reviewer', 'approval_authority')),
    active BOOLEAN DEFAULT true,
    appointed_date DATE,
    certification_number VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Validation Standards Table - Official validation criteria
CREATE TABLE IF NOT EXISTS validation_standards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    standard_code VARCHAR(50) UNIQUE NOT NULL,
    standard_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'clinical_accuracy', 'safety', 'evidence', etc.
    description TEXT,
    requirements JSONB NOT NULL,
    minimum_thresholds JSONB,
    validation_methods TEXT[],
    applicable_systems TEXT[], -- Types of systems this applies to
    effective_date DATE NOT NULL,
    revision_number INTEGER DEFAULT 1,
    supersedes_standard VARCHAR(50),
    ministry_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clinical Testing Records Table - Track clinical validation testing
CREATE TABLE IF NOT EXISTS clinical_testing_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    system_id VARCHAR(100) NOT NULL,
    test_phase VARCHAR(50) NOT NULL, -- 'phase_1', 'phase_2', 'phase_3', 'post_market'
    test_name VARCHAR(255) NOT NULL,
    test_description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    sample_size INTEGER,
    test_population_demographics JSONB,
    primary_endpoints TEXT[],
    secondary_endpoints TEXT[],
    inclusion_criteria TEXT[],
    exclusion_criteria TEXT[],
    test_results JSONB,
    statistical_analysis JSONB,
    adverse_events JSONB,
    conclusions TEXT,
    ministry_reviewed BOOLEAN DEFAULT false,
    reviewer_notes TEXT,
    approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'requires_revision')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Regulatory Compliance Tracking Table
CREATE TABLE IF NOT EXISTS regulatory_compliance_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    system_id VARCHAR(100) NOT NULL,
    compliance_area VARCHAR(100) NOT NULL, -- 'data_protection', 'medical_device', 'clinical_trials'
    regulation_reference VARCHAR(255) NOT NULL,
    compliance_status VARCHAR(50) DEFAULT 'pending' CHECK (compliance_status IN ('pending', 'compliant', 'non_compliant', 'partial')),
    assessment_date DATE,
    assessor_id UUID REFERENCES ministry_reviewers(id),
    compliance_evidence JSONB,
    gaps_identified TEXT[],
    remediation_plan TEXT,
    next_assessment_date DATE,
    compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ministry Audit Log Table - Track all ministry-related activities
CREATE TABLE IF NOT EXISTS ministry_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_type VARCHAR(100) NOT NULL,
    system_id VARCHAR(100),
    submission_id UUID,
    validation_id UUID,
    certificate_id UUID,
    user_id UUID,
    reviewer_id UUID,
    activity_description TEXT NOT NULL,
    activity_data JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quality Metrics Tracking Table
CREATE TABLE IF NOT EXISTS quality_metrics_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    system_id VARCHAR(100) NOT NULL,
    metric_category VARCHAR(100) NOT NULL, -- 'accuracy', 'safety', 'performance', 'user_satisfaction'
    metric_name VARCHAR(255) NOT NULL,
    metric_value DECIMAL(10,4),
    metric_unit VARCHAR(50),
    measurement_date DATE NOT NULL,
    measurement_period VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'quarterly'
    benchmark_value DECIMAL(10,4),
    meets_benchmark BOOLEAN,
    trend_direction VARCHAR(20) CHECK (trend_direction IN ('improving', 'stable', 'declining')),
    data_source VARCHAR(255),
    validation_method VARCHAR(255),
    ministry_target DECIMAL(10,4),
    meets_ministry_target BOOLEAN,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post-Market Surveillance Table
CREATE TABLE IF NOT EXISTS post_market_surveillance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    system_id VARCHAR(100) NOT NULL,
    certificate_id UUID REFERENCES ministry_certificates(id),
    surveillance_type VARCHAR(100) NOT NULL, -- 'routine', 'targeted', 'incident_based'
    surveillance_date DATE NOT NULL,
    findings JSONB,
    safety_signals TEXT[],
    effectiveness_data JSONB,
    user_feedback_summary JSONB,
    adverse_events_reported INTEGER DEFAULT 0,
    corrective_actions_required TEXT[],
    follow_up_required BOOLEAN DEFAULT false,
    next_surveillance_date DATE,
    surveillance_officer_id UUID REFERENCES ministry_reviewers(id),
    report_status VARCHAR(50) DEFAULT 'draft' CHECK (report_status IN ('draft', 'submitted', 'reviewed', 'approved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ministry_submissions_status ON ministry_validation_submissions(status);
CREATE INDEX IF NOT EXISTS idx_ministry_submissions_priority ON ministry_validation_submissions(priority_level);
CREATE INDEX IF NOT EXISTS idx_ministry_validations_system_id ON ministry_validations(system_id);
CREATE INDEX IF NOT EXISTS idx_ministry_validations_compliance ON ministry_validations(overall_compliance);
CREATE INDEX IF NOT EXISTS idx_ministry_certificates_system_id ON ministry_certificates(system_id);
CREATE INDEX IF NOT EXISTS idx_ministry_certificates_status ON ministry_certificates(certificate_status);
CREATE INDEX IF NOT EXISTS idx_ministry_certificates_expiry ON ministry_certificates(valid_until);
CREATE INDEX IF NOT EXISTS idx_clinical_testing_system_id ON clinical_testing_records(system_id);
CREATE INDEX IF NOT EXISTS idx_clinical_testing_phase ON clinical_testing_records(test_phase);
CREATE INDEX IF NOT EXISTS idx_compliance_tracking_system_id ON regulatory_compliance_tracking(system_id);
CREATE INDEX IF NOT EXISTS idx_compliance_tracking_status ON regulatory_compliance_tracking(compliance_status);
CREATE INDEX IF NOT EXISTS idx_ministry_audit_timestamp ON ministry_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_ministry_audit_activity_type ON ministry_audit_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_system_id ON quality_metrics_tracking(system_id);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_date ON quality_metrics_tracking(measurement_date);
CREATE INDEX IF NOT EXISTS idx_post_market_system_id ON post_market_surveillance(system_id);
CREATE INDEX IF NOT EXISTS idx_post_market_date ON post_market_surveillance(surveillance_date);

-- Enable Row Level Security (RLS)
ALTER TABLE ministry_validation_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_testing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_compliance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_metrics_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_market_surveillance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ministry_validation_submissions
CREATE POLICY "Ministry officials can view all submissions" ON ministry_validation_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ministry_reviewers mr
            WHERE mr.user_id = auth.uid()
            AND mr.active = true
        )
    );

CREATE POLICY "System owners can view their submissions" ON ministry_validation_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM medical_professionals mp
            WHERE mp.user_id = auth.uid()
            AND mp.verification_status = 'verified'
        )
    );

-- RLS Policies for ministry_certificates
CREATE POLICY "Certificates are publicly viewable" ON ministry_certificates
    FOR SELECT USING (certificate_status = 'active');

CREATE POLICY "Ministry officials can manage certificates" ON ministry_certificates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ministry_reviewers mr
            WHERE mr.user_id = auth.uid()
            AND mr.authorization_level IN ('senior_reviewer', 'approval_authority')
        )
    );

-- RLS Policies for ministry_reviewers
CREATE POLICY "Ministry reviewers can view colleague information" ON ministry_reviewers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ministry_reviewers mr
            WHERE mr.user_id = auth.uid()
            AND mr.active = true
        )
    );

-- RLS Policies for validation_standards
CREATE POLICY "Validation standards are publicly viewable" ON validation_standards
    FOR SELECT USING (ministry_approved = true);

-- Insert default validation standards
INSERT INTO validation_standards (standard_code, standard_name, category, description, requirements, minimum_thresholds, validation_methods, applicable_systems, effective_date) VALUES
('MOH-CA-001', 'Clinical Accuracy Standard', 'clinical_accuracy', 'Minimum accuracy requirements for AI medical systems', 
 '{"minimum_accuracy": 85, "preferred_accuracy": 90, "sample_size": 1000, "validation_period_months": 6}',
 '{"sensitivity": 0.85, "specificity": 0.90, "ppv": 0.80, "npv": 0.95}',
 ARRAY['Clinical trials', 'Retrospective analysis', 'Expert review'],
 ARRAY['diagnostic_ai', 'treatment_recommendation', 'risk_assessment'],
 '2024-01-01'),

('MOH-SF-001', 'Safety Framework Standard', 'safety', 'Safety requirements for AI medical systems',
 '{"emergency_detection": true, "contraindication_checking": true, "professional_oversight": true, "adverse_event_monitoring": true}',
 '{"emergency_detection_sensitivity": 1.0, "adverse_event_rate": 0.01}',
 ARRAY['Safety testing', 'Risk assessment', 'Professional review'],
 ARRAY['all_medical_ai'],
 '2024-01-01'),

('MOH-EV-001', 'Evidence Requirements Standard', 'evidence', 'Evidence requirements for AI medical recommendations',
 '{"peer_reviewed_studies": 3, "clinical_trials": 1, "expert_reviews": 2, "international_recognition": true}',
 '{"evidence_level": "B", "study_quality_score": 80}',
 ARRAY['Literature review', 'Evidence assessment', 'Expert evaluation'],
 ARRAY['diagnostic_ai', 'treatment_recommendation'],
 '2024-01-01'),

('MOH-DP-001', 'Data Protection Standard', 'data_protection', 'Data protection and privacy requirements',
 '{"encryption": "AES-256", "access_control": "RBAC", "audit_logging": true, "data_residency": "Vietnam"}',
 '{"encryption_strength": 256, "access_log_retention_days": 2555}',
 ARRAY['Security audit', 'Privacy assessment', 'Compliance review'],
 ARRAY['all_medical_ai'],
 '2024-01-01');

-- Insert sample ministry reviewers
INSERT INTO ministry_reviewers (user_id, reviewer_code, full_name, title, department, specialization, authorization_level, appointed_date, certification_number, contact_email) VALUES
('00000000-0000-0000-0000-000000000001', 'MOH-REV-001', 'Dr. Nguyen Van Minh', 'Senior Medical Officer', 'Department of Medical Equipment and Construction', ARRAY['Internal Medicine', 'AI Validation'], 'approval_authority', '2024-01-01', 'MOH-CERT-2024-001', 'nv.minh@moh.gov.vn'),
('00000000-0000-0000-0000-000000000002', 'MOH-REV-002', 'Dr. Tran Thi Lan', 'Clinical Validation Specialist', 'Clinical Research Division', ARRAY['Clinical Trials', 'Evidence Assessment'], 'senior_reviewer', '2024-01-01', 'MOH-CERT-2024-002', 'tt.lan@moh.gov.vn'),
('00000000-0000-0000-0000-000000000003', 'MOH-REV-003', 'Dr. Le Duc Anh', 'Safety Assessment Officer', 'Medical Device Safety Division', ARRAY['Medical Device Safety', 'Risk Assessment'], 'senior_reviewer', '2024-01-01', 'MOH-CERT-2024-003', 'ld.anh@moh.gov.vn');

-- Insert sample clinical testing records
INSERT INTO clinical_testing_records (system_id, test_phase, test_name, test_description, start_date, end_date, sample_size, primary_endpoints, test_results, ministry_reviewed, approval_status) VALUES
('ai-medical-system-v1', 'phase_3', 'Comprehensive Clinical Validation Study', 'Large-scale validation of AI diagnostic accuracy across multiple medical conditions', '2023-06-01', '2023-12-31', 5000, 
 ARRAY['Diagnostic accuracy', 'Clinical utility', 'Safety profile'],
 '{"overall_accuracy": 0.92, "sensitivity": 0.89, "specificity": 0.94, "adverse_events": 12}',
 true, 'approved'),

('ai-medical-system-v1', 'post_market', 'Post-Market Surveillance Study', 'Ongoing monitoring of AI system performance in real-world clinical settings', '2024-01-01', NULL, 10000,
 ARRAY['Real-world accuracy', 'User satisfaction', 'Safety monitoring'],
 '{"real_world_accuracy": 0.91, "user_satisfaction": 4.2, "safety_incidents": 3}',
 true, 'approved');

-- Insert sample quality metrics
INSERT INTO quality_metrics_tracking (system_id, metric_category, metric_name, metric_value, metric_unit, measurement_date, benchmark_value, meets_benchmark, ministry_target, meets_ministry_target) VALUES
('ai-medical-system-v1', 'accuracy', 'Overall Diagnostic Accuracy', 92.0, 'percentage', '2024-01-15', 85.0, true, 90.0, true),
('ai-medical-system-v1', 'safety', 'Emergency Detection Sensitivity', 100.0, 'percentage', '2024-01-15', 95.0, true, 100.0, true),
('ai-medical-system-v1', 'performance', 'Response Time', 1.2, 'seconds', '2024-01-15', 3.0, true, 2.0, true),
('ai-medical-system-v1', 'user_satisfaction', 'Clinical User Satisfaction', 4.3, 'rating_1_to_5', '2024-01-15', 3.5, true, 4.0, true);

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION update_ministry_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_ministry_submissions_updated_at 
    BEFORE UPDATE ON ministry_validation_submissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_ministry_updated_at_column();

CREATE TRIGGER update_ministry_certificates_updated_at 
    BEFORE UPDATE ON ministry_certificates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_ministry_updated_at_column();

-- Create function to log ministry activities
CREATE OR REPLACE FUNCTION log_ministry_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO ministry_audit_log (
        activity_type,
        system_id,
        submission_id,
        validation_id,
        certificate_id,
        user_id,
        activity_description,
        activity_data
    ) VALUES (
        TG_OP,
        COALESCE(NEW.system_id, OLD.system_id),
        CASE WHEN TG_TABLE_NAME = 'ministry_validation_submissions' THEN COALESCE(NEW.id, OLD.id) ELSE NULL END,
        CASE WHEN TG_TABLE_NAME = 'ministry_validations' THEN COALESCE(NEW.id, OLD.id) ELSE NULL END,
        CASE WHEN TG_TABLE_NAME = 'ministry_certificates' THEN COALESCE(NEW.id, OLD.id) ELSE NULL END,
        auth.uid(),
        TG_OP || ' on ' || TG_TABLE_NAME,
        row_to_json(COALESCE(NEW, OLD))
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create audit triggers
CREATE TRIGGER ministry_submissions_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON ministry_validation_submissions
    FOR EACH ROW EXECUTE FUNCTION log_ministry_activity();

CREATE TRIGGER ministry_validations_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON ministry_validations
    FOR EACH ROW EXECUTE FUNCTION log_ministry_activity();

CREATE TRIGGER ministry_certificates_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON ministry_certificates
    FOR EACH ROW EXECUTE FUNCTION log_ministry_activity();

-- Create function to check certificate expiry
CREATE OR REPLACE FUNCTION check_certificate_expiry()
RETURNS void AS $$
BEGIN
    UPDATE ministry_certificates 
    SET certificate_status = 'expired'
    WHERE valid_until < CURRENT_DATE 
    AND certificate_status = 'active';
END;
$$ language 'plpgsql';

-- Comments for documentation
COMMENT ON TABLE ministry_validation_submissions IS 'Official submissions for Ministry of Health validation';
COMMENT ON TABLE ministry_validations IS 'Detailed validation results and compliance assessments';
COMMENT ON TABLE ministry_certificates IS 'Official Ministry of Health approval certificates';
COMMENT ON TABLE ministry_reviewers IS 'Authorized Ministry reviewers and validation officers';
COMMENT ON TABLE validation_standards IS 'Official validation standards and requirements';
COMMENT ON TABLE clinical_testing_records IS 'Clinical testing and validation study records';
COMMENT ON TABLE regulatory_compliance_tracking IS 'Tracking compliance with various regulations';
COMMENT ON TABLE ministry_audit_log IS 'Audit log for all Ministry-related activities';
COMMENT ON TABLE quality_metrics_tracking IS 'Ongoing quality metrics and performance tracking';
COMMENT ON TABLE post_market_surveillance IS 'Post-market surveillance and monitoring records';