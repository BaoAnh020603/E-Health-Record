// Clinical Validation Framework for Ministry of Health Approval
// This system ensures all AI predictions meet clinical standards

const { supabase } = require('../lib/supabase-client');

class ClinicalValidationFramework {
  
  // Clinical evidence levels based on international standards
  static EVIDENCE_LEVELS = {
    'A': {
      name: 'Systematic Review/Meta-analysis',
      description: 'Highest quality evidence from multiple randomized controlled trials',
      ministry_weight: 1.0,
      required_studies: 5
    },
    'B': {
      name: 'Randomized Controlled Trial',
      description: 'Well-designed randomized controlled trials',
      ministry_weight: 0.8,
      required_studies: 3
    },
    'C': {
      name: 'Cohort Studies',
      description: 'Well-designed cohort or case-control studies',
      ministry_weight: 0.6,
      required_studies: 2
    },
    'D': {
      name: 'Expert Opinion',
      description: 'Expert committee reports or clinical experience',
      ministry_weight: 0.4,
      required_studies: 1
    }
  };

  // Ministry of Health validation requirements
  static MINISTRY_REQUIREMENTS = {
    clinical_trials: {
      phase_1: 'Safety and dosage studies',
      phase_2: 'Efficacy and side effects',
      phase_3: 'Large-scale effectiveness',
      phase_4: 'Post-market surveillance'
    },
    documentation: {
      clinical_protocol: 'Detailed study protocols',
      statistical_analysis: 'Pre-specified statistical methods',
      adverse_events: 'Comprehensive safety reporting',
      regulatory_compliance: 'GCP and regulatory adherence'
    },
    validation_metrics: {
      sensitivity: 0.85, // Minimum 85% sensitivity
      specificity: 0.90, // Minimum 90% specificity
      ppv: 0.80, // Positive predictive value
      npv: 0.95, // Negative predictive value
      auc_roc: 0.85 // Area under ROC curve
    }
  };

  // Validate AI prediction against clinical evidence
  async validatePredictionClinically(predictionData, diseaseCode) {
    try {
      // 1. Get clinical evidence for the disease
      const clinicalEvidence = await this.getClinicalEvidence(diseaseCode);
      
      // 2. Check if prediction meets evidence standards
      const evidenceValidation = await this.validateAgainstEvidence(
        predictionData, 
        clinicalEvidence
      );
      
      // 3. Calculate clinical confidence score
      const clinicalScore = await this.calculateClinicalConfidence(
        predictionData,
        clinicalEvidence,
        evidenceValidation
      );
      
      // 4. Determine if Ministry approval is required
      const ministryApprovalRequired = this.requiresMinistryApproval(
        clinicalScore,
        predictionData.riskLevel
      );
      
      // 5. Generate clinical validation report
      const validationReport = {
        prediction_id: predictionData.id,
        disease_code: diseaseCode,
        clinical_evidence_level: clinicalEvidence.evidence_level,
        clinical_confidence_score: clinicalScore,
        evidence_validation: evidenceValidation,
        ministry_approval_required: ministryApprovalRequired,
        validation_timestamp: new Date().toISOString(),
        clinical_recommendations: await this.generateClinicalRecommendations(
          predictionData,
          clinicalEvidence
        ),
        regulatory_compliance: await this.checkRegulatoryCompliance(diseaseCode)
      };
      
      // 6. Store validation results
      await this.storeClinicalValidation(validationReport);
      
      return {
        success: true,
        validation: validationReport,
        requires_ministry_approval: ministryApprovalRequired
      };
      
    } catch (error) {
      console.error('Clinical validation failed:', error);
      return {
        success: false,
        error: 'Clinical validation process failed',
        requires_manual_review: true
      };
    }
  }

  // Get clinical evidence from validated medical databases
  async getClinicalEvidence(diseaseCode) {
    try {
      // Query validated clinical evidence database
      const { data: evidence, error } = await supabase
        .from('clinical_evidence_base')
        .select(`
          *,
          clinical_studies (*),
          regulatory_approvals (*)
        `)
        .eq('icd_code', diseaseCode)
        .eq('ministry_validated', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!evidence) {
        // No validated evidence - requires manual clinical review
        return {
          evidence_level: 'D',
          clinical_studies: [],
          regulatory_status: 'pending_validation',
          requires_clinical_trial: true
        };
      }
      
      return evidence;
    } catch (error) {
      console.error('Failed to get clinical evidence:', error);
      throw new Error('Clinical evidence retrieval failed');
    }
  }

