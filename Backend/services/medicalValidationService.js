// Medical Validation Service
// Handles validation, safety checks, and professional review workflows

const { supabase } = require('../lib/supabase-client');

class MedicalValidationService {
  
  // Check if symptoms indicate emergency situation
  async checkEmergencyProtocols(symptoms, diseaseCode) {
    try {
      const { data: protocols, error } = await supabase
        .from('emergency_protocols')
        .select('*');

      if (error) throw error;

      const emergencyTriggers = [];
      const symptomText = symptoms.join(' ').toLowerCase();

      for (const protocol of protocols) {
        const keywords = protocol.trigger_keywords;
        const hasMatch = keywords.some(keyword => 
          symptomText.includes(keyword.toLowerCase())
        );

        if (hasMatch) {
          emergencyTriggers.push({
            level: protocol.emergency_level,
            protocol: protocol.protocol_actions,
            contact: protocol.contact_info,
            condition: protocol.condition_pattern
          });
        }
      }

      return {
        isEmergency: emergencyTriggers.length > 0,
        triggers: emergencyTriggers,
        highestLevel: emergencyTriggers.length > 0 
          ? emergencyTriggers.reduce((max, curr) => {
              const levels = { watch: 1, urgent: 2, critical: 3 };
              return levels[curr.level] > levels[max.level] ? curr : max;
            }).level
          : null
      };
    } catch (error) {
      console.error('Emergency protocol check failed:', error);
      return { isEmergency: false, triggers: [], highestLevel: null };
    }
  }

