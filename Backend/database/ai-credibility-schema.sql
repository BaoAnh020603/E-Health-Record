-- AI Credibility and Trust Database Schema
-- Supports Ministry of Health approval and patient trust features

-- Evidence Sources Table - Tracks verified medical data sources
CREATE TABLE IF NOT EXISTS evidence_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    disease_code VARCHAR(10) NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'WHO', 'PUBMED', 'COCHRANE', etc.
    source_name VARCHAR(255) NOT NULL,
    source_url TEXT,
    credibility_score INTEGER DEFAULT 0 CHECK (credibility_score >= 0 AND credibility_score <= 100),
    ministry_approved BOOLEAN DEFAULT false,
    verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clinical Studies Table - Peer-reviewed research supporting AI recommendations
CREATE TABLE IF NOT EXISTS clinical_studies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    evidence_source_id UUID REFERENCES evidence_sources(id) ON DELETE CASCADE,
    study_title VARCHAR(500) NOT NULL,
    study_type VARCHAR(100) NOT NULL, -- 'RCT', 'Meta-analysis', 'Cohort', etc.
    publication_date DATE,
    journal_name VARCHAR(255),
    impact_factor DECIMAL(5,3),
    sample_size INTEGER,
    study_duration_months INTEGER,
    primary_outcome TEXT,
    statistical_significance BOOLEAN DEFAULT false,
    p_value DECIMAL(10,8),
    confidence_interval VARCHAR(50),
    evidence_level CHAR(1) CHECK (evidence_level IN ('A', 'B', 'C', 'D')),
    ministry_reviewed BOOLEAN DEFAULT false,
    study_abstract TEXT,
    doi VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Peer Reviews Table - Expert reviews of clinical studies
CREATE TABLE IF NOT EXISTS peer_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinical_study_id UUID REFERENCES clinical_studies(id) ON DELETE CASCADE,
    reviewer_name VARCHAR(255),
    reviewer_affiliation VARCHAR(255),
    reviewer_credentials TEXT,
    review_date DATE,
    review_score INTEGER CHECK (review_score >= 1 AND review_score <= 10),
    review_comments TEXT,
    methodology_score INTEGER CHECK (methodology_score >= 1 AND methodology_score <= 10),
    clinical_relevance_score INTEGER CHECK (clinical_relevance_score >= 1 AND methodology_score <= 10),
    statistical_validity_score INTEGER CHECK (statistical_validity_score >= 1 AND statistical_validity_score <= 10),
    ministry_endorsed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ministry Approvals Table - Official government approvals
CREATE TABLE IF NOT EXISTS ministry_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    disease_code VARCHAR(10) NOT NULL,
    approval_number VARCHAR(100) UNIQUE NOT NULL,
    approval_date DATE NOT NULL,
    valid_until DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    scope TEXT NOT NULL,
    approving_authority VARCHAR(255) DEFAULT 'Vietnam Ministry of Health',
    approval_conditions TEXT,
    compliance_standards TEXT[], -- Array of compliance standards
    review_notes TEXT,
    renewal_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Credibility Reports Table - Generated credibility assessments
CREATE TABLE IF NOT EXISTS ai_credibility_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prediction_id UUID NOT NULL,
    disease_code VARCHAR(10) NOT NULL,
    overall_credibility_score INTEGER CHECK (overall_credibility_score >= 0 AND overall_credibility_score <= 100),
    credibility_level VARCHAR(50),
    evidence_sources JSONB,
    clinical_validation JSONB,
    ministry_approval JSONB,
    ai_certifications JSONB,
    patient_explanation JSONB,
    trust_indicators JSONB,
    verification_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safety Profiles Table - Safety information for diseases/treatments
CREATE TABLE IF NOT EXISTS safety_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    disease_code VARCHAR(10) NOT NULL,
    safety_classification VARCHAR(50) NOT NULL, -- 'safe', 'caution', 'high_risk'
    contraindications TEXT[],
    adverse_events TEXT[],
    monitoring_requirements TEXT[],
    risk_factors TEXT[],
    emergency_protocols TEXT[],
    ministry_validated BOOLEAN DEFAULT false,
    last_reviewed DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contraindications Table - Medical contraindications
CREATE TABLE IF NOT EXISTS contraindications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    disease_code VARCHAR(10) NOT NULL,
    contraindication_type VARCHAR(100) NOT NULL, -- 'absolute', 'relative'
    condition_description TEXT NOT NULL,
    severity_level VARCHAR(50), -- 'mild', 'moderate', 'severe', 'life_threatening'
    clinical_evidence TEXT,
    ministry_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Regulatory Compliance Table - Compliance with various standards
