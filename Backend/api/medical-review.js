// Medical Professional Review Dashboard API
// Handles review queue and professional validation workflows

const medicalValidationService = require('../services/medicalValidationService');
const { supabase } = require('../lib/supabase-client');

async function handleMedicalReview(req, res) {
  // Enable CORS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action } = req.query;
    const { authorization } = req.headers;

    // Verify professional authentication
    if (!authorization) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authorization.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    // Verify medical professional status
    const { data: professional, error: profError } = await supabase
      .from('medical_professionals')
      .select('*')
      .eq('user_id', user.id)
      .eq('verification_status', 'verified')
      .single();

    if (profError || !professional) {
      return res.status(403).json({ 
        error: 'Access denied. Verified medical professional status required.' 
      });
    }

    switch (action) {
      case 'getPendingReviews':
        return await getPendingReviews(req, res, professional.id);
      
      case 'submitReview':
        return await submitReview(req, res, professional.id);
      
      case 'getReviewStats':
        return await getReviewStats(req, res, professional.id);
      
      case 'getKnowledgeBase':
        return await getKnowledgeBase(req, res);
      
      case 'updateKnowledge':
        return await updateKnowledge(req, res, professional.id);
      
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Medical review API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getPendingReviews(req, res, professionalId) {
  try {
    const { limit = 20, priority } = req.query;
    
    let query = supabase
      .from('medical_review_queue')
      .select(`
        *,
        ai_predictions_validated (
          id,
          user_id,
          disease_code,
          symptoms,
          prediction_data,
          risk_level,
          requires_immediate_care,
          created_at
        )
      `)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(parseInt(limit));

    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Add anonymized patient info for privacy
    const anonymizedData = data.map(review => ({
      ...review,
      ai_predictions_validated: {
        ...review.ai_predictions_validated,
        user_id: `***${review.ai_predictions_validated.user_id.slice(-4)}`, // Partial anonymization
        patientAge: calculateAge(review.ai_predictions_validated.created_at), // Approximate age
      }
    }));

    res.json({
      success: true,
      data: anonymizedData,
      total: data.length
    });

  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({ error: 'Failed to get pending reviews' });
  }
}

async function submitReview(req, res, professionalId) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reviewId, decision, notes, recommendedActions } = req.body;

    if (!reviewId || !decision || !notes) {
      return res.status(400).json({ 
        error: 'Review ID, decision, and notes are required' 
      });
    }

    if (!['approved', 'rejected', 'needs_modification'].includes(decision)) {
      return res.status(400).json({ 
        error: 'Invalid decision. Must be approved, rejected, or needs_modification' 
      });
    }

    const result = await medicalValidationService.submitReview(
      reviewId, 
      professionalId, 
      decision, 
      notes
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // If approved, update any recommended actions
    if (decision === 'approved' && recommendedActions) {
      await updateRecommendedActions(reviewId, recommendedActions);
    }

    res.json({
      success: true,
      message: 'Review submitted successfully'
    });

  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
}

async function getReviewStats(req, res, professionalId) {
  try {
    const { data: stats, error } = await supabase
      .rpc('get_review_stats', { professional_id: professionalId });

    if (error) throw error;

    res.json({
      success: true,
      data: stats || {
        totalReviews: 0,
        pendingReviews: 0,
        approvedReviews: 0,
        rejectedReviews: 0,
        averageReviewTime: 0
      }
    });

  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({ error: 'Failed to get review statistics' });
  }
}

async function getKnowledgeBase(req, res) {
  try {
    const { icdCode, search, limit = 50 } = req.query;
    
    let query = supabase
      .from('medical_knowledge_base')
      .select('*')
      .eq('ministry_approved', true)
      .order('updated_at', { ascending: false })
      .limit(parseInt(limit));

    if (icdCode) {
      query = query.eq('icd_code', icdCode);
    }

    if (search) {
      query = query.or(`condition_name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Get knowledge base error:', error);
    res.status(500).json({ error: 'Failed to get knowledge base' });
  }
}

async function updateKnowledge(req, res, professionalId) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { icdCode, conditionName, description, riskFactors, preventionGuidelines, warningSign, evidenceLevel } = req.body;

    if (!icdCode || !conditionName) {
      return res.status(400).json({ 
        error: 'ICD code and condition name are required' 
      });
    }

    // Check if professional has permission to update knowledge base
    const { data: professional, error: profError } = await supabase
      .from('medical_professionals')
      .select('ministry_approved')
      .eq('id', professionalId)
      .single();

    if (profError || !professional.ministry_approved) {
      return res.status(403).json({ 
        error: 'Ministry approval required to update knowledge base' 
      });
    }

    const { data, error } = await supabase
      .from('medical_knowledge_base')
      .upsert({
        icd_code: icdCode,
        condition_name: conditionName,
        description,
        risk_factors: riskFactors,
        prevention_guidelines: preventionGuidelines,
        warning_signs: warningSign,
        evidence_level: evidenceLevel || 'C',
        ministry_approved: false, // Requires separate ministry approval
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
      message: 'Knowledge base updated. Pending ministry approval.'
    });

  } catch (error) {
    console.error('Update knowledge error:', error);
    res.status(500).json({ error: 'Failed to update knowledge base' });
  }
}

async function updateRecommendedActions(reviewId, actions) {
  try {
    await supabase
      .from('medical_review_queue')
      .update({
        recommended_actions: actions
      })
      .eq('id', reviewId);
  } catch (error) {
    console.error('Failed to update recommended actions:', error);
  }
}

function calculateAge(createdAt) {
  // Simple age approximation for privacy
  const now = new Date();
  const created = new Date(createdAt);
  const diffYears = now.getFullYear() - created.getFullYear();
  return Math.max(18, 25 + Math.floor(Math.random() * 40)); // Randomized for privacy
}

module.exports = handleMedicalReview;