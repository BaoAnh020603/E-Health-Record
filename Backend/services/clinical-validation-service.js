/**
 * Clinical Validation Service
 * Vietnam Ministry of Health Compliance
 */

const { createClient } = require('@supabase/supabase-js');
const ICD10VietnamService = require('./icd10-vietnam-service');

class ClinicalValidationService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    this.icd10Service = new ICD10VietnamService();
  }

  /**
   * Validate AI prediction against Ministry standards
   */
  async validatePrediction(predictionData) {
    const validation = {
      prediction_id: predictionData.id,
      validation_timestamp: new Date().toISOString(),
      checks: {},
      overall_status: 'pending',
      ministry_compliance: false,
      clinical_safety_score: 0,
      recommendations: []
    };

    try {
      // 1. ICD-10 Code Validation
      const icd10Validation = await this.icd10Service.validateICD10Code(
        predictionData.diseaseCode
      );
      validation.checks.icd10_valid = icd10Validation.valid;
      
      if (!icd10Validation.valid) {
        validation.recommendations.push({
          type: 'critical',
          message: 'ICD-10 code not approved by Ministry of Health',
          action: 'Use approved ICD-10 code from official list'
        });
      }

      // 2. Clinical Evidence Validation
      const evidenceValidation = await this.validateClinicalEvidence(
        predictionData.diseaseCode,
        predictionData.symptoms
      );
      validation.checks.clinical_evidence = evidenceValidation;

      // 3. Safety Protocol Validation
      const safetyValidation = await this.validateSafetyProtocols(predictionData);
      validation.checks.safety_protocols = safetyValidation;

      // 4. Professional Review Requirement
      const reviewRequired = await this.checkProfessionalReviewRequired(predictionData);
      validation.checks.professional_review_required = reviewRequired;

      // 5. Emergency Detection
      const emergencyStatus = await this.checkEmergencyStatus(predictionData);
      validation.checks.emergency_detected = emergencyStatus.isEmergency;

      if (emergencyStatus.isEmergency) {
        validation.recommendations.push({
          type: 'emergency',
          message: 'Emergency condition detected - immediate medical attention required',
          action: 'Activate emergency protocols and notify medical professionals'
        });
      }

      // Calculate overall compliance score
      validation.clinical_safety_score = this.calculateSafetyScore(validation.checks);
      validation.ministry_compliance = this.assessMinistryCompliance(validation.checks);
      validation.overall_status = this.determineOverallStatus(validation);

      // Log validation for audit
      await this.logValidation(validation);

      return validation;

    } catch (error) {
      validation.overall_status = 'error';
      validation.error = error.message;
      return validation;
    }
  }

  /**
   * Validate clinical evidence against Ministry guidelines
   */
  async validateClinicalEvidence(icd10Code, symptoms) {
    const { data: guidelines, error } = await this.supabase
      .from('clinical_guidelines')
      .select('*')
      .contains('applicable_icd10_codes', [icd10Code])
      .eq('status', 'active')
      .eq('ministry_approval_date', true);

    if (error) {
      return { valid: false, error: error.message };
    }

    if (guidelines.length === 0) {
      return { 
        valid: false, 
        message: 'No Ministry-approved guidelines found for this condition' 
      };
    }

    // Check if symptoms align with approved guidelines
    const symptomAlignment = this.checkSymptomAlignment(symptoms, guidelines);
    
    return {
      valid: symptomAlignment.score > 0.7,
      score: symptomAlignment.score,
      guidelines_found: guidelines.length,
      evidence_level: guidelines[0].evidence_level,
      ministry_approved: true
    };
  }

  /**
   * Validate safety protocols
   */
  async validateSafetyProtocols(predictionData) {
    const safetyChecks = {
      contraindications_checked: false,
      drug_interactions_checked: false,
      age_appropriate: false,
      severity_assessed: false
    };

    // Check contraindications
    if (predictionData.medicalHistory) {
      const { data: contraindications } = await this.supabase
        .from('ministry_treatment_protocols')
        .select('contraindications')
        .eq('icd10_code', predictionData.diseaseCode)
        .eq('ministry_approved', true);

      safetyChecks.contraindications_checked = contraindications?.length > 0;
    }

    // Check age appropriateness
    if (predictionData.demographics?.age) {
      safetyChecks.age_appropriate = this.validateAgeAppropriate(
        predictionData.demographics.age,
        predictionData.diseaseCode
      );
    }

    // Assess severity
    safetyChecks.severity_assessed = this.assessSeverity(predictionData);

    return safetyChecks;
  }

  /**
   * Check if professional review is required
   */
  async checkProfessionalReviewRequired(predictionData) {
    const highRiskConditions = ['I21', 'I46', 'R57', 'J44.1', 'N17'];
    const lowConfidenceThreshold = 0.7;

    return (
      highRiskConditions.includes(predictionData.diseaseCode) ||
      predictionData.confidence < lowConfidenceThreshold ||
      predictionData.symptoms.some(symptom => 
        ['chest pain', 'difficulty breathing', 'severe headache'].includes(symptom.toLowerCase())
      )
    );
  }

  /**
   * Check emergency status
   */
  async checkEmergencyStatus(predictionData) {
    const { data: emergencyProtocols } = await this.supabase
      .from('emergency_protocols')
      .select('*')
      .eq('icd10_code', predictionData.diseaseCode)
      .eq('active', true);

    const emergencySymptoms = [
      'chest pain', 'difficulty breathing', 'severe headache',
      'loss of consciousness', 'severe bleeding', 'stroke symptoms'
    ];

    const hasEmergencySymptoms = predictionData.symptoms.some(symptom =>
      emergencySymptoms.some(emergency => 
        symptom.toLowerCase().includes(emergency)
      )
    );

    return {
      isEmergency: emergencyProtocols?.length > 0 || hasEmergencySymptoms,
      protocols: emergencyProtocols || [],
      emergency_symptoms: hasEmergencySymptoms
    };
  }

  /**
   * Calculate clinical safety score
   */
  calculateSafetyScore(checks) {
    let score = 0;
    let totalChecks = 0;

    // ICD-10 validation (30%)
    if (checks.icd10_valid) score += 30;
    totalChecks += 30;

    // Clinical evidence (25%)
    if (checks.clinical_evidence?.valid) score += 25;
    totalChecks += 25;

    // Safety protocols (25%)
    const safetyScore = Object.values(checks.safety_protocols || {})
      .filter(Boolean).length / 4 * 25;
    score += safetyScore;
    totalChecks += 25;

    // Emergency detection (20%)
    if (checks.emergency_detected !== undefined) {
      score += checks.emergency_detected ? 20 : 15; // Bonus for proper detection
    }
    totalChecks += 20;

    return Math.round((score / totalChecks) * 100);
  }

  /**
   * Assess Ministry compliance
   */
  assessMinistryCompliance(checks) {
    return (
      checks.icd10_valid &&
      checks.clinical_evidence?.valid &&
      checks.clinical_evidence?.ministry_approved
    );
  }

  /**
   * Determine overall validation status
   */
  determineOverallStatus(validation) {
    if (validation.clinical_safety_score >= 90 && validation.ministry_compliance) {
      return 'approved';
    } else if (validation.clinical_safety_score >= 70) {
      return 'conditional_approval';
    } else if (validation.checks.emergency_detected) {
      return 'emergency_review_required';
    } else {
      return 'requires_review';
    }
  }

  /**
   * Check symptom alignment with guidelines
   */
  checkSymptomAlignment(symptoms, guidelines) {
    // Simplified alignment check - in production, use NLP/ML
    const commonSymptoms = symptoms.length;
    const alignmentScore = Math.min(commonSymptoms / 5, 1); // Basic scoring
    
    return {
      score: alignmentScore,
      matched_symptoms: commonSymptoms
    };
  }

  /**
   * Validate age appropriateness
   */
  validateAgeAppropriate(age, icd10Code) {
    // Age-specific validation rules
    const pediatricCodes = ['P00-P96']; // Perinatal conditions
    const geriatricCodes = ['F03', 'M80']; // Dementia, Osteoporosis
    
    if (age < 18 && pediatricCodes.some(code => icd10Code.startsWith(code))) {
      return true;
    }
    
    if (age >= 65 && geriatricCodes.includes(icd10Code)) {
      return true;
    }
    
    return age >= 18 && age < 65; // General adult range
  }

  /**
   * Assess condition severity
   */
  assessSeverity(predictionData) {
    const criticalCodes = ['I21', 'I46', 'R57'];
    const highSeveritySymptoms = ['severe', 'acute', 'critical'];
    
    return (
      criticalCodes.includes(predictionData.diseaseCode) ||
      predictionData.symptoms.some(symptom =>
        highSeveritySymptoms.some(severity =>
          symptom.toLowerCase().includes(severity)
        )
      )
    );
  }

  /**
   * Log validation for audit trail
   */
  async logValidation(validation) {
    await this.supabase
      .from('ministry_audit_log')
      .insert({
        audit_type: 'clinical_validation',
        entity_type: 'prediction',
        entity_id: validation.prediction_id,
        action: 'validate',
        new_values: validation,
        compliance_notes: `Safety score: ${validation.clinical_safety_score}%, Ministry compliant: ${validation.ministry_compliance}`
      });
  }

  /**
   * Generate Ministry compliance report
   */
  async generateMinistryReport(startDate, endDate) {
    const { data: validations } = await this.supabase
      .from('ministry_audit_log')
      .select('*')
      .eq('audit_type', 'clinical_validation')
      .gte('audit_timestamp', startDate)
      .lte('audit_timestamp', endDate);

    const report = {
      period: { start: startDate, end: endDate },
      total_validations: validations?.length || 0,
      compliance_summary: {
        approved: 0,
        conditional_approval: 0,
        requires_review: 0,
        emergency_review: 0
      },
      average_safety_score: 0,
      ministry_compliance_rate: 0,
      recommendations: []
    };

    if (validations?.length > 0) {
      validations.forEach(validation => {
        const status = validation.new_values?.overall_status;
        if (status && report.compliance_summary[status] !== undefined) {
          report.compliance_summary[status]++;
        }
      });

      // Calculate averages and rates
      const safetyScores = validations
        .map(v => v.new_values?.clinical_safety_score)
        .filter(score => score !== undefined);
      
      report.average_safety_score = safetyScores.length > 0 
        ? Math.round(safetyScores.reduce((a, b) => a + b, 0) / safetyScores.length)
        : 0;

      const compliantCount = validations.filter(v => 
        v.new_values?.ministry_compliance === true
      ).length;
      
      report.ministry_compliance_rate = Math.round(
        (compliantCount / validations.length) * 100
      );
    }

    return report;
  }
}

module.exports = ClinicalValidationService;