CREATE TABLE IF NOT EXISTS regulatory_compliance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    disease_code VARCHAR(10) NOT NULL,
    fda_approved BOOLEAN DEFAULT false,
    ema_approved BOOLEAN DEFAULT false,
    ministry_approved BOOLEAN DEFAULT false,
    clinical_trial_status VARCHAR(100),
    regulatory_pathway VARCHAR(100),
    compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
    compliance_notes TEXT,
    last_audit_date DATE,
    next_review_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clinical Evidence Base Table - Comprehensive evidence database
CREATE TABLE IF NOT EXISTS clinical_evidence_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    icd_code VARCHAR(10) NOT NULL,
    evidence_level CHAR(1) CHECK (evidence_level IN ('A', 'B', 'C', 'D')),
    evidence_description TEXT,
    clinical_guidelines TEXT,
    treatment_protocols TEXT[],
    diagnostic_criteria TEXT[],
    prognosis_factors TEXT[],
    quality_of_life_impact TEXT,
    cost_effectiveness TEXT,
    ministry_validated BOOLEAN DEFAULT false,
    international_recognition BOOLEAN DEFAULT false,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Model Performance Metrics Table - Track AI accuracy and performance
CREATE TABLE IF NOT EXISTS ai_performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model_version VARCHAR(50) NOT NULL,
    disease_category VARCHAR(100),
    sensitivity DECIMAL(5,4), -- True positive rate
    specificity DECIMAL(5,4), -- True negative rate
    positive_predictive_value DECIMAL(5,4),
    negative_predictive_value DECIMAL(5,4),
    accuracy DECIMAL(5,4),
    auc_roc DECIMAL(5,4), -- Area under ROC curve
    f1_score DECIMAL(5,4),
    test_sample_size INTEGER,
    validation_date DATE,
    ministry_certified BOOLEAN DEFAULT false,
    performance_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient Trust Feedback Table - Track patient confidence in AI recommendations
CREATE TABLE IF NOT EXISTS patient_trust_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    prediction_id UUID NOT NULL,
    trust_score INTEGER CHECK (trust_score >= 1 AND trust_score <= 5),
    credibility_helpful BOOLEAN,
    explanation_clear BOOLEAN,
    would_follow_recommendation BOOLEAN,
    concerns TEXT,
    suggestions TEXT,
    feedback_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_evidence_sources_disease_code ON evidence_sources(disease_code);
CREATE INDEX IF NOT EXISTS idx_evidence_sources_verified ON evidence_sources(verified);
CREATE INDEX IF NOT EXISTS idx_clinical_studies_evidence_level ON clinical_studies(evidence_level);
CREATE INDEX IF NOT EXISTS idx_ministry_approvals_disease_code ON ministry_approvals(disease_code);
CREATE INDEX IF NOT EXISTS idx_ministry_approvals_status ON ministry_approvals(status);
CREATE INDEX IF NOT EXISTS idx_ai_credibility_reports_prediction_id ON ai_credibility_reports(prediction_id);
CREATE INDEX IF NOT EXISTS idx_safety_profiles_disease_code ON safety_profiles(disease_code);
CREATE INDEX IF NOT EXISTS idx_contraindications_disease_code ON contraindications(disease_code);
CREATE INDEX IF NOT EXISTS idx_regulatory_compliance_disease_code ON regulatory_compliance(disease_code);
CREATE INDEX IF NOT EXISTS idx_clinical_evidence_base_icd_code ON clinical_evidence_base(icd_code);
CREATE INDEX IF NOT EXISTS idx_ai_performance_metrics_model_version ON ai_performance_metrics(model_version);
CREATE INDEX IF NOT EXISTS idx_patient_trust_feedback_user_id ON patient_trust_feedback(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE evidence_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_credibility_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contraindications ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_evidence_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_trust_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for evidence_sources
CREATE POLICY "Evidence sources are viewable by authenticated users" ON evidence_sources
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Medical professionals can manage evidence sources" ON evidence_sources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM medical_professionals mp
            WHERE mp.user_id = auth.uid()
            AND mp.verification_status = 'verified'
        )
    );

-- RLS Policies for clinical_studies
CREATE POLICY "Clinical studies are viewable by authenticated users" ON clinical_studies
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Medical professionals can manage clinical studies" ON clinical_studies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM medical_professionals mp
            WHERE mp.user_id = auth.uid()
            AND mp.verification_status = 'verified'
        )
    );

-- RLS Policies for ministry_approvals
CREATE POLICY "Ministry approvals are viewable by authenticated users" ON ministry_approvals
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only ministry approved professionals can manage approvals" ON ministry_approvals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM medical_professionals mp
            WHERE mp.user_id = auth.uid()
            AND mp.ministry_approved = true
            AND mp.verification_status = 'verified'
        )
    );

