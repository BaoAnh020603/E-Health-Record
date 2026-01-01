// Ministry of Health Integration Service
// Handles official validation, approval processes, and regulatory compliance

const { supabase } = require('../lib/supabase-client');
const ClinicalValidationFramework = require('../clinical-validation/clinical-validation-framework');

class MinistryIntegrationService {
  
  constructor() {
    this.clinicalValidator = new ClinicalValidationFramework();
    
    // Ministry of Health API endpoints (would be real endpoints)
    this.ministryEndpoints = {
      submission: process.env.MINISTRY_SUBMISSION_ENDPOINT || 'https://api.moh.gov.vn/submissions',
      validation: process.env.MINISTRY_VALIDATION_ENDPOINT || 'https://api.moh.gov.vn/validations',
      approval: process.env.MINISTRY_APPROVAL_ENDPOINT || 'https://api.moh.gov.vn/approvals',
      compliance: process.env.MINISTRY_COMPLIANCE_ENDPOINT || 'https://api.moh.gov.vn/compliance'
    };
    
    // Ministry requirements for AI medical devices
    this.ministryRequirements = {
      clinical_validation: {
        minimum_sample_size: 1000,
        minimum_sensitivity: 0.85,
        minimum_specificity: 0.90,
        minimum_ppv: 0.80,
        minimum_npv: 0.95,
        required_evidence_level: 'B' // At least RCT evidence
      },
      documentation: {
        clinical_protocol: true,
        statistical_analysis_plan: true,
        adverse_event_reporting: true,
        quality_management_system: true,
        risk_management_file: true,
        clinical_evaluation_report: true
      },
      regulatory_pathway: {
        medical_device_classification: 'Class IIa', // AI diagnostic tools
        conformity_assessment: 'CE_marking',
        post_market_surveillance: true,
        periodic_safety_updates: true
      }
    };
  }

  // Submit AI prediction system for Ministry approval
  async submitForMinistryApproval(predictionSystemData) {
    try {
      console.log('🏛️ Initiating Ministry of Health submission process...');
      
      // 1. Validate system meets Ministry requirements
      const preSubmissionValidation = await this.validateMinistryRequirements(
        predictionSystemData
      );
      
      if (!preSubmissionValidation.meets_requirements) {
        return {
          success: false,
          error: 'System does not meet Ministry requirements',
          requirements_gaps: preSubmissionValidation.gaps,
          recommendations: preSubmissionValidation.recommendations
        };
      }
      
      // 2. Prepare submission package
      const submissionPackage = await this.prepareSubmissionPackage(
        predictionSystemData
      );
      
      // 3. Submit to Ministry review queue
      const submissionResult = await this.submitToMinistryQueue(
        submissionPackage
      );
      
      // 4. Track submission status
      await this.trackSubmissionStatus(submissionResult.submission_id);
      
      return {
        success: true,
        submission_id: submissionResult.submission_id,
        estimated_review_time: submissionResult.estimated_review_time,
        next_steps: submissionResult.next_steps,
        tracking_url: submissionResult.tracking_url
      };
      
    } catch (error) {
      console.error('Ministry submission failed:', error);
      return {
        success: false,
        error: 'Ministry submission process failed',
        details: error.message
      };
    }
  }

  // Validate system meets Ministry of Health requirements
  async validateMinistryRequirements(systemData) {
    const validation = {
      meets_requirements: true,
      gaps: [],
      recommendations: [],
      compliance_score: 0
    };

    try {
      // Check clinical validation requirements
      const clinicalValidation = await this.checkClinicalValidationRequirements(
        systemData
      );
      
      if (!clinicalValidation.meets_standards) {
        validation.meets_requirements = false;
        validation.gaps.push(...clinicalValidation.gaps);
        validation.recommendations.push(...clinicalValidation.recommendations);
      }
      
      // Check documentation requirements
      const documentationValidation = await this.checkDocumentationRequirements(
        systemData
      );
      
      if (!documentationValidation.complete) {
        validation.meets_requirements = false;
        validation.gaps.push(...documentationValidation.missing_documents);
      }
      
      // Check regulatory compliance
      const regulatoryValidation = await this.checkRegulatoryCompliance(
        systemData
      );
      
      if (!regulatoryValidation.compliant) {
        validation.meets_requirements = false;
        validation.gaps.push(...regulatoryValidation.compliance_gaps);
      }
      
      // Calculate overall compliance score
      validation.compliance_score = this.calculateComplianceScore(
        clinicalValidation,
        documentationValidation,
        regulatoryValidation
      );
      
      return validation;
      
    } catch (error) {
      console.error('Ministry requirements validation failed:', error);
      validation.meets_requirements = false;
      validation.gaps.push('Unable to validate Ministry requirements');
      return validation;
    }
  }

