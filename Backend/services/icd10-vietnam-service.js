/**
 * ICD-10 Vietnam Integration Service
 * Compliant with Ministry of Health standards
 */

const { createClient } = require('@supabase/supabase-js');

class ICD10VietnamService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }

  /**
   * Validate ICD-10 code against Vietnam Ministry of Health standards
   */
  async validateICD10Code(code) {
    try {
      const { data, error } = await this.supabase
        .from('icd10_vietnam_codes')
        .select('*')
        .eq('code', code)
        .eq('ministry_approved', true)
        .single();

      if (error) {
        throw new Error(`ICD-10 validation failed: ${error.message}`);
      }

      return {
        valid: true,
        code: data.code,
        description_vi: data.description_vietnamese,
        description_en: data.description_english,
        category: data.category,
        severity_level: data.severity_level,
        ministry_approved: data.ministry_approved,
        last_updated: data.last_updated
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Get approved treatment protocols for ICD-10 code
   */
  async getApprovedTreatmentProtocols(icd10Code) {
    const { data, error } = await this.supabase
      .from('ministry_treatment_protocols')
      .select(`
        *,
        clinical_guidelines (
          guideline_text,
          evidence_level,
          ministry_approval_date
        )
      `)
      .eq('icd10_code', icd10Code)
      .eq('ministry_approved', true);

    if (error) {
      throw new Error(`Failed to fetch treatment protocols: ${error.message}`);
    }

    return data;
  }

  /**
   * Submit prediction for Ministry review
   */
  async submitForMinistryReview(predictionData) {
    const reviewSubmission = {
      prediction_id: predictionData.id,
      icd10_code: predictionData.diseaseCode,
      symptoms: predictionData.symptoms,
      ai_confidence: predictionData.confidence,
      patient_demographics: predictionData.demographics,
      submission_date: new Date().toISOString(),
      review_status: 'pending_ministry_review',
      priority_level: this.calculatePriorityLevel(predictionData)
    };

    const { data, error } = await this.supabase
      .from('ministry_review_queue')
      .insert(reviewSubmission)
      .select()
      .single();

    if (error) {
      throw new Error(`Ministry submission failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Calculate priority level based on clinical severity
   */
  calculatePriorityLevel(predictionData) {
    const emergencyCodes = ['I21', 'I46', 'R57', 'J44.1', 'N17'];
    
    if (emergencyCodes.includes(predictionData.diseaseCode)) {
      return 'emergency';
    }
    
    if (predictionData.confidence < 0.7) {
      return 'high';
    }
    
    return 'standard';
  }

  /**
   * Generate Ministry compliance report
   */
  async generateComplianceReport(startDate, endDate) {
    const { data: predictions, error } = await this.supabase
      .from('ai_predictions')
      .select(`
        *,
        ministry_review_queue (
          review_status,
          ministry_approval_date
        )
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) {
      throw new Error(`Failed to generate compliance report: ${error.message}`);
    }

    const report = {
      period: { start: startDate, end: endDate },
      total_predictions: predictions.length,
      ministry_approved: predictions.filter(p => 
        p.ministry_review_queue?.review_status === 'approved'
      ).length,
      pending_review: predictions.filter(p => 
        p.ministry_review_queue?.review_status === 'pending_ministry_review'
      ).length,
      compliance_rate: 0,
      icd10_compliance: {
        valid_codes: 0,
        invalid_codes: 0,
        compliance_percentage: 0
      }
    };

    report.compliance_rate = (report.ministry_approved / report.total_predictions) * 100;

    return report;
  }
}

module.exports = ICD10VietnamService;