-- RLS Policies for ai_credibility_reports
CREATE POLICY "Users can view their own credibility reports" ON ai_credibility_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ai_predictions_validated apv
            WHERE apv.id = prediction_id
            AND apv.user_id = auth.uid()
        )
    );

CREATE POLICY "Medical professionals can view all credibility reports" ON ai_credibility_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM medical_professionals mp
            WHERE mp.user_id = auth.uid()
            AND mp.verification_status = 'verified'
        )
    );

-- RLS Policies for patient_trust_feedback
CREATE POLICY "Users can manage their own trust feedback" ON patient_trust_feedback
    FOR ALL USING (user_id = auth.uid());

-- Insert sample verified evidence sources
INSERT INTO evidence_sources (disease_code, source_type, source_name, source_url, credibility_score, ministry_approved, verified, verification_date) VALUES
('J45', 'WHO', 'World Health Organization Asthma Guidelines', 'https://www.who.int/news-room/fact-sheets/detail/asthma', 100, true, true, NOW()),
('J45', 'PUBMED', 'Global Initiative for Asthma (GINA) Guidelines', 'https://pubmed.ncbi.nlm.nih.gov', 95, true, true, NOW()),
('J45', 'COCHRANE', 'Cochrane Review: Asthma Management', 'https://www.cochranelibrary.com', 98, true, true, NOW()),
('I10', 'WHO', 'WHO Hypertension Guidelines', 'https://www.who.int/news-room/fact-sheets/detail/hypertension', 100, true, true, NOW()),
('I10', 'VIETNAM_MOH', 'Vietnam Ministry of Health Hypertension Protocol', 'https://moh.gov.vn', 100, true, true, NOW()),
('E11', 'WHO', 'WHO Diabetes Guidelines', 'https://www.who.int/news-room/fact-sheets/detail/diabetes', 100, true, true, NOW()),
('E11', 'UPTODATE', 'UpToDate Diabetes Management', 'https://www.uptodate.com', 92, true, true, NOW());

-- Insert sample clinical studies
INSERT INTO clinical_studies (evidence_source_id, study_title, study_type, publication_date, journal_name, impact_factor, sample_size, evidence_level, ministry_reviewed, statistical_significance) VALUES
((SELECT id FROM evidence_sources WHERE source_type = 'PUBMED' AND disease_code = 'J45' LIMIT 1), 
 'Effectiveness of Inhaled Corticosteroids in Asthma Management: A Meta-Analysis', 
 'Meta-analysis', '2023-06-15', 'New England Journal of Medicine', 91.245, 15000, 'A', true, true),
((SELECT id FROM evidence_sources WHERE source_type = 'WHO' AND disease_code = 'I10' LIMIT 1), 
 'Global Burden of Hypertension: Systematic Review and Meta-Analysis', 
 'Systematic Review', '2023-08-20', 'The Lancet', 79.321, 25000, 'A', true, true),
((SELECT id FROM evidence_sources WHERE source_type = 'WHO' AND disease_code = 'E11' LIMIT 1), 
 'Type 2 Diabetes Prevention and Management: Evidence-Based Guidelines', 
 'Clinical Guidelines', '2023-09-10', 'Diabetes Care', 18.773, 50000, 'A', true, true);

-- Insert sample ministry approvals
INSERT INTO ministry_approvals (disease_code, approval_number, approval_date, valid_until, scope, compliance_standards) VALUES
('J45', 'MOH-ASTHMA-2024-001', '2024-01-15', '2025-12-31', 'AI-assisted asthma diagnosis and management recommendations', ARRAY['ISO 13485', 'IEC 62304', 'Vietnam Medical Device Regulation']),
('I10', 'MOH-HYPERTENSION-2024-002', '2024-02-20', '2025-12-31', 'AI-assisted hypertension risk assessment and management', ARRAY['ISO 13485', 'IEC 62304', 'Vietnam Medical Device Regulation']),
('E11', 'MOH-DIABETES-2024-003', '2024-03-10', '2025-12-31', 'AI-assisted diabetes risk prediction and management support', ARRAY['ISO 13485', 'IEC 62304', 'Vietnam Medical Device Regulation']);

-- Insert sample safety profiles
INSERT INTO safety_profiles (disease_code, safety_classification, contraindications, adverse_events, monitoring_requirements, ministry_validated) VALUES
('J45', 'caution', 
 ARRAY['Severe cardiovascular disease', 'Active respiratory infection', 'Known hypersensitivity to bronchodilators'],
 ARRAY['Tremor', 'Palpitations', 'Headache', 'Throat irritation'],
 ARRAY['Peak flow monitoring', 'Symptom diary', 'Regular spirometry'],
 true),
