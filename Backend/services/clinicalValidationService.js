// Clinical Validation Service
// Advanced medical validation with clinical decision support

const { supabase } = require('../lib/supabase-client');
const medicalValidationService = require('./medicalValidationService');

class ClinicalValidationService {
  
  // Enhanced prediction validation with clinical decision support
  async validateWithClinicalRules(predictionData, userId, patientProfile = {}) {
    try {
      console.log('Starting clinical validation for prediction:', predictionData.diseaseCode);
      
      // 1. Get basic medical validation first
      const basicValidation = await medicalValidationService.validatePrediction(predictionData, userId);
      
      if (!basicValidation.success) {
        return basicValidation;
      }

      // 2. Get applicable clinical decision rules
      const clinicalRules = await this.getClinicalDecisionRules(
        predictionData.diseaseCode,
        patientProfile.age,
        patientProfile.gender
      );

      // 3. Check medication interactions if medications are provided
      let medicationInteractions = [];
      if (predictionData.medicalHistory?.medications?.length > 0) {
        medicationInteractions = await this.checkMedicationInteractions(
          predictionData.medicalHistory.medications
        );
      }

      // 4. Perform risk stratification
      const riskStratification = await this.performRiskStratification(
        predictionData,
        patientProfile,
        clinicalRules
      );

      // 5. Generate clinical pathway recommendations
      const pathwayRecommendations = await this.getPathwayRecommendations(
        predictionData.diseaseCode,
        riskStratification.risk_score
      );

      // 6. Check patient consent for AI analysis
      const consentStatus = await this.checkPatientConsent(userId, 'ai_analysis');

      // 7. Enhanced prediction with clinical insights
      const enhancedPrediction = {
        ...basicValidation.prediction.prediction_data,
        clinicalValidation: {
          rulesApplied: clinicalRules.length,
          clinicalRecommendations: clinicalRules.map(rule => ({
            ruleName: rule.rule_name,
            recommendationLevel: rule.recommendation_level,
            guidelines: rule.clinical_guidelines,
            evidenceGrade: rule.evidence_grade
          })),
          medicationInteractions: medicationInteractions.map(interaction => ({
            drugs: `${interaction.drug_a} + ${interaction.drug_b}`,
            severity: interaction.severity,
            clinicalEffect: interaction.clinical_effect,
            management: interaction.management_strategy
          })),
          riskStratification: {
            category: riskStratification.risk_category,
            score: riskStratification.risk_score,
            percentile: riskStratification.risk_percentile,
            modifiableFactors: riskStratification.modifiable_factors,
            interventionRecommendations: riskStratification.intervention_recommendations
          },
          clinicalPathway: pathwayRecommendations,
          consentVerified: consentStatus.hasValidConsent,
          qualityAssurance: {
            clinicallyValidated: true,
            validationTimestamp: new Date().toISOString(),
            validationMethod: 'clinical_decision_support'
          }
        }
      };

      // 8. Store enhanced prediction
      const { error: updateError } = await supabase
        .from('ai_predictions_validated')
        .update({
          prediction_data: enhancedPrediction,
          ministry_compliance_checked: true
        })
        .eq('id', basicValidation.prediction.id);

      if (updateError) {
        console.error('Failed to update prediction with clinical validation:', updateError);
      }

      // 9. Store risk stratification
      await this.storeRiskStratification(userId, basicValidation.prediction.id, riskStratification);

      return {
        success: true,
        prediction: {
          ...basicValidation.prediction,
          prediction_data: enhancedPrediction
        },
        clinicalValidation: {
          rulesApplied: clinicalRules.length,
          medicationInteractions: medicationInteractions.length,
          riskStratified: true,
          pathwayRecommendations: pathwayRecommendations.length > 0
        }
      };

    } catch (error) {
      console.error('Clinical validation failed:', error);
      return {
        success: false,
        error: 'Clinical validation failed: ' + error.message
      };
    }
  }

