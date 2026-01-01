-- Clinical Validation Enhancement Schema
-- Advanced medical validation features for healthcare compliance

-- Clinical decision support rules
CREATE TABLE IF NOT EXISTS clinical_decision_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_name VARCHAR(200) NOT NULL,
    icd_codes TEXT[] NOT NULL, -- Array of applicable ICD codes
    condition_criteria JSONB NOT NULL, -- Structured criteria for rule application
    recommendation_level VARCHAR(20) CHECK (recommendation_level IN ('mandatory', 'recommended', 'optional')) DEFAULT 'recommended',
    evidence_grade VARCHAR(5) CHECK (evidence_grade IN ('A', 'B', 'C', 'D', 'GPP')) DEFAULT 'C',
    clinical_guidelines JSONB NOT NULL, -- Structured clinical recommendations
    contraindications JSONB, -- When NOT to apply this rule
    drug_interactions JSONB, -- Known drug interaction warnings
    age_restrictions JSONB, -- Age-based limitations
    comorbidity_considerations JSONB, -- How comorbidities affect recommendations
    follow_up_requirements JSONB, -- Required follow-up protocols
    created_by UUID REFERENCES medical_professionals(id),
    approved_by_ministry BOOLEAN DEFAULT false,
    ministry_approval_date TIMESTAMP WITH TIME ZONE,
    ministry_approval_number VARCHAR(100),
    version_number INTEGER DEFAULT 1,
    supersedes_rule_id UUID REFERENCES clinical_decision_rules(id),
    effective_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical device integration tracking
CREATE TABLE IF NOT EXISTS medical_device_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_type VARCHAR(100) NOT NULL, -- 'blood_pressure', 'glucose_meter', 'pulse_oximeter', etc.
    device_model VARCHAR(200),
    device_serial VARCHAR(100),
    measurement_type VARCHAR(100) NOT NULL,
    measurement_value NUMERIC NOT NULL,
    measurement_unit VARCHAR(20) NOT NULL,
    measurement_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    reference_ranges JSONB, -- Normal ranges for this measurement
    clinical_significance VARCHAR(50), -- 'normal', 'borderline', 'abnormal', 'critical'
    automated_flags JSONB, -- System-generated alerts
    verified_by_professional UUID REFERENCES medical_professionals(id),
    verification_notes TEXT,
    integration_source VARCHAR(100), -- API, manual entry, etc.
    data_quality_score NUMERIC CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient consent and privacy tracking
