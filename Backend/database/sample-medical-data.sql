-- Sample Medical Data for Testing
-- Run this after the main schemas to populate with test data

-- Additional medication interactions
INSERT INTO medication_interactions (
    drug_a_name, drug_a_generic_name, drug_b_name, drug_b_generic_name,
    interaction_severity, interaction_type, clinical_effect, management_strategy,
    evidence_level, monitoring_requirements
) VALUES 
(
    'Digoxin', 'digoxin', 'Furosemide', 'furosemide',
    'moderate', 'pharmacodynamic', 'Increased risk of digoxin toxicity due to potassium depletion',
    'Monitor serum potassium and digoxin levels regularly',
    'B', 'Check potassium weekly, digoxin levels monthly'
),
(
    'Simvastatin', 'simvastatin', 'Clarithromycin', 'clarithromycin',
    'major', 'pharmacokinetic', 'Increased statin levels leading to rhabdomyolysis risk',
    'Avoid combination or use alternative antibiotic',
    'A', 'Monitor for muscle pain, weakness, and CK levels'
),
(
    'Insulin', 'insulin', 'Beta-blockers', 'propranolol',
    'moderate', 'pharmacodynamic', 'Masking of hypoglycemic symptoms',
    'Use cardioselective beta-blockers when possible, educate patient on alternative hypoglycemia signs',
    'B', 'More frequent blood glucose monitoring'
);

-- Additional clinical decision rules
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
    'Hypertension Management Protocol',
    ARRAY['I10', 'I11', 'I12', 'I13'],
    '{"blood_pressure": {"systolic": ">140", "diastolic": ">90"}, "age_range": {"min": 18, "max": 80}}',
    'recommended',
    'A',
    '{"lifestyle": "Diet modification, exercise, weight loss", "medication": "ACE inhibitors or ARBs first line", "monitoring": "BP check every 2-4 weeks until controlled"}',
    '{"conditions": ["pregnancy", "severe_kidney_disease", "hyperkalemia"]}',
    true
),
(
    'Diabetes Foot Care Guidelines',
    ARRAY['E10', 'E11', 'E13', 'E14'],
    '{"diabetes_duration": ">5_years", "risk_factors": ["neuropathy", "poor_circulation", "previous_ulcer"]}',
    'mandatory',
    'A',
    '{"screening": "Annual comprehensive foot exam", "education": "Daily foot inspection, proper footwear", "referral": "Podiatry for high-risk patients"}',
    '{"conditions": ["active_infection", "severe_ischemia"]}',
    true
),
(
    'Anticoagulation for Atrial Fibrillation',
    ARRAY['I48', 'I48.0', 'I48.1', 'I48.2'],
    '{"chads_vasc_score": ">=2", "bleeding_risk": "acceptable"}',
    'recommended',
    'A',
    '{"assessment": "Calculate CHA2DS2-VASc and HAS-BLED scores", "medication": "Direct oral anticoagulants preferred", "monitoring": "Regular INR if warfarin used"}',
    '{"conditions": ["active_bleeding", "severe_liver_disease", "pregnancy"]}',
    true
);

-- Sample clinical pathways
INSERT INTO clinical_pathways (
    pathway_name,
    condition_category,
    applicable_icd_codes,
    pathway_steps,
    decision_points,
    expected_outcomes,
    quality_indicators,
    approved_by_ministry
) VALUES 
(
    'Acute Myocardial Infarction Management',
    'Cardiovascular Emergency',
    ARRAY['I21', 'I21.0', 'I21.1', 'I21.2', 'I21.3', 'I21.4', 'I21.9'],
    '[
        {"step": 1, "action": "Initial assessment and ECG within 10 minutes", "timeframe": "0-10 minutes"},
        {"step": 2, "action": "Administer aspirin and clopidogrel", "timeframe": "0-30 minutes"},
        {"step": 3, "action": "Primary PCI or thrombolysis decision", "timeframe": "30-90 minutes"},
        {"step": 4, "action": "Post-intervention monitoring", "timeframe": "Ongoing"},
        {"step": 5, "action": "Secondary prevention medications", "timeframe": "Before discharge"}
    ]',
    '[
        {"decision": "PCI vs thrombolysis", "criteria": "Time to presentation, PCI availability, contraindications"},
        {"decision": "Discharge timing", "criteria": "Hemodynamic stability, no complications"}
    ]',
    '[
        {"outcome": "Door-to-balloon time <90 minutes", "target": ">90%"},
        {"outcome": "In-hospital mortality", "target": "<5%"},
        {"outcome": "30-day readmission", "target": "<10%"}
    ]',
    '[
        {"indicator": "Door-to-ECG time", "target": "<10 minutes"},
        {"indicator": "Appropriate medication at discharge", "target": ">95%"},
        {"indicator": "Patient education completed", "target": "100%"}
    ]',
    true
),
(
    'Diabetes Management Pathway',
    'Endocrine',
    ARRAY['E10', 'E11'],
    '[
        {"step": 1, "action": "Comprehensive diabetes assessment", "timeframe": "Initial visit"},
        {"step": 2, "action": "HbA1c and complication screening", "timeframe": "Every 3-6 months"},
        {"step": 3, "action": "Medication optimization", "timeframe": "Ongoing"},
        {"step": 4, "action": "Lifestyle counseling", "timeframe": "Each visit"},
        {"step": 5, "action": "Complication monitoring", "timeframe": "Annual"}
    ]',
    '[
        {"decision": "Medication intensification", "criteria": "HbA1c >7%, no hypoglycemia"},
        {"decision": "Specialist referral", "criteria": "Poor control, complications"}
    ]',
    '[
        {"outcome": "HbA1c <7%", "target": ">70%"},
        {"outcome": "Blood pressure <140/90", "target": ">80%"},
        {"outcome": "LDL cholesterol <100 mg/dL", "target": ">70%"}
    ]',
    '[
        {"indicator": "Annual eye exam", "target": ">90%"},
        {"indicator": "Annual foot exam", "target": ">95%"},
        {"indicator": "Nephropathy screening", "target": ">90%"}
    ]',
    true
);