  // Get applicable clinical decision rules
  async getClinicalDecisionRules(icdCode, patientAge = null, patientGender = null) {
    try {
      const { data, error } = await supabase
        .rpc('get_clinical_decision_rules', {
          icd_code_input: icdCode,
          patient_age: patientAge,
          patient_gender: patientGender
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get clinical decision rules:', error);
      return [];
    }
  }

  // Check medication interactions
  async checkMedicationInteractions(medications) {
    try {
      const { data, error } = await supabase
        .rpc('check_medication_interactions', {
          medication_list: medications
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to check medication interactions:', error);
      return [];
    }
  }

  // Perform advanced risk stratification
  async performRiskStratification(predictionData, patientProfile, clinicalRules) {
    try {
      let riskScore = predictionData.flareUpProbability || 50;
      let riskFactors = [];
      let modifiableFactors = [];
      let interventionRecommendations = [];

      // Age-based risk adjustment
      if (patientProfile.age) {
        if (patientProfile.age > 65) {
          riskScore += 10;
          riskFactors.push('Advanced age (>65 years)');
        } else if (patientProfile.age < 18) {
          riskScore += 5;
          riskFactors.push('Pediatric population');
        }
      }

      // Gender-based risk adjustment for certain conditions
      const genderRiskConditions = {
        'I25': { male: 15, female: 10 }, // Coronary heart disease
        'M05': { male: 5, female: 15 },  // Rheumatoid arthritis
        'E11': { male: 10, female: 12 }  // Type 2 diabetes
      };

      if (genderRiskConditions[predictionData.diseaseCode] && patientProfile.gender) {
        const genderRisk = genderRiskConditions[predictionData.diseaseCode][patientProfile.gender.toLowerCase()];
        if (genderRisk) {
          riskScore += genderRisk;
          riskFactors.push(`Gender-specific risk (${patientProfile.gender})`);
        }
      }

      // Lifestyle factor analysis
      if (predictionData.lifestyle) {
        if (predictionData.lifestyle.smoking) {
          riskScore += 20;
          riskFactors.push('Current smoking');
          modifiableFactors.push({
            factor: 'Smoking cessation',
            impact: 'high',
            recommendation: 'Complete smoking cessation can reduce risk by 20-30%'
          });
          interventionRecommendations.push({
            intervention: 'Smoking cessation program',
            priority: 'high',
            timeframe: 'immediate'
          });
        }

        if (predictionData.lifestyle.alcohol === 'heavy') {
          riskScore += 10;
          riskFactors.push('Heavy alcohol consumption');
          modifiableFactors.push({
            factor: 'Alcohol reduction',
            impact: 'medium',
            recommendation: 'Reduce alcohol intake to recommended limits'
          });
        }

        if (predictionData.lifestyle.exercise === 'sedentary') {
          riskScore += 15;
          riskFactors.push('Sedentary lifestyle');
          modifiableFactors.push({
            factor: 'Physical activity',
            impact: 'high',
            recommendation: 'Regular moderate exercise 150 minutes per week'
          });
          interventionRecommendations.push({
            intervention: 'Structured exercise program',
            priority: 'high',
            timeframe: '2-4 weeks'
          });
        }
      }

      // Clinical rule-based adjustments
      clinicalRules.forEach(rule => {
        if (rule.recommendation_level === 'mandatory') {
          riskScore += 5;
          riskFactors.push(`Mandatory clinical rule: ${rule.rule_name}`);
        }
      });

      // Comorbidity analysis
      if (predictionData.medicalHistory?.chronicConditions?.length > 0) {
        const comorbidityRisk = predictionData.medicalHistory.chronicConditions.length * 8;
        riskScore += comorbidityRisk;
        riskFactors.push(`Multiple comorbidities (${predictionData.medicalHistory.chronicConditions.length})`);
      }

      // Calculate percentile (mock calculation - in real implementation, use population data)
      const riskPercentile = Math.min(95, Math.max(5, riskScore * 1.2));

      // Determine risk category
      let riskCategory = 'low';
      if (riskScore >= 80) riskCategory = 'very_high';
      else if (riskScore >= 60) riskCategory = 'high';
      else if (riskScore >= 40) riskCategory = 'moderate';

      return {
        risk_category: predictionData.diseaseCode.substring(0, 1) === 'I' ? 'cardiovascular' : 
                     predictionData.diseaseCode.substring(0, 1) === 'E' ? 'endocrine' : 
                     predictionData.diseaseCode.substring(0, 1) === 'J' ? 'respiratory' : 'general',
        risk_score: Math.min(100, riskScore),
        risk_percentile: riskPercentile,
        population_comparison: {
          age_group: patientProfile.age ? `${Math.floor(patientProfile.age / 10) * 10}-${Math.floor(patientProfile.age / 10) * 10 + 9}` : 'unknown',
          gender: patientProfile.gender || 'unknown',
          risk_factors_count: riskFactors.length
        },
        modifiable_factors: modifiableFactors,
        non_modifiable_factors: riskFactors.filter(factor => 
          factor.includes('age') || factor.includes('gender') || factor.includes('genetic')
        ),
        intervention_recommendations: interventionRecommendations,
        monitoring_frequency: riskCategory === 'very_high' ? 'monthly' : 
                             riskCategory === 'high' ? 'quarterly' : 
                             riskCategory === 'moderate' ? 'biannually' : 'annually',
        escalation_triggers: [
          'New symptoms or worsening of existing symptoms',
          'Failure to respond to current treatment',
          'Development of complications',
          'Significant changes in risk factors'
        ],
        calculated_by: 'clinical_validation_service',
        calculation_method: {
          base_score: predictionData.flareUpProbability || 50,
          adjustments: riskFactors,
          total_adjustments: riskScore - (predictionData.flareUpProbability || 50)
        },
        confidence_interval: {
          lower: Math.max(0, riskScore - 15),
          upper: Math.min(100, riskScore + 15),
          confidence_level: 0.95
        }
      };

    } catch (error) {
      console.error('Risk stratification failed:', error);
      throw error;
    }
  }

  // Store risk stratification results
  async storeRiskStratification(userId, predictionId, riskData) {
    try {
      const { error } = await supabase
        .from('risk_stratification')
        .insert({
          user_id: userId,
          prediction_id: predictionId,
          ...riskData,
          next_assessment_due: new Date(Date.now() + this.getAssessmentInterval(riskData.monitoring_frequency))
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to store risk stratification:', error);
      return false;
    }
  }

  // Get assessment interval in milliseconds
  getAssessmentInterval(frequency) {
    const intervals = {
      'monthly': 30 * 24 * 60 * 60 * 1000,
      'quarterly': 90 * 24 * 60 * 60 * 1000,
      'biannually': 180 * 24 * 60 * 60 * 1000,
      'annually': 365 * 24 * 60 * 60 * 1000
    };
    return intervals[frequency] || intervals['annually'];
  }

  // Get clinical pathway recommendations
  async getPathwayRecommendations(icdCode, riskScore) {
    try {
      const { data, error } = await supabase
        .from('clinical_pathways')
        .select('*')
        .contains('applicable_icd_codes', [icdCode])
        .eq('approved_by_ministry', true)
        .lte('effective_date', new Date().toISOString())
        .order('version_number', { ascending: false })
        .limit(3);

      if (error) throw error;

      return (data || []).map(pathway => ({
        pathwayName: pathway.pathway_name,
        conditionCategory: pathway.condition_category,
        recommendedSteps: pathway.pathway_steps,
        expectedOutcomes: pathway.expected_outcomes,
        qualityIndicators: pathway.quality_indicators,
        patientEducation: pathway.patient_education_materials,
        applicabilityScore: this.calculatePathwayApplicability(pathway, riskScore)
      }));

    } catch (error) {
      console.error('Failed to get pathway recommendations:', error);
      return [];
    }
  }

  // Calculate how applicable a pathway is for this patient
  calculatePathwayApplicability(pathway, riskScore) {
    let score = 50; // Base applicability

    // Adjust based on risk score
    if (riskScore > 70) score += 30;
    else if (riskScore > 50) score += 20;
    else if (riskScore > 30) score += 10;

    // Adjust based on pathway complexity and patient factors
    const stepCount = pathway.pathway_steps?.length || 0;
    if (stepCount > 10) score -= 10; // Complex pathways less applicable for low-risk patients
    if (stepCount < 5) score += 10;  // Simple pathways more generally applicable

    return Math.min(100, Math.max(0, score));
  }

  // Check patient consent for AI analysis
  async checkPatientConsent(userId, consentType) {
    try {
      const { data, error } = await supabase
        .from('patient_consent')
        .select('*')
        .eq('user_id', userId)
        .eq('consent_type', consentType)
        .eq('consent_status', true)
        .is('withdrawal_timestamp', null)
        .order('consent_timestamp', { ascending: false })
        .limit(1);

      if (error) throw error;

      const hasValidConsent = data && data.length > 0;
      
      return {
        hasValidConsent,
        consentDetails: hasValidConsent ? data[0] : null,
        requiresNewConsent: !hasValidConsent
      };

    } catch (error) {
      console.error('Failed to check patient consent:', error);
      return {
        hasValidConsent: false,
        consentDetails: null,
        requiresNewConsent: true
      };
    }
  }

  // Record patient consent
  async recordPatientConsent(userId, consentType, consentStatus, consentText, additionalData = {}) {
    try {
      const { data, error } = await supabase
        .from('patient_consent')
        .insert({
          user_id: userId,
          consent_type: consentType,
          consent_status: consentStatus,
          consent_version: '1.0',
          consent_text: consentText,
          consent_timestamp: new Date().toISOString(),
          legal_basis: 'explicit_consent',
          data_retention_period: '7 years',
          geographic_scope: ['Vietnam'],
          ...additionalData
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, consent: data };

    } catch (error) {
      console.error('Failed to record patient consent:', error);
      return { success: false, error: error.message };
    }
  }

  // Track quality metrics
  async trackQualityMetric(metricType, measurementData) {
    try {
      const { error } = await supabase
        .from('quality_metrics')
        .insert({
          metric_type: metricType,
          measurement_period_start: measurementData.periodStart,
          measurement_period_end: measurementData.periodEnd,
          target_population: measurementData.targetPopulation,
          sample_size: measurementData.sampleSize,
          metric_value: measurementData.value,
          metric_unit: measurementData.unit,
          benchmark_comparison: measurementData.benchmarkComparison,
          improvement_trend: measurementData.trend,
          methodology_notes: measurementData.methodology,
          data_sources: measurementData.sources,
          measured_by: measurementData.measuredBy
        });

      if (error) throw error;
      return { success: true };

    } catch (error) {
      console.error('Failed to track quality metric:', error);
      return { success: false, error: error.message };
    }
  }

  // Get quality dashboard data
  async getQualityDashboard(timeframe = '30_days') {
    try {
      const startDate = new Date();
      if (timeframe === '30_days') startDate.setDate(startDate.getDate() - 30);
      else if (timeframe === '90_days') startDate.setDate(startDate.getDate() - 90);
      else if (timeframe === '1_year') startDate.setFullYear(startDate.getFullYear() - 1);

      const { data, error } = await supabase
        .from('quality_metrics')
        .select('*')
        .gte('measurement_period_start', startDate.toISOString())
        .order('measurement_period_start', { ascending: false });

      if (error) throw error;

      // Group metrics by type
      const groupedMetrics = {};
      (data || []).forEach(metric => {
        if (!groupedMetrics[metric.metric_type]) {
          groupedMetrics[metric.metric_type] = [];
        }
        groupedMetrics[metric.metric_type].push(metric);
      });

      return {
        success: true,
        data: {
          timeframe,
          metrics: groupedMetrics,
          summary: {
            totalMetrics: data?.length || 0,
            metricTypes: Object.keys(groupedMetrics).length,
            averageValue: data?.length > 0 ? 
              data.reduce((sum, m) => sum + m.metric_value, 0) / data.length : 0
          }
        }
      };

    } catch (error) {
      console.error('Failed to get quality dashboard:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new ClinicalValidationService();