  // Check clinical validation requirements
  async checkClinicalValidationRequirements(systemData) {
    const requirements = this.ministryRequirements.clinical_validation;
    const validation = {
      meets_standards: true,
      gaps: [],
      recommendations: []
    };

    try {
      // Check performance metrics
      const { data: performanceMetrics, error } = await supabase
        .from('clinical_performance_metrics')
        .select('*')
        .eq('model_version', systemData.model_version)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !performanceMetrics) {
        validation.meets_standards = false;
        validation.gaps.push('No clinical performance metrics available');
        validation.recommendations.push('Conduct clinical validation study');
        return validation;
      }

      // Check sensitivity
      if (performanceMetrics.sensitivity < requirements.minimum_sensitivity) {
        validation.meets_standards = false;
        validation.gaps.push(
          `Sensitivity ${performanceMetrics.sensitivity} below required ${requirements.minimum_sensitivity}`
        );
        validation.recommendations.push('Improve model sensitivity through additional training');
      }

      // Check specificity
      if (performanceMetrics.specificity < requirements.minimum_specificity) {
        validation.meets_standards = false;
        validation.gaps.push(
          `Specificity ${performanceMetrics.specificity} below required ${requirements.minimum_specificity}`
        );
        validation.recommendations.push('Improve model specificity to reduce false positives');
      }

      // Check sample size
      if (performanceMetrics.sample_size < requirements.minimum_sample_size) {
        validation.meets_standards = false;
        validation.gaps.push(
          `Sample size ${performanceMetrics.sample_size} below required ${requirements.minimum_sample_size}`
        );
        validation.recommendations.push('Conduct larger clinical validation study');
      }

      // Check evidence level
      const { data: evidenceData, error: evidenceError } = await supabase
        .from('clinical_evidence_base')
        .select('evidence_level')
        .in('icd_code', systemData.supported_conditions)
        .eq('ministry_validated', true);

      if (evidenceError || !evidenceData || evidenceData.length === 0) {
        validation.meets_standards = false;
        validation.gaps.push('No Ministry-validated clinical evidence available');
        validation.recommendations.push('Obtain Ministry validation for clinical evidence');
      } else {
        const hasRequiredEvidence = evidenceData.some(
          evidence => ['A', 'B'].includes(evidence.evidence_level)
        );
        
        if (!hasRequiredEvidence) {
          validation.meets_standards = false;
          validation.gaps.push('Insufficient evidence level (requires A or B level evidence)');
          validation.recommendations.push('Conduct randomized controlled trials or meta-analyses');
        }
      }

      return validation;
      
    } catch (error) {
      console.error('Clinical validation check failed:', error);
      validation.meets_standards = false;
      validation.gaps.push('Clinical validation check failed');
      return validation;
    }
  }

  // Check documentation requirements
  async checkDocumentationRequirements(systemData) {
    const requiredDocs = this.ministryRequirements.documentation;
    const validation = {
      complete: true,
      missing_documents: [],
      document_status: {}
    };

    try {
      // Check each required document
      for (const [docType, required] of Object.entries(requiredDocs)) {
        if (required) {
          const hasDocument = await this.checkDocumentExists(
            systemData.system_id,
            docType
          );
          
          validation.document_status[docType] = hasDocument;
          
          if (!hasDocument) {
            validation.complete = false;
            validation.missing_documents.push(docType);
          }
        }
      }

      return validation;
      
    } catch (error) {
      console.error('Documentation check failed:', error);
      validation.complete = false;
      validation.missing_documents.push('Documentation check failed');
      return validation;
    }
  }

  // Check regulatory compliance
  async checkRegulatoryCompliance(systemData) {
    const validation = {
      compliant: true,
      compliance_gaps: [],
      regulatory_status: {}
    };

    try {
      // Check medical device classification
      const deviceClassification = await this.checkDeviceClassification(
        systemData.system_id
      );
      
      validation.regulatory_status.device_classification = deviceClassification;
      
      if (deviceClassification !== this.ministryRequirements.regulatory_pathway.medical_device_classification) {
        validation.compliant = false;
        validation.compliance_gaps.push(
          `Incorrect device classification: ${deviceClassification}, required: ${this.ministryRequirements.regulatory_pathway.medical_device_classification}`
        );
      }

      // Check conformity assessment
      const conformityAssessment = await this.checkConformityAssessment(
        systemData.system_id
      );
      
      validation.regulatory_status.conformity_assessment = conformityAssessment;
      
      if (!conformityAssessment.completed) {
        validation.compliant = false;
        validation.compliance_gaps.push('Conformity assessment not completed');
      }

      // Check post-market surveillance plan
      const surveillancePlan = await this.checkPostMarketSurveillance(
        systemData.system_id
      );
      
      validation.regulatory_status.post_market_surveillance = surveillancePlan;
      
      if (!surveillancePlan.exists) {
        validation.compliant = false;
        validation.compliance_gaps.push('Post-market surveillance plan required');
      }

      return validation;
      
    } catch (error) {
      console.error('Regulatory compliance check failed:', error);
      validation.compliant = false;
      validation.compliance_gaps.push('Regulatory compliance check failed');
      return validation;
    }
  }

  // Prepare comprehensive submission package for Ministry
  async prepareSubmissionPackage(systemData) {
    const submissionPackage = {
      system_information: {
        system_id: systemData.system_id,
        system_name: systemData.system_name,
        version: systemData.model_version,
        intended_use: systemData.intended_use,
        target_population: systemData.target_population,
        supported_conditions: systemData.supported_conditions
      },
      clinical_evidence: await this.compileClinicalEvidence(systemData),
      performance_metrics: await this.compilePerformanceMetrics(systemData),
      safety_data: await this.compileSafetyData(systemData),
      regulatory_documentation: await this.compileRegulatoryDocumentation(systemData),
      quality_management: await this.compileQualityManagement(systemData),
      risk_management: await this.compileRiskManagement(systemData),
      post_market_plan: await this.compilePostMarketPlan(systemData)
    };

    return submissionPackage;
  }

  // Submit to Ministry review queue
  async submitToMinistryQueue(submissionPackage) {
    try {
      // Create Ministry review queue entry
      const { data: queueEntry, error } = await supabase
        .from('ministry_review_queue')
        .insert({
          clinical_validation_id: submissionPackage.system_information.system_id,
          review_priority: this.determineReviewPriority(submissionPackage),
          submission_documents: submissionPackage,
          review_checklist: this.generateReviewChecklist(submissionPackage)
        })
        .select()
        .single();

      if (error) throw error;

      // In a real implementation, this would call the actual Ministry API
      const ministryResponse = await this.callMinistryAPI(
        'submission',
        submissionPackage
      );

      return {
        submission_id: queueEntry.id,
        ministry_reference: ministryResponse.reference_number,
        estimated_review_time: ministryResponse.estimated_review_time || '90 days',
        next_steps: [
          'Ministry will conduct initial review within 30 days',
          'Clinical expert panel review if required',
          'Final approval decision within 90 days'
        ],
        tracking_url: `${this.ministryEndpoints.submission}/${queueEntry.id}`
      };
      
    } catch (error) {
      console.error('Ministry queue submission failed:', error);
      throw new Error('Failed to submit to Ministry review queue');
    }
  }

  // Track submission status with Ministry
  async trackSubmissionStatus(submissionId) {
    try {
      // Get current status from database
      const { data: queueEntry, error } = await supabase
        .from('ministry_review_queue')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (error) throw error;

      // In real implementation, would call Ministry API for status updates
      const ministryStatus = await this.callMinistryAPI(
        'status',
        { submission_id: submissionId }
      );

      // Update local status
      await supabase
        .from('ministry_review_queue')
        .update({
          review_status: ministryStatus.status,
          reviewer_notes: ministryStatus.notes,
          review_start_date: ministryStatus.review_start_date
        })
        .eq('id', submissionId);

      return {
        status: ministryStatus.status,
        progress: ministryStatus.progress,
        estimated_completion: ministryStatus.estimated_completion,
        next_milestone: ministryStatus.next_milestone
      };
      
    } catch (error) {
      console.error('Status tracking failed:', error);
      return {
        status: 'unknown',
        error: 'Unable to track submission status'
      };
    }
  }

  // Helper methods for compilation and validation
  async compileClinicalEvidence(systemData) {
    const { data: evidence, error } = await supabase
      .from('clinical_evidence_base')
      .select(`
        *,
        clinical_studies (*)
      `)
      .in('icd_code', systemData.supported_conditions)
      .eq('ministry_validated', true);

    return evidence || [];
  }

  async compilePerformanceMetrics(systemData) {
    const { data: metrics, error } = await supabase
      .from('clinical_performance_metrics')
      .select('*')
      .eq('model_version', systemData.model_version);

    return metrics || [];
  }

  async compileSafetyData(systemData) {
    const { data: safety, error } = await supabase
      .from('safety_profiles')
      .select('*')
      .in('disease_code', systemData.supported_conditions);

    return safety || [];
  }

  async compileRegulatoryDocumentation(systemData) {
    // Compile all regulatory documents
    return {
      device_classification: await this.checkDeviceClassification(systemData.system_id),
      conformity_assessment: await this.checkConformityAssessment(systemData.system_id),
      ce_marking: await this.checkCEMarking(systemData.system_id),
      iso_compliance: await this.checkISOCompliance(systemData.system_id)
    };
  }

  async compileQualityManagement(systemData) {
    // Quality management system documentation
    return {
      iso_13485_compliance: true,
      quality_manual: 'QM-001-v2.1',
      design_controls: 'DC-001-v1.3',
      risk_management: 'RM-001-v1.2'
    };
  }

  async compileRiskManagement(systemData) {
    // Risk management file per ISO 14971
    return {
      risk_analysis: await this.getRiskAnalysis(systemData.system_id),
      risk_mitigation: await this.getRiskMitigation(systemData.system_id),
      residual_risks: await this.getResidualRisks(systemData.system_id)
    };
  }

  async compilePostMarketPlan(systemData) {
    // Post-market surveillance plan
    return {
      surveillance_plan: await this.getPostMarketPlan(systemData.system_id),
      adverse_event_reporting: await this.getAdverseEventPlan(systemData.system_id),
      periodic_updates: await this.getPeriodicUpdatePlan(systemData.system_id)
    };
  }

  // Mock Ministry API calls (would be real API calls in production)
  async callMinistryAPI(endpoint, data) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock responses based on endpoint
    switch (endpoint) {
      case 'submission':
        return {
          reference_number: `MOH-${Date.now()}`,
          estimated_review_time: '90 days',
          status: 'submitted'
        };
      
      case 'status':
        return {
          status: 'under_review',
          progress: 25,
          estimated_completion: '2024-06-15',
          next_milestone: 'Clinical expert panel review'
        };
      
      default:
        return { status: 'unknown' };
    }
  }

  // Additional helper methods would be implemented here...
  calculateComplianceScore(clinical, documentation, regulatory) {
    let score = 0;
    
    if (clinical.meets_standards) score += 40;
    if (documentation.complete) score += 30;
    if (regulatory.compliant) score += 30;
    
    return score;
  }

  determineReviewPriority(submissionPackage) {
    // Determine review priority based on risk and innovation
    const conditions = submissionPackage.system_information.supported_conditions;
    const highRiskConditions = ['I21', 'I46', 'R57']; // Heart attack, cardiac arrest, shock
    
    if (conditions.some(condition => highRiskConditions.includes(condition))) {
      return 'high';
    }
    
    return 'standard';
  }

  generateReviewChecklist(submissionPackage) {
    return {
      clinical_evidence_review: false,
      performance_metrics_review: false,
      safety_assessment: false,
      regulatory_compliance_check: false,
      expert_panel_review: false,
      final_approval_decision: false
    };
  }

  // Placeholder methods for document and compliance checks
  async checkDocumentExists(systemId, docType) {
    // Would check document management system
    return Math.random() > 0.3; // Mock: 70% chance document exists
  }

  async checkDeviceClassification(systemId) {
    return 'Class IIa'; // AI diagnostic tools typically Class IIa
  }

  async checkConformityAssessment(systemId) {
    return { completed: true, certificate: 'CE-2024-001' };
  }

  async checkPostMarketSurveillance(systemId) {
    return { exists: true, plan_id: 'PMS-001' };
  }

  async checkCEMarking(systemId) {
    return { valid: true, certificate: 'CE-2024-001' };
  }

  async checkISOCompliance(systemId) {
    return {
      iso_13485: true,
      iso_14971: true,
      iso_62304: true
    };
  }

  async getRiskAnalysis(systemId) {
    return { document: 'RA-001-v1.2', risks_identified: 15, high_risks: 2 };
  }

  async getRiskMitigation(systemId) {
    return { document: 'RM-001-v1.1', mitigations_implemented: 13 };
  }

  async getResidualRisks(systemId) {
    return { document: 'RR-001-v1.0', residual_risks: 2, acceptable: true };
  }

  async getPostMarketPlan(systemId) {
    return { document: 'PMS-001-v1.0', surveillance_methods: ['clinical_follow_up', 'literature_review'] };
  }

  async getAdverseEventPlan(systemId) {
    return { document: 'AE-001-v1.0', reporting_timeline: '24_hours' };
  }

  async getPeriodicUpdatePlan(systemId) {
    return { document: 'PU-001-v1.0', update_frequency: 'annual' };
  }
}

module.exports = MinistryIntegrationService;