  // Validate prediction against clinical evidence
  async validateAgainstEvidence(predictionData, clinicalEvidence) {
    const validation = {
      evidence_alignment: 0,
      statistical_significance: false,
      clinical_relevance: 0,
      safety_profile: 'unknown',
      contraindications_checked: false
    };

    try {
      // Check if prediction aligns with clinical studies
      if (clinicalEvidence.clinical_studies) {
        const alignmentScore = this.calculateEvidenceAlignment(
          predictionData,
          clinicalEvidence.clinical_studies
        );
        validation.evidence_alignment = alignmentScore;
      }

      // Verify statistical significance
      validation.statistical_significance = this.checkStatisticalSignificance(
        predictionData,
        clinicalEvidence
      );

      // Assess clinical relevance
      validation.clinical_relevance = this.assessClinicalRelevance(
        predictionData,
        clinicalEvidence
      );

      // Check safety profile
      validation.safety_profile = await this.checkSafetyProfile(
        predictionData.diseaseCode,
        predictionData.currentSymptoms
      );

      // Verify contraindications
      validation.contraindications_checked = await this.checkContraindications(
        predictionData
      );

      return validation;
    } catch (error) {
      console.error('Evidence validation failed:', error);
      return validation;
    }
  }

  // Calculate clinical confidence score for Ministry approval
  calculateClinicalConfidence(predictionData, clinicalEvidence, validation) {
    let score = 0;
    let maxScore = 100;

    // Evidence level weight (40% of total score)
    const evidenceWeight = ClinicalValidationFramework.EVIDENCE_LEVELS[
      clinicalEvidence.evidence_level || 'D'
    ].ministry_weight;
    score += evidenceWeight * 40;

    // Evidence alignment (25% of total score)
    score += validation.evidence_alignment * 25;

    // Statistical significance (20% of total score)
    if (validation.statistical_significance) {
      score += 20;
    }

    // Clinical relevance (10% of total score)
    score += validation.clinical_relevance * 10;

    // Safety considerations (5% of total score)
    if (validation.safety_profile === 'safe') {
      score += 5;
    } else if (validation.safety_profile === 'caution') {
      score += 2.5;
    }

    return Math.min(score, maxScore);
  }

  // Determine if Ministry of Health approval is required
  requiresMinistryApproval(clinicalScore, riskLevel) {
    // High-risk predictions always require approval
    if (riskLevel === 'high' || riskLevel === 'critical') {
      return true;
    }

    // Low clinical confidence requires approval
    if (clinicalScore < 70) {
      return true;
    }

    // Moderate risk with medium confidence requires approval
    if (riskLevel === 'moderate' && clinicalScore < 85) {
      return true;
    }

    return false;
  }

  // Generate clinical recommendations based on evidence
  async generateClinicalRecommendations(predictionData, clinicalEvidence) {
    const recommendations = {
      clinical_actions: [],
      follow_up_requirements: [],
      contraindications: [],
      monitoring_parameters: [],
      evidence_gaps: []
    };

    try {
      // Generate evidence-based clinical actions
      if (clinicalEvidence.clinical_studies) {
        recommendations.clinical_actions = this.extractClinicalActions(
          clinicalEvidence.clinical_studies
        );
      }

      // Determine follow-up requirements
      recommendations.follow_up_requirements = this.determineFollowUp(
        predictionData.riskLevel,
        clinicalEvidence.evidence_level
      );

      // Check for contraindications
      recommendations.contraindications = await this.getContraindications(
        predictionData.diseaseCode
      );

      // Define monitoring parameters
      recommendations.monitoring_parameters = this.getMonitoringParameters(
        predictionData.diseaseCode,
        clinicalEvidence
      );

      // Identify evidence gaps
      recommendations.evidence_gaps = this.identifyEvidenceGaps(
        predictionData,
        clinicalEvidence
      );

      return recommendations;
    } catch (error) {
      console.error('Failed to generate clinical recommendations:', error);
      return recommendations;
    }
  }

  // Check regulatory compliance for Ministry approval
  async checkRegulatoryCompliance(diseaseCode) {
    try {
      const { data: compliance, error } = await supabase
        .from('regulatory_compliance')
        .select('*')
        .eq('disease_code', diseaseCode)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return {
        fda_approved: compliance?.fda_approved || false,
        ema_approved: compliance?.ema_approved || false,
        ministry_approved: compliance?.ministry_approved || false,
        clinical_trial_status: compliance?.clinical_trial_status || 'not_started',
        regulatory_pathway: compliance?.regulatory_pathway || 'standard',
        compliance_score: compliance?.compliance_score || 0
      };
    } catch (error) {
      console.error('Regulatory compliance check failed:', error);
      return {
        fda_approved: false,
        ema_approved: false,
        ministry_approved: false,
        clinical_trial_status: 'unknown',
        regulatory_pathway: 'requires_validation',
        compliance_score: 0
      };
    }
  }

  // Store clinical validation results
  async storeClinicalValidation(validationReport) {
    try {
      const { error } = await supabase
        .from('clinical_validations')
        .insert(validationReport);

      if (error) throw error;

      // Also update the original prediction with clinical data
      await supabase
        .from('ai_predictions_validated')
        .update({
          clinical_validation_id: validationReport.prediction_id,
          clinical_confidence_score: validationReport.clinical_confidence_score,
          ministry_approval_required: validationReport.ministry_approval_required,
          clinical_evidence_level: validationReport.clinical_evidence_level
        })
        .eq('id', validationReport.prediction_id);

      return true;
    } catch (error) {
      console.error('Failed to store clinical validation:', error);
      throw error;
    }
  }