('I10', 'caution',
 ARRAY['Pregnancy', 'Severe kidney disease', 'Bilateral renal artery stenosis'],
 ARRAY['Dizziness', 'Fatigue', 'Dry cough', 'Hyperkalemia'],
 ARRAY['Blood pressure monitoring', 'Kidney function tests', 'Electrolyte monitoring'],
 true),
('E11', 'caution',
 ARRAY['Type 1 diabetes', 'Diabetic ketoacidosis', 'Severe kidney disease'],
 ARRAY['Hypoglycemia', 'Weight gain', 'Gastrointestinal upset'],
 ARRAY['Blood glucose monitoring', 'HbA1c testing', 'Kidney function monitoring'],
 true);

-- Insert sample AI performance metrics
INSERT INTO ai_performance_metrics (model_version, disease_category, sensitivity, specificity, positive_predictive_value, negative_predictive_value, accuracy, auc_roc, validation_date, ministry_certified) VALUES
('v2.1.0', 'Respiratory Diseases', 0.9200, 0.8800, 0.8500, 0.9400, 0.9000, 0.9100, '2024-01-15', true),
('v2.1.0', 'Cardiovascular Diseases', 0.8900, 0.9200, 0.8700, 0.9300, 0.9050, 0.9000, '2024-01-15', true),
('v2.1.0', 'Endocrine Diseases', 0.9100, 0.8700, 0.8300, 0.9500, 0.8900, 0.8950, '2024-01-15', true);

-- Insert sample clinical evidence base
INSERT INTO clinical_evidence_base (icd_code, evidence_level, evidence_description, clinical_guidelines, ministry_validated, international_recognition) VALUES
('J45', 'A', 'Comprehensive evidence from multiple systematic reviews and meta-analyses supporting current asthma management protocols', 
 'GINA Guidelines 2024, WHO Asthma Management Protocol, Vietnam Ministry of Health Respiratory Disease Guidelines',
 true, true),
('I10', 'A', 'Strong evidence base from large-scale randomized controlled trials and population studies for hypertension management',
 'ESC/ESH Guidelines 2023, WHO Hypertension Protocol, Vietnam Cardiovascular Disease Prevention Guidelines',
 true, true),
('E11', 'A', 'Robust evidence from landmark diabetes prevention and management trials with long-term follow-up data',
 'ADA Standards of Care 2024, WHO Diabetes Guidelines, Vietnam National Diabetes Prevention Program',
 true, true);

-- Create function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for ministry_approvals table
CREATE TRIGGER update_ministry_approvals_updated_at 
    BEFORE UPDATE ON ministry_approvals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate evidence source credibility
CREATE OR REPLACE FUNCTION validate_evidence_credibility()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically set ministry_approved for WHO and Vietnam MOH sources
    IF NEW.source_type IN ('WHO', 'VIETNAM_MOH') THEN
        NEW.ministry_approved = true;
        NEW.verified = true;
        NEW.verification_date = NOW();
    END IF;
    
    -- Set high credibility scores for recognized sources
    IF NEW.source_type = 'WHO' THEN
        NEW.credibility_score = 100;
    ELSIF NEW.source_type = 'COCHRANE' THEN
        NEW.credibility_score = 98;
    ELSIF NEW.source_type = 'PUBMED' THEN
        NEW.credibility_score = 95;
    ELSIF NEW.source_type = 'UPTODATE' THEN
        NEW.credibility_score = 92;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for evidence source validation
CREATE TRIGGER validate_evidence_source_credibility
    BEFORE INSERT OR UPDATE ON evidence_sources
    FOR EACH ROW
    EXECUTE FUNCTION validate_evidence_credibility();

COMMENT ON TABLE evidence_sources IS 'Verified medical data sources with credibility ratings for AI recommendations';
COMMENT ON TABLE clinical_studies IS 'Peer-reviewed clinical studies supporting AI medical recommendations';
COMMENT ON TABLE ministry_approvals IS 'Official Ministry of Health approvals for AI medical recommendations';
COMMENT ON TABLE ai_credibility_reports IS 'Generated credibility assessments for AI predictions shown to patients';
COMMENT ON TABLE safety_profiles IS 'Safety information and contraindications for medical conditions';
COMMENT ON TABLE ai_performance_metrics IS 'AI model performance metrics for regulatory compliance';
COMMENT ON TABLE patient_trust_feedback IS 'Patient feedback on AI credibility and trust indicators';