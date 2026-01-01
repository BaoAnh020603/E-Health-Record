/**
 * Ministry of Health Integration API
 * Vietnam Healthcare Compliance
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const ClinicalValidationService = require('../services/clinical-validation-service');
const ICD10VietnamService = require('../services/icd10-vietnam-service');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const clinicalValidation = new ClinicalValidationService();
const icd10Service = new ICD10VietnamService();

/**
 * Submit prediction for Ministry review
 */
router.post('/submit-for-review', async (req, res) => {
  try {
    const { predictionId, priority = 'standard' } = req.body;

    // Get prediction data
    const { data: prediction, error: predError } = await supabase
      .from('ai_predictions')
      .select('*')
      .eq('id', predictionId)
      .single();

    if (predError || !prediction) {
      return res.status(404).json({
        success: false,
        error: 'Prediction not found'
      });
    }

    // Validate prediction first
    const validation = await clinicalValidation.validatePrediction(prediction);
    
    if (!validation.ministry_compliance) {
      return res.status(400).json({
        success: false,
        error: 'Prediction does not meet Ministry compliance requirements',
        validation: validation
      });
    }

    // Submit for Ministry review
    const submission = await icd10Service.submitForMinistryReview({
      ...prediction,
      priority
    });

    res.json({
      success: true,
      submission: submission,
      validation: validation,
      message: 'Successfully submitted for Ministry review'
    });

  } catch (error) {
    console.error('Ministry submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit for Ministry review',
      details: error.message
    });
  }
});

/**
 * Get Ministry review status
 */
router.get('/review-status/:predictionId', async (req, res) => {
  try {
    const { predictionId } = req.params;

    const { data: review, error } = await supabase
      .from('ministry_review_queue')
      .select(`
        *,
        medical_professionals (
          full_name,
          specialty,
          license_number
        )
      `)
      .eq('prediction_id', predictionId)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: 'Review record not found'
      });
    }

    res.json({
      success: true,
      review: review
    });

  } catch (error) {
    console.error('Review status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get review status'
    });
  }
});

/**
 * Get approved ICD-10 codes
 */
router.get('/approved-icd10-codes', async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = supabase
      .from('icd10_vietnam_codes')
      .select('*')
      .eq('ministry_approved', true)
      .order('code');

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`code.ilike.%${search}%,description_vietnamese.ilike.%${search}%,description_english.ilike.%${search}%`);
    }

    const { data: codes, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      codes: codes,
      total: codes.length
    });

  } catch (error) {
    console.error('ICD-10 codes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get ICD-10 codes'
    });
  }
});

/**
 * Get treatment protocols
 */
router.get('/treatment-protocols/:icd10Code', async (req, res) => {
  try {
    const { icd10Code } = req.params;

    const protocols = await icd10Service.getApprovedTreatmentProtocols(icd10Code);

    res.json({
      success: true,
      protocols: protocols,
      icd10_code: icd10Code
    });

  } catch (error) {
    console.error('Treatment protocols error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get treatment protocols'
    });
  }
});

/**
 * Generate compliance report
 */
router.post('/compliance-report', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    // Generate ICD-10 compliance report
    const icd10Report = await icd10Service.generateComplianceReport(startDate, endDate);
    
    // Generate clinical validation report
    const clinicalReport = await clinicalValidation.generateMinistryReport(startDate, endDate);

    // Get quality metrics
    const { data: qualityMetrics } = await supabase
      .from('ministry_quality_metrics')
      .select('*')
      .gte('measurement_period_start', startDate)
      .lte('measurement_period_end', endDate);

    const report = {
      period: { start: startDate, end: endDate },
      icd10_compliance: icd10Report,
      clinical_validation: clinicalReport,
      quality_metrics: qualityMetrics || [],
      overall_compliance: {
        status: 'compliant', // Calculate based on thresholds
        score: Math.round((icd10Report.compliance_rate + clinicalReport.ministry_compliance_rate) / 2),
        recommendations: []
      },
      generated_at: new Date().toISOString()
    };

    // Add recommendations based on compliance scores
    if (report.overall_compliance.score < 90) {
      report.overall_compliance.recommendations.push(
        'Improve ICD-10 code validation accuracy',
        'Enhance clinical evidence documentation',
        'Increase professional review coverage'
      );
    }

    res.json({
      success: true,
      report: report
    });

  } catch (error) {
    console.error('Compliance report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate compliance report'
    });
  }
});

/**
 * Update Ministry review decision
 */
router.put('/review-decision/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { decision, notes, complianceScore } = req.body;

    // Verify reviewer is Ministry official
    const { data: reviewer } = await supabase
      .from('medical_professionals')
      .select('*')
      .eq('user_id', req.user?.id)
      .eq('role', 'ministry_official')
      .eq('verification_status', 'verified')
      .single();

    if (!reviewer) {
      return res.status(403).json({
        success: false,
        error: 'Only verified Ministry officials can update review decisions'
      });
    }

    const { data: updatedReview, error } = await supabase
      .from('ministry_review_queue')
      .update({
        review_status: decision,
        reviewer_id: reviewer.id,
        review_notes: notes,
        compliance_score: complianceScore,
        ministry_approval_date: decision === 'approved' ? new Date().toISOString() : null
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      review: updatedReview,
      message: `Review ${decision} successfully`
    });

  } catch (error) {
    console.error('Review decision error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update review decision'
    });
  }
});

/**
 * Get Ministry dashboard data
 */
router.get('/dashboard-data', async (req, res) => {
  try {
    // Get pending reviews
    const { data: pendingReviews } = await supabase
      .from('ministry_review_queue')
      .select('*')
      .eq('review_status', 'pending_ministry_review')
      .order('submission_date', { ascending: true });

    // Get recent approvals
    const { data: recentApprovals } = await supabase
      .from('ministry_review_queue')
      .select('*')
      .eq('review_status', 'approved')
      .order('ministry_approval_date', { ascending: false })
      .limit(10);

    // Get compliance metrics
    const { data: complianceMetrics } = await supabase
      .from('ministry_quality_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    // Get emergency cases
    const { data: emergencyCases } = await supabase
      .from('ministry_review_queue')
      .select('*')
      .eq('priority_level', 'emergency')
      .order('submission_date', { ascending: true });

    const dashboardData = {
      pending_reviews: {
        count: pendingReviews?.length || 0,
        items: pendingReviews || []
      },
      recent_approvals: {
        count: recentApprovals?.length || 0,
        items: recentApprovals || []
      },
      emergency_cases: {
        count: emergencyCases?.length || 0,
        items: emergencyCases || []
      },
      compliance_metrics: complianceMetrics || [],
      summary: {
        total_pending: pendingReviews?.length || 0,
        total_emergency: emergencyCases?.length || 0,
        avg_compliance_score: complianceMetrics?.length > 0 
          ? Math.round(complianceMetrics.reduce((sum, metric) => sum + metric.metric_value, 0) / complianceMetrics.length)
          : 0
      }
    };

    res.json({
      success: true,
      dashboard: dashboardData
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard data'
    });
  }
});

module.exports = router;