-- Sample emergency protocols (additional ones)
INSERT INTO emergency_protocols (condition_pattern, trigger_keywords, emergency_level, protocol_actions, contact_info) VALUES
('Anaphylaxis', '["severe allergic reaction", "difficulty breathing", "swelling", "hives", "anaphylaxis"]', 'critical',
 '{"immediate_actions": ["Call 115 immediately", "Administer epinephrine if available", "Position patient lying flat", "Monitor airway and breathing"], "warning": "Anaphylaxis can be fatal within minutes - seek immediate emergency care"}',
 '{"emergency_number": "115", "backup": "113", "poison_control": "1800-1234"}'),

('Diabetic Emergency', '["very high blood sugar", "very low blood sugar", "diabetic coma", "ketoacidosis"]', 'critical',
 '{"immediate_actions": ["Call 115 immediately", "Check blood glucose if possible", "If conscious and low glucose, give sugar", "Do not give insulin without medical supervision"], "warning": "Diabetic emergencies require immediate medical attention"}',
 '{"emergency_number": "115", "backup": "113"}'),

('Severe Hypertension', '["severe headache", "vision changes", "chest pain", "blood pressure over 180"]', 'urgent',
 '{"immediate_actions": ["Seek immediate medical care", "Do not drive yourself", "Avoid sudden position changes", "Take prescribed blood pressure medication"], "warning": "Severe high blood pressure can cause stroke or heart attack"}',
 '{"emergency_number": "115", "backup": "113"});

-- Sample quality metrics
INSERT INTO quality_metrics (
    metric_type,
    measurement_period_start,
    measurement_period_end,
    target_population,
    sample_size,
    metric_value,
    metric_unit,
    benchmark_comparison,
    improvement_trend,
    methodology_notes
) VALUES 
(
    'prediction_accuracy',
    NOW() - INTERVAL '30 days',
    NOW(),
    '{"age_range": "18-65", "conditions": ["diabetes", "hypertension", "asthma"]}',
    1000,
    92.5,
    'percentage',
    '{"industry_average": 88.0, "target": 90.0}',
    'improving',
    'Accuracy measured against clinical outcomes at 30-day follow-up'
),
(
    'professional_review_time',
    NOW() - INTERVAL '30 days',
    NOW(),
    '{"review_type": "high_risk_predictions"}',
    250,
    18.5,
    'hours',
    '{"target": 24.0, "previous_month": 22.3}',
    'improving',
    'Time from prediction submission to professional review completion'
),
(
    'patient_satisfaction',
    NOW() - INTERVAL '30 days',
    NOW(),
    '{"users": "all_active_users"}',
    500,
    4.3,
    'rating_1_to_5',
    '{"industry_average": 3.8, "target": 4.0}',
    'stable',
    'Patient satisfaction survey responses collected via mobile app'
);

-- Sample patient consent records (for testing - in real use, these would be created by users)
-- Note: These are just examples - real consent must be obtained from actual users
INSERT INTO patient_consent (
    user_id,
    consent_type,
    consent_status,
    consent_version,
    consent_text,
    consent_timestamp,
    legal_basis,
    data_retention_period,
    geographic_scope
) VALUES 
(
    '00000000-0000-0000-0000-000000000001', -- Example user ID
    'ai_analysis',
    true,
    '1.0',
    'I consent to the use of artificial intelligence to analyze my medical data for the purpose of health risk assessment and clinical decision support.',
    NOW() - INTERVAL '30 days',
    'explicit_consent',
    '7 years',
    ARRAY['Vietnam']
),
(
    '00000000-0000-0000-0000-000000000001',
    'data_processing',
    true,
    '1.0',
    'I consent to the processing of my personal health information for the purpose of providing medical AI assistance and improving healthcare outcomes.',
    NOW() - INTERVAL '30 days',
    'explicit_consent',
    '7 years',
    ARRAY['Vietnam']
);

-- Verify data insertion
SELECT 'Sample data inserted successfully' as status;