CREATE TABLE IF NOT EXISTS patient_consent (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL, -- 'data_processing', 'ai_analysis', 'research_participation', etc.
    consent_status BOOLEAN NOT NULL,
    consent_version VARCHAR(20) NOT NULL,
    consent_text TEXT NOT NULL, -- Full text of what user consented to
    consent_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    withdrawal_timestamp TIMESTAMP WITH TIME ZONE,
    withdrawal_reason TEXT,
    legal_basis VARCHAR(100), -- GDPR legal basis
    data_retention_period INTERVAL,
    geographic_scope TEXT[], -- Which countries/regions this applies to
    third_party_sharing BOOLEAN DEFAULT false,
    research_participation BOOLEAN DEFAULT false,
    marketing_communications BOOLEAN DEFAULT false,
    ip_address INET,
    user_agent TEXT,
    digital_signature_hash VARCHAR(256), -- For legal verification
    witness_professional_id UUID REFERENCES medical_professionals(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Advanced risk stratification
CREATE TABLE IF NOT EXISTS risk_stratification (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    prediction_id UUID REFERENCES ai_predictions_validated(id),
    risk_category VARCHAR(50) NOT NULL, -- 'cardiovascular', 'diabetes', 'respiratory', etc.
    risk_score NUMERIC NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_percentile NUMERIC CHECK (risk_percentile >= 0 AND risk_percentile <= 100),
    population_comparison JSONB, -- How this compares to similar demographics
    modifiable_factors JSONB, -- Factors patient can change
    non_modifiable_factors JSONB, -- Factors patient cannot change
    intervention_recommendations JSONB, -- Specific interventions to reduce risk
    monitoring_frequency VARCHAR(50), -- How often to reassess
    escalation_triggers JSONB, -- When to seek immediate care
    calculated_by VARCHAR(100) NOT NULL, -- Algorithm or professional who calculated
    calculation_method JSONB, -- Details of how risk was calculated
    confidence_interval JSONB, -- Statistical confidence in the prediction
    validation_studies JSONB, -- References to studies validating this approach
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_assessment_due TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quality metrics and outcomes tracking
CREATE TABLE IF NOT EXISTS quality_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_type VARCHAR(100) NOT NULL, -- 'prediction_accuracy', 'patient_satisfaction', 'clinical_outcomes'
    measurement_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    measurement_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    target_population JSONB, -- Demographics of measured population
    sample_size INTEGER NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit VARCHAR(50),
    benchmark_comparison JSONB, -- How this compares to industry benchmarks
    improvement_trend VARCHAR(20) CHECK (improvement_trend IN ('improving', 'stable', 'declining')),
    statistical_significance NUMERIC, -- p-value if applicable
    confidence_interval JSONB,
    methodology_notes TEXT,
    data_sources JSONB, -- Where the data came from
    limitations TEXT, -- Known limitations of this measurement
    recommendations TEXT, -- What actions should be taken based on this metric
    measured_by UUID REFERENCES medical_professionals(id),
    reviewed_by UUID REFERENCES medical_professionals(id),
    published_externally BOOLEAN DEFAULT false,
    regulatory_reporting_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medication interaction checking
CREATE TABLE IF NOT EXISTS medication_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    drug_a_name VARCHAR(200) NOT NULL,
    drug_a_generic_name VARCHAR(200),
    drug_a_class VARCHAR(100),
    drug_b_name VARCHAR(200) NOT NULL,
    drug_b_generic_name VARCHAR(200),
    drug_b_class VARCHAR(100),
    interaction_severity VARCHAR(20) CHECK (interaction_severity IN ('minor', 'moderate', 'major', 'contraindicated')) NOT NULL,
    interaction_type VARCHAR(50) NOT NULL, -- 'pharmacokinetic', 'pharmacodynamic', 'additive', etc.
    clinical_effect TEXT NOT NULL,
    mechanism TEXT,
    management_strategy TEXT NOT NULL,
    monitoring_requirements TEXT,
    alternative_medications JSONB,
    evidence_level VARCHAR(5) CHECK (evidence_level IN ('A', 'B', 'C', 'D')) DEFAULT 'C',
    source_references JSONB,
    frequency_of_interaction VARCHAR(20), -- 'rare', 'uncommon', 'common', 'very_common'
    onset_timing VARCHAR(50), -- 'immediate', 'delayed', 'variable'
    reversibility BOOLEAN,
    special_populations JSONB, -- Elderly, pediatric, pregnancy, etc.
    last_reviewed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_by UUID REFERENCES medical_professionals(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clinical pathway tracking
CREATE TABLE IF NOT EXISTS clinical_pathways (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pathway_name VARCHAR(200) NOT NULL,
    condition_category VARCHAR(100) NOT NULL,
    applicable_icd_codes TEXT[] NOT NULL,
    pathway_steps JSONB NOT NULL, -- Ordered list of clinical steps
    decision_points JSONB, -- Where clinical decisions need to be made
    expected_outcomes JSONB, -- What outcomes to expect at each step
    quality_indicators JSONB, -- Metrics to track pathway effectiveness
    resource_requirements JSONB, -- Staff, equipment, time needed
    cost_estimates JSONB, -- Expected costs at each step
    patient_education_materials JSONB, -- Educational resources for patients
    professional_guidelines JSONB, -- Guidelines for healthcare providers
    evidence_base JSONB, -- Research supporting this pathway
    implementation_barriers JSONB, -- Known challenges in following this pathway
    success_metrics JSONB, -- How to measure if pathway is working
    version_number INTEGER DEFAULT 1,
    supersedes_pathway_id UUID REFERENCES clinical_pathways(id),
    developed_by UUID REFERENCES medical_professionals(id),
    approved_by_ministry BOOLEAN DEFAULT false,
    ministry_approval_date TIMESTAMP WITH TIME ZONE,
    effective_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    review_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient pathway progress tracking
CREATE TABLE IF NOT EXISTS patient_pathway_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pathway_id UUID REFERENCES clinical_pathways(id) NOT NULL,
    current_step INTEGER NOT NULL,
    step_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expected_completion_date TIMESTAMP WITH TIME ZONE,
    actual_completion_date TIMESTAMP WITH TIME ZONE,
    step_outcome VARCHAR(100), -- 'completed', 'skipped', 'modified', 'failed'
    deviation_reason TEXT, -- Why pathway was modified
    clinical_notes TEXT,
    patient_satisfaction_score INTEGER CHECK (patient_satisfaction_score >= 1 AND patient_satisfaction_score <= 10),
    adherence_score NUMERIC CHECK (adherence_score >= 0 AND adherence_score <= 100),
    complications JSONB, -- Any complications encountered
    resource_utilization JSONB, -- Actual resources used vs planned
    cost_tracking JSONB, -- Actual costs vs estimates
    quality_measures JSONB, -- Quality indicators achieved
    supervising_professional UUID REFERENCES medical_professionals(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clinical_decision_rules_icd_codes ON clinical_decision_rules USING GIN (icd_codes);
CREATE INDEX IF NOT EXISTS idx_clinical_decision_rules_effective_date ON clinical_decision_rules (effective_date);
CREATE INDEX IF NOT EXISTS idx_medical_device_data_user_id ON medical_device_data (user_id);
CREATE INDEX IF NOT EXISTS idx_medical_device_data_timestamp ON medical_device_data (measurement_timestamp);
CREATE INDEX IF NOT EXISTS idx_patient_consent_user_id ON patient_consent (user_id);
CREATE INDEX IF NOT EXISTS idx_patient_consent_type ON patient_consent (consent_type);
CREATE INDEX IF NOT EXISTS idx_risk_stratification_user_id ON risk_stratification (user_id);
CREATE INDEX IF NOT EXISTS idx_risk_stratification_category ON risk_stratification (risk_category);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_type ON quality_metrics (metric_type);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_period ON quality_metrics (measurement_period_start, measurement_period_end);
CREATE INDEX IF NOT EXISTS idx_medication_interactions_drugs ON medication_interactions (drug_a_name, drug_b_name);
CREATE INDEX IF NOT EXISTS idx_clinical_pathways_icd_codes ON clinical_pathways USING GIN (applicable_icd_codes);
CREATE INDEX IF NOT EXISTS idx_patient_pathway_progress_user_id ON patient_pathway_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_patient_pathway_progress_pathway_id ON patient_pathway_progress (pathway_id);

-- Enable RLS on all new tables
ALTER TABLE clinical_decision_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_device_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_stratification ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_pathway_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Clinical Decision Rules
CREATE POLICY "Clinical decision rules are readable by authenticated users" ON clinical_decision_rules
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only verified professionals can manage clinical decision rules" ON clinical_decision_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM medical_professionals 
            WHERE user_id = auth.uid() 
            AND verification_status = 'verified'
        )
    );

-- RLS Policies for Medical Device Data
CREATE POLICY "Users can view their own medical device data" ON medical_device_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medical device data" ON medical_device_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Medical professionals can view device data for verification" ON medical_device_data
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM medical_professionals 
            WHERE user_id = auth.uid() 
            AND verification_status = 'verified'
        )
    );

-- RLS Policies for Patient Consent
CREATE POLICY "Users can view their own consent records" ON patient_consent
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consent records" ON patient_consent
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Medical professionals can view consent for audit purposes" ON patient_consent
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM medical_professionals 
            WHERE user_id = auth.uid() 
            AND verification_status = 'verified'
        )
    );