  // Get validated medical knowledge for a condition
  async getValidatedKnowledge(icdCode) {
    try {
      const { data, error } = await supabase
        .from('medical_knowledge_base')
        .select('*')
        .eq('icd_code', icdCode)
        .eq('ministry_approved', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Failed to get validated knowledge:', error);
      return null;
    }
  }

  // Enhanced prediction with medical validation
  async validatePrediction(predictionData, userId) {
    try {
      // 1. Check emergency protocols first
      const emergencyCheck = await this.checkEmergencyProtocols(
        predictionData.currentSymptoms, 
        predictionData.diseaseCode
      );

      // 2. Get validated medical knowledge
      const validatedKnowledge = await this.getValidatedKnowledge(predictionData.diseaseCode);

      // 3. Determine validation requirements
      const requiresReview = this.determineReviewRequirement(predictionData, emergencyCheck);

      // 4. Calculate risk level based on validated criteria
      const riskAssessment = await this.calculateValidatedRisk(
        predictionData, 
        validatedKnowledge, 
        emergencyCheck
      );

      // 5. Store prediction with validation metadata
      const { data: savedPrediction, error } = await supabase
        .from('ai_predictions_validated')
        .insert({
          user_id: userId,
          disease_code: predictionData.diseaseCode,
          symptoms: predictionData.currentSymptoms,
          prediction_data: {
            ...predictionData,
            emergency_check: emergencyCheck,
            validated_knowledge_used: !!validatedKnowledge,
            risk_assessment: riskAssessment
          },
          validation_status: requiresReview ? 'needs_review' : 'pending',
          risk_level: riskAssessment.level,
          requires_immediate_care: emergencyCheck.isEmergency,
          ministry_compliance_checked: !!validatedKnowledge
        })
        .select()
        .single();

      if (error) throw error;

      // 6. Add to review queue if needed
      if (requiresReview) {
        await this.addToReviewQueue(savedPrediction.id, emergencyCheck.highestLevel);
      }

      // 7. Log the interaction
      await this.logMedicalInteraction(userId, 'prediction_created', savedPrediction.id, predictionData);

      return {
        success: true,
        prediction: savedPrediction,
        emergencyCheck,
        validatedKnowledge,
        requiresReview
      };

    } catch (error) {
      console.error('Prediction validation failed:', error);
      return {
        success: false,
        error: 'Validation failed: ' + error.message
      };
    }
  }

  // Determine if prediction needs professional review
  determineReviewRequirement(predictionData, emergencyCheck) {
    // Always review if emergency detected
    if (emergencyCheck.isEmergency) return true;

    // Review high-risk predictions
    if (predictionData.flareUpProbability > 70) return true;

    // Review certain high-risk conditions
    const highRiskConditions = ['I25', 'I21', 'J44', 'E11', 'C78'];
    if (highRiskConditions.includes(predictionData.diseaseCode)) return true;

    // Review if multiple concerning symptoms
    const concerningSymptoms = [
      'chest pain', 'shortness of breath', 'severe pain', 
      'bleeding', 'confusion', 'weakness'
    ];
    const symptomText = predictionData.currentSymptoms.join(' ').toLowerCase();
    const concerningCount = concerningSymptoms.filter(symptom => 
      symptomText.includes(symptom)
    ).length;

    return concerningCount >= 2;
  }

  // Calculate risk based on validated medical criteria
  async calculateValidatedRisk(predictionData, validatedKnowledge, emergencyCheck) {
    let riskScore = 0;
    let factors = [];

    // Emergency check adds highest risk
    if (emergencyCheck.isEmergency) {
      riskScore += emergencyCheck.highestLevel === 'critical' ? 40 : 
                   emergencyCheck.highestLevel === 'urgent' ? 30 : 20;
      factors.push(`Emergency protocol triggered: ${emergencyCheck.highestLevel}`);
    }

    // Use validated knowledge if available
    if (validatedKnowledge) {
      const riskFactors = validatedKnowledge.risk_factors;
      
      // Check for known risk factors in patient data
      if (riskFactors.genetic && predictionData.medicalHistory?.familyHistory) {
        riskScore += 15;
        factors.push('Family history present');
      }
      
      if (riskFactors.lifestyle) {
        if (predictionData.lifestyle?.smoking) {
          riskScore += 20;
          factors.push('Smoking risk factor');
        }
        if (predictionData.lifestyle?.alcohol === 'heavy') {
          riskScore += 10;
          factors.push('Heavy alcohol use');
        }
      }
    }

    // Base prediction probability
    riskScore += (predictionData.flareUpProbability || 0) * 0.5;

    // Determine level
    let level = 'low';
    if (riskScore >= 70) level = 'critical';
    else if (riskScore >= 50) level = 'high';
    else if (riskScore >= 30) level = 'moderate';

    return {
      score: Math.min(riskScore, 100),
      level,
      factors,
      validated: !!validatedKnowledge
    };
  }

  // Add prediction to professional review queue
  async addToReviewQueue(predictionId, emergencyLevel) {
    try {
      const priority = emergencyLevel === 'critical' ? 'urgent' :
                      emergencyLevel === 'urgent' ? 'high' : 'normal';

      const { error } = await supabase
        .from('medical_review_queue')
        .insert({
          prediction_id: predictionId,
          priority,
          status: 'pending'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to add to review queue:', error);
      return false;
    }
  }

  // Get predictions pending review for medical professionals
  async getPendingReviews(professionalId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('medical_review_queue')
        .select(`
          *,
          ai_predictions_validated (
            id,
            disease_code,
            symptoms,
            prediction_data,
            risk_level,
            created_at
          )
        `)
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Failed to get pending reviews:', error);
      return { success: false, error: error.message };
    }
  }

  // Submit professional review
  async submitReview(reviewId, professionalId, decision, notes) {
    try {
      // Update review queue
      const { data: review, error: reviewError } = await supabase
        .from('medical_review_queue')
        .update({
          status: 'completed',
          review_notes: notes,
          completed_at: new Date().toISOString()
        })
        .eq('id', reviewId)
        .select('prediction_id')
        .single();

      if (reviewError) throw reviewError;

      // Update prediction validation status
      const { error: predictionError } = await supabase
        .from('ai_predictions_validated')
        .update({
          validation_status: decision,
          validated_by: professionalId,
          validation_notes: notes,
          validation_date: new Date().toISOString()
        })
        .eq('id', review.prediction_id);

      if (predictionError) throw predictionError;

      // Log the review
      await this.logMedicalInteraction(
        professionalId, 
        'review_completed', 
        review.prediction_id, 
        { decision, notes }
      );

      return { success: true };
    } catch (error) {
      console.error('Failed to submit review:', error);
      return { success: false, error: error.message };
    }
  }

  // Log medical interactions for audit trail
  async logMedicalInteraction(userId, actionType, entityId, data) {
    try {
      await supabase
        .from('medical_audit_log')
        .insert({
          user_id: userId,
          action_type: actionType,
          entity_type: 'ai_prediction',
          entity_id: entityId,
          new_data: data,
          performed_by: userId
        });
    } catch (error) {
      console.error('Failed to log interaction:', error);
    }
  }

  // Get safety disclaimers based on condition and risk level
  getSafetyDisclaimers(diseaseCode, riskLevel, emergencyCheck) {
    const disclaimers = {
      general: [
        "Thông tin này chỉ mang tính chất tham khảo và không thay thế lời khuyên của bác sĩ.",
        "Luôn tham khảo ý kiến chuyên gia y tế trước khi đưa ra quyết định về sức khỏe.",
        "Hệ thống AI này chưa được Bộ Y tế phê duyệt như một thiết bị y tế."
      ],
      emergency: [
        "⚠️ CẢNH BÁO: Các triệu chứng của bạn có thể cần chăm sóc y tế khẩn cấp.",
        "Gọi ngay 115 hoặc đến phòng cấp cứu gần nhất nếu triệu chứng nghiêm trọng.",
        "Không trì hoãn việc tìm kiếm sự chăm sóc y tế chuyên nghiệp."
      ],
      high_risk: [
        "Tình trạng của bạn được đánh giá có nguy cơ cao.",
        "Khuyến nghị khám bác sĩ chuyên khoa trong vòng 24-48 giờ.",
        "Theo dõi chặt chẽ các triệu chứng và ghi lại thay đổi."
      ]
    };

    let result = [...disclaimers.general];
    
    if (emergencyCheck.isEmergency) {
      result = [...disclaimers.emergency, ...result];
    } else if (riskLevel === 'high' || riskLevel === 'critical') {
      result = [...disclaimers.high_risk, ...result];
    }

    return result;
  }
}

module.exports = new MedicalValidationService();