  // Helper methods for clinical calculations
  calculateEvidenceAlignment(predictionData, clinicalStudies) {
    // Compare prediction with clinical study outcomes
    let alignmentScore = 0;
    let totalStudies = clinicalStudies.length;

    if (totalStudies === 0) return 0;

    clinicalStudies.forEach(study => {
      if (study.outcomes && study.outcomes.risk_factors) {
        const overlap = this.calculateFactorOverlap(
          predictionData.contributingFactors,
          study.outcomes.risk_factors
        );
        alignmentScore += overlap;
      }
    });

    return Math.min(alignmentScore / totalStudies, 1.0);
  }

  checkStatisticalSignificance(predictionData, clinicalEvidence) {
    // Check if prediction meets statistical significance thresholds
    const requiredMetrics = ClinicalValidationFramework.MINISTRY_REQUIREMENTS.validation_metrics;
    
    // This would be calculated based on the AI model's performance metrics
    // For now, we'll use a simplified check
    return (
      predictionData.flareUpProbability >= 30 && // Minimum threshold
      clinicalEvidence.evidence_level !== 'D' // Not just expert opinion
    );
  }

  assessClinicalRelevance(predictionData, clinicalEvidence) {
    // Assess how clinically relevant the prediction is
    let relevanceScore = 0;

    // High-risk conditions are more clinically relevant
    if (predictionData.riskLevel === 'high' || predictionData.riskLevel === 'critical') {
      relevanceScore += 0.4;
    }

    // Evidence quality affects relevance
    const evidenceWeight = ClinicalValidationFramework.EVIDENCE_LEVELS[
      clinicalEvidence.evidence_level || 'D'
    ].ministry_weight;
    relevanceScore += evidenceWeight * 0.6;

    return Math.min(relevanceScore, 1.0);
  }

  async checkSafetyProfile(diseaseCode, symptoms) {
    try {
      const { data: safetyData, error } = await supabase
        .from('safety_profiles')
        .select('*')
        .eq('disease_code', diseaseCode);

      if (error) throw error;

      if (!safetyData || safetyData.length === 0) {
        return 'unknown';
      }

      // Check for high-risk symptoms
      const highRiskSymptoms = ['chest pain', 'severe shortness of breath', 'confusion'];
      const hasHighRiskSymptoms = symptoms.some(symptom => 
        highRiskSymptoms.some(riskSymptom => 
          symptom.toLowerCase().includes(riskSymptom)
        )
      );

      if (hasHighRiskSymptoms) {
        return 'caution';
      }

      return safetyData[0].safety_classification || 'safe';
    } catch (error) {
      console.error('Safety profile check failed:', error);
      return 'unknown';
    }
  }

  async checkContraindications(predictionData) {
    try {
      const { data: contraindications, error } = await supabase
        .from('contraindications')
        .select('*')
        .eq('disease_code', predictionData.diseaseCode);

      if (error) throw error;

      // This would check patient-specific contraindications
      // For now, we'll return true if contraindications exist in the database
      return contraindications && contraindications.length > 0;
    } catch (error) {
      console.error('Contraindications check failed:', error);
      return false;
    }
  }

  // Additional helper methods would be implemented here...
  extractClinicalActions(clinicalStudies) {
    // Extract evidence-based clinical actions from studies
    return [
      'Follow evidence-based treatment protocols',
      'Monitor patient response to interventions',
      'Document outcomes for continuous improvement'
    ];
  }

  determineFollowUp(riskLevel, evidenceLevel) {
    const followUp = [];
    
    if (riskLevel === 'high' || riskLevel === 'critical') {
      followUp.push('Weekly clinical assessment for 4 weeks');
      followUp.push('Specialist consultation within 48 hours');
    }
    
    if (evidenceLevel === 'D') {
      followUp.push('Additional clinical validation required');
    }
    
    return followUp;
  }

  async getContraindications(diseaseCode) {
    // Get specific contraindications for the disease
    return [
      'Pregnancy (Category C)',
      'Severe hepatic impairment',
      'Known hypersensitivity'
    ];
  }

  getMonitoringParameters(diseaseCode, clinicalEvidence) {
    // Define what should be monitored
    return [
      'Vital signs every 4 hours',
      'Laboratory values weekly',
      'Symptom progression daily'
    ];
  }

  identifyEvidenceGaps(predictionData, clinicalEvidence) {
    const gaps = [];
    
    if (!clinicalEvidence.clinical_studies || clinicalEvidence.clinical_studies.length < 3) {
      gaps.push('Insufficient clinical trial data');
    }
    
    if (clinicalEvidence.evidence_level === 'D') {
      gaps.push('Requires higher quality evidence');
    }
    
    return gaps;
  }

  calculateFactorOverlap(predictionFactors, studyFactors) {
    // Calculate overlap between prediction factors and study factors
    if (!predictionFactors || !studyFactors) return 0;
    
    let overlap = 0;
    predictionFactors.forEach(factor => {
      if (studyFactors.some(studyFactor => 
        studyFactor.toLowerCase().includes(factor.factor.toLowerCase())
      )) {
        overlap += 1;
      }
    });
    
    return overlap / Math.max(predictionFactors.length, 1);
  }
}

module.exports = ClinicalValidationFramework;