-- RLS Policies for Risk Stratification
CREATE POLICY "Users can view their own risk stratification" ON risk_stratification
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert risk stratification" ON risk_stratification
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Medical professionals can view risk stratification" ON risk_stratification
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM medical_professionals 
            WHERE user_id = auth.uid() 
            AND verification_status = 'verified'
        )
    );

-- RLS Policies for Quality Metrics
CREATE POLICY "Medical professionals can view quality metrics" ON quality_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM medical_professionals 
            WHERE user_id = auth.uid() 
            AND verification_status = 'verified'
        )
    );

CREATE POLICY "Verified professionals can manage quality metrics" ON quality_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM medical_professionals 
            WHERE user_id = auth.uid() 
            AND verification_status = 'verified'
        )
    );

-- RLS Policies for Medication Interactions
CREATE POLICY "Medication interactions are readable by authenticated users" ON medication_interactions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only verified professionals can manage medication interactions" ON medication_interactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM medical_professionals 
            WHERE user_id = auth.uid() 
            AND verification_status = 'verified'
        )
    );

-- RLS Policies for Clinical Pathways
CREATE POLICY "Clinical pathways are readable by authenticated users" ON clinical_pathways
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only verified professionals can manage clinical pathways" ON clinical_pathways
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM medical_professionals 
            WHERE user_id = auth.uid() 
            AND verification_status = 'verified'
        )
    );

-- RLS Policies for Patient Pathway Progress
CREATE POLICY "Users can view their own pathway progress" ON patient_pathway_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Medical professionals can view pathway progress" ON patient_pathway_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM medical_professionals 
            WHERE user_id = auth.uid() 
            AND verification_status = 'verified'
        )
    );

CREATE POLICY "System can insert pathway progress" ON patient_pathway_progress
    FOR INSERT WITH CHECK (true);

-- Functions for clinical decision support
CREATE OR REPLACE FUNCTION check_medication_interactions(
    medication_list TEXT[]
) RETURNS TABLE (
    interaction_id UUID,
    drug_a VARCHAR(200),
    drug_b VARCHAR(200),
    severity VARCHAR(20),
    clinical_effect TEXT,
    management_strategy TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mi.id,
        mi.drug_a_name,
        mi.drug_b_name,
        mi.interaction_severity,
        mi.clinical_effect,
        mi.management_strategy
    FROM medication_interactions mi
    WHERE (mi.drug_a_name = ANY(medication_list) AND mi.drug_b_name = ANY(medication_list))
       OR (mi.drug_a_generic_name = ANY(medication_list) AND mi.drug_b_generic_name = ANY(medication_list))
    ORDER BY 
        CASE mi.interaction_severity
            WHEN 'contraindicated' THEN 1
            WHEN 'major' THEN 2
            WHEN 'moderate' THEN 3
            WHEN 'minor' THEN 4
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get applicable clinical decision rules
CREATE OR REPLACE FUNCTION get_clinical_decision_rules(
    icd_code_input TEXT,
    patient_age INTEGER DEFAULT NULL,
    patient_gender VARCHAR(10) DEFAULT NULL
) RETURNS TABLE (
    rule_id UUID,
    rule_name VARCHAR(200),
    recommendation_level VARCHAR(20),
    clinical_guidelines JSONB,
    contraindications JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cdr.id,
        cdr.rule_name,
        cdr.recommendation_level,
        cdr.clinical_guidelines,
        cdr.contraindications
    FROM clinical_decision_rules cdr
    WHERE icd_code_input = ANY(cdr.icd_codes)
      AND cdr.approved_by_ministry = true
      AND cdr.effective_date <= NOW()
      AND (cdr.expiry_date IS NULL OR cdr.expiry_date > NOW())
      AND (
          cdr.age_restrictions IS NULL 
          OR patient_age IS NULL
          OR (
              patient_age >= COALESCE((cdr.age_restrictions->>'min_age')::INTEGER, 0)
              AND patient_age <= COALESCE((cdr.age_restrictions->>'max_age')::INTEGER, 150)
          )
      )
    ORDER BY 
        CASE cdr.recommendation_level
            WHEN 'mandatory' THEN 1
            WHEN 'recommended' THEN 2
            WHEN 'optional' THEN 3
        END,
        cdr.evidence_grade;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample clinical decision rules
INSERT INTO clinical_decision_rules (
    rule_name, 
    icd_codes, 
    condition_criteria, 
    recommendation_level, 
    evidence_grade, 
    clinical_guidelines,
    contraindications,
    approved_by_ministry
) VALUES 
(
    'Asthma Action Plan Requirement',
    ARRAY['J45', 'J45.0', 'J45.1', 'J45.8', 'J45.9'],
    '{"severity": ["moderate", "severe"], "age_range": {"min": 5, "max": 65}}',
    'mandatory',
    'A',
    '{"action_plan": "All asthma patients must have written action plan", "education": "Provide inhaler technique training", "follow_up": "Schedule within 2-4 weeks"}',
    '{"conditions": ["severe_cognitive_impairment", "terminal_illness"]}',
    true
),
(
    'Diabetes Screening Protocol',
    ARRAY['E11', 'E10', 'R73'],
    '{"risk_factors": ["obesity", "family_history", "age_over_45"], "symptoms": ["polyuria", "polydipsia", "weight_loss"]}',
    'recommended',
    'A',
    '{"screening": "HbA1c every 3 months", "lifestyle": "Diet and exercise counseling", "monitoring": "Blood glucose self-monitoring"}',
    '{"conditions": ["pregnancy", "recent_surgery"]}',
    true
);

-- Insert sample medication interactions
INSERT INTO medication_interactions (
    drug_a_name, drug_a_generic_name, drug_b_name, drug_b_generic_name,
    interaction_severity, interaction_type, clinical_effect, management_strategy,
    evidence_level
) VALUES 
(
    'Warfarin', 'warfarin', 'Aspirin', 'acetylsalicylic acid',
    'major', 'pharmacodynamic', 'Increased risk of bleeding due to additive anticoagulant effects',
    'Monitor INR closely, consider dose reduction, watch for bleeding signs',
    'A'
),
(
    'Metformin', 'metformin', 'Contrast Media', 'iodinated contrast',
    'major', 'pharmacokinetic', 'Risk of lactic acidosis due to contrast-induced nephropathy',
    'Discontinue metformin 48 hours before contrast, resume after kidney function confirmed normal',
    'A'
);