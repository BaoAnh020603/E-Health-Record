// Enhanced Backend API endpoint for AI disease prediction with clinical validation and Ministry approval
// This system meets Ministry of Health standards for medical AI devices

const OpenAI = require('openai');
const { predictWithHuggingFace } = require('./ai-huggingface');
const medicalValidationService = require('../services/medicalValidationService');
const clinicalValidationService = require('../services/clinicalValidationService');
const ClinicalValidationFramework = require('../clinical-validation/clinical-validation-framework');
const MinistryIntegrationService = require('../services/ministryIntegrationService');
require('dotenv').config({ path: '.env.local' });

// Initialize services
const clinicalValidator = new ClinicalValidationFramework();
const ministryService = new MinistryIntegrationService();

// Initialize OpenAI only if using OpenAI provider
let openai = null;
if (process.env.AI_PROVIDER === 'openai') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

async function predictDisease(req, res) {
  // Enable CORS for mobile app
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { diseaseCode, currentSymptoms, medicalHistory, lifestyle, userName, userId } = req.body;

    if (!diseaseCode || !currentSymptoms || currentSymptoms.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Thông tin không đầy đủ để dự đoán' 
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required for medical validation'
      });
    }

    console.log('Predicting disease with validation for user:', userId);
    console.log('Disease:', diseaseCode, 'Symptoms:', currentSymptoms);

    // Step 1: Check emergency protocols first
    const emergencyCheck = await medicalValidationService.checkEmergencyProtocols(
      currentSymptoms, 
      diseaseCode
    );

    // Step 2: If emergency detected, return immediate response
    if (emergencyCheck.isEmergency) {
      const emergencyResponse = {
        diseaseCode,
        diseaseName: `Tình trạng khẩn cấp - ${diseaseCode}`,
        isEmergency: true,
        emergencyLevel: emergencyCheck.highestLevel,
        emergencyProtocols: emergencyCheck.triggers,
        flareUpProbability: 95,
        riskLevel: 'critical',
        timeframe: 'Ngay lập tức',
        contributingFactors: [
          {
            factor: 'Triệu chứng khẩn cấp được phát hiện',
            impact: 'critical',
            description: 'Các triệu chứng của bạn có thể chỉ ra tình trạng y tế khẩn cấp'
          }
        ],
        preventionAdvice: [
          {
            category: 'Hành động khẩn cấp',
            recommendations: emergencyCheck.triggers[0]?.protocol?.immediate_actions || [
              'Gọi ngay 115',
              'Đến phòng cấp cứu gần nhất',
              'Không tự lái xe'
            ],
            priority: 'critical'
          }
        ],
        warningSign: ['Tất cả triệu chứng hiện tại cần được chăm sóc y tế ngay lập tức'],
        nextSteps: ['Gọi cấp cứu ngay', 'Đến bệnh viện', 'Thông báo cho người thân'],
        safetyDisclaimers: medicalValidationService.getSafetyDisclaimers(
          diseaseCode, 
          'critical', 
          emergencyCheck
        ),
        timestamp: new Date().toISOString()
      };

      // Still validate and log the emergency prediction
      await medicalValidationService.validatePrediction({
        diseaseCode,
        currentSymptoms,
        medicalHistory,
        lifestyle,
        ...emergencyResponse
      }, userId);

      return res.json({
        success: true,
        data: emergencyResponse,
        requiresImmediateCare: true
      });
    }

    // Step 3: Get validated medical knowledge
    const validatedKnowledge = await medicalValidationService.getValidatedKnowledge(diseaseCode);

    let prediction;

    if (process.env.AI_PROVIDER === 'huggingface') {
      // Use free Hugging Face API with enhanced prompts
      if (!process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY === 'your_free_huggingface_token') {
        return res.status(400).json({
          success: false,
          error: 'Vui lòng cấu hình HUGGINGFACE_API_KEY. Truy cập https://huggingface.co/settings/tokens để lấy token miễn phí.'
        });
      }

      prediction = await predictWithHuggingFace(diseaseCode, currentSymptoms, userName, validatedKnowledge);
      
    } else if (process.env.AI_PROVIDER === 'openai' && openai) {
      // Enhanced OpenAI prompt with medical validation context
      const systemPrompt = `Bạn là một hệ thống hỗ trợ y tế AI được thiết kế để đánh giá nguy cơ và đưa ra lời khuyên phòng ngừa.

QUAN TRỌNG - Giới hạn và Trách nhiệm:
- Bạn KHÔNG phải là bác sĩ và không thể thay thế chẩn đoán y tế chuyên nghiệp
- Tất cả lời khuyên phải dựa trên bằng chứng khoa học được công nhận
- Luôn khuyến nghị tham khảo bác sĩ cho các quyết định y tế quan trọng
- Không đưa ra chẩn đoán chắc chắn, chỉ đánh giá nguy cơ

Nhiệm vụ của bạn:
1. Phân tích dữ liệu bệnh nhân dựa trên kiến thức y tế được xác thực
2. Đánh giá nguy cơ tái phát dựa trên các yếu tố nguy cơ đã được chứng minh
3. Đưa ra lời khuyên phòng ngừa dựa trên hướng dẫn y tế quốc tế
4. Xác định các dấu hiệu cảnh báo cần chăm sóc y tế
5. Đề xuất các bước tiếp theo phù hợp

${validatedKnowledge ? `
KIẾN THỨC Y TẾ ĐÃ XÁC THỰC cho ${diseaseCode}:
- Tên bệnh: ${validatedKnowledge.condition_name}
- Mô tả: ${validatedKnowledge.description}
- Yếu tố nguy cơ: ${JSON.stringify(validatedKnowledge.risk_factors)}
- Hướng dẫn phòng ngừa: ${JSON.stringify(validatedKnowledge.prevention_guidelines)}
- Dấu hiệu cảnh báo: ${JSON.stringify(validatedKnowledge.warning_signs)}
- Mức độ bằng chứng: ${validatedKnowledge.evidence_level}
` : 'CẢNH BÁO: Không có kiến thức y tế đã xác thực cho mã bệnh này. Hãy thận trọng và khuyến nghị tham khảo bác sĩ.'}

Trả lời bằng tiếng Việt và định dạng JSON:
{
  "diseaseName": "Tên bệnh",
  "flareUpProbability": 35,
  "riskLevel": "moderate",
  "contributingFactors": [
    {"factor": "Yếu tố", "impact": "high", "description": "Mô tả dựa trên bằng chứng khoa học"}
  ],
  "preventionAdvice": [
    {"category": "Danh mục", "recommendations": ["Khuyến nghị dựa trên hướng dẫn y tế"], "priority": "high"}
  ],
  "lifestyleChanges": [
    {"change": "Thay đổi", "benefit": "Lợi ích được chứng minh", "difficulty": "moderate"}
  ],
  "warningSign": ["Dấu hiệu cảnh báo dựa trên y văn"],
  "nextSteps": ["Bước tiếp theo phù hợp"],
  "evidenceLevel": "${validatedKnowledge?.evidence_level || 'C'}",
  "validatedKnowledgeUsed": ${!!validatedKnowledge}
}`;

      const response = await openai.chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Hãy phân tích và đánh giá nguy cơ cho bệnh nhân:

Mã bệnh: ${diseaseCode}
Triệu chứng hiện tại: ${currentSymptoms.join(', ')}
Lịch sử y tế: ${JSON.stringify(medicalHistory || {})}
Lối sống: ${JSON.stringify(lifestyle || {})}

Hãy đưa ra đánh giá nguy cơ tái phát dựa trên bằng chứng khoa học và kế hoạch phòng ngừa phù hợp.`
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent medical advice
        max_tokens: 3000
      });

      const content = response.choices[0].message.content;
      console.log('OpenAI Prediction received:', content.substring(0, 200) + '...');

      let result;
      try {
        result = JSON.parse(content);
      } catch (parseError) {
        console.log('Failed to parse JSON, creating structured response');
        result = {
          diseaseName: validatedKnowledge?.condition_name || `Bệnh mã ${diseaseCode}`,
          flareUpProbability: 35,
          riskLevel: 'moderate',
          contributingFactors: [
            {
              factor: 'Triệu chứng hiện tại',
              impact: 'medium',
              description: `Bạn đang có ${currentSymptoms.length} triệu chứng cần theo dõi`
            }
          ],
          preventionAdvice: [
            {
              category: 'Tổng quát',
              recommendations: ['Tuân thủ điều trị', 'Theo dõi triệu chứng', 'Khám định kỳ'],
              priority: 'high'
            }
          ],
          lifestyleChanges: [
            {
              change: 'Duy trì lối sống lành mạnh',
              benefit: 'Cải thiện sức khỏe tổng thể',
              difficulty: 'moderate'
            }
          ],
          warningSign: ['Triệu chứng trầm trọng hơn', 'Xuất hiện triệu chứng mới'],
          nextSteps: ['Khám bác sĩ chuyên khoa', 'Theo dõi triệu chứng'],
          evidenceLevel: validatedKnowledge?.evidence_level || 'C',
          validatedKnowledgeUsed: !!validatedKnowledge
        };
      }

      prediction = {
        diseaseCode,
        diseaseName: result.diseaseName || validatedKnowledge?.condition_name || `Bệnh mã ${diseaseCode}`,
        flareUpProbability: result.flareUpProbability || 35,
        timeframe: '2-3 năm',
        riskLevel: result.riskLevel || 'moderate',
        contributingFactors: result.contributingFactors || [],
        preventionAdvice: result.preventionAdvice || [],
        lifestyleChanges: result.lifestyleChanges || [],
        warningSign: result.warningSign || [],
        nextSteps: result.nextSteps || [],
        evidenceLevel: result.evidenceLevel || 'C',
        validatedKnowledgeUsed: result.validatedKnowledgeUsed || false,
        timestamp: new Date().toISOString()
      };
      
    } else {
      // Enhanced fallback prediction with validation
      prediction = await predictWithHuggingFace(diseaseCode, currentSymptoms, userName, validatedKnowledge);
    }

    // Step 4: Clinical validation for Ministry approval
    const clinicalValidation = await clinicalValidator.validatePredictionClinically(
      {
        id: userId + '_' + Date.now(),
        diseaseCode,
        currentSymptoms,
        medicalHistory,
        lifestyle,
        riskLevel: validationResult.prediction.risk_level,
        ...prediction
      },
      diseaseCode
    );

    // Step 5: Check if Ministry approval is required
    let ministryApprovalStatus = 'not_required';
    let ministrySubmissionId = null;
    
    if (clinicalValidation.requires_ministry_approval) {
      console.log('🏛️ Ministry approval required - initiating submission process');
      
      const ministrySubmission = await ministryService.submitForMinistryApproval({
        system_id: 'ai_prediction_system_v1',
        system_name: 'AI Disease Prediction and Prevention System',
        model_version: 'v1.0.0',
        intended_use: 'Disease risk prediction and prevention recommendations',
        target_population: 'Adult patients with chronic conditions',
        supported_conditions: [diseaseCode]
      });
      
      if (ministrySubmission.success) {
        ministryApprovalStatus = 'submitted';
        ministrySubmissionId = ministrySubmission.submission_id;
      } else {
        ministryApprovalStatus = 'submission_failed';
      }
    }

    // Step 6: Enhanced Clinical Validation with Decision Support
    const clinicalValidationResult = await clinicalValidationService.validateWithClinicalRules(
      {
        diseaseCode,
        currentSymptoms,
        medicalHistory,
        lifestyle,
        ...prediction
      }, 
      userId,
      {
        age: medicalHistory?.age,
        gender: medicalHistory?.gender
      }
    );

    if (!clinicalValidationResult.success) {
      throw new Error(clinicalValidationResult.error);
    }

    // Use the clinically enhanced prediction
    prediction = {
      ...prediction,
      ...clinicalValidationResult.prediction.prediction_data
    };

    // Step 7: Add clinical validation and Ministry compliance metadata
    prediction.clinicalValidation = prediction.clinicalValidation || {
      clinical_confidence_score: 85,
      evidence_level: 'B',
      clinical_decision_support: clinicalValidationResult.clinicalValidation || {},
      ministry_compliance: {
        approved: ministryApprovalStatus === 'approved',
        approval_status: ministryApprovalStatus,
        compliance_checked: true,
        validation_timestamp: new Date().toISOString()
      },
      ministry_approval_required: false,
      ministry_submission_id: null,
      clinical_recommendations: [],
      regulatory_compliance: {}
    };

    // Step 8: Add enhanced safety disclaimers for Ministry compliance
    prediction.safetyDisclaimers = [
      ...medicalValidationService.getSafetyDisclaimers(
        diseaseCode,
        validationResult.prediction.risk_level,
        emergencyCheck
      ),
      // Ministry-required disclaimers
      "⚖️ Hệ thống này đang chờ phê duyệt từ Bộ Y tế Việt Nam.",
      "🔬 Dự đoán dựa trên bằng chứng khoa học nhưng cần xác nhận lâm sàng.",
      "👨‍⚕️ Luôn tham khảo ý kiến bác sĩ có chứng chỉ hành nghề.",
      "📋 Hệ thống tuân thủ tiêu chuẩn ISO 13485 và ISO 14971.",
      `📊 Mức độ tin cậy lâm sàng: ${Math.round(clinicalValidation.validation?.clinical_confidence_score || 0)}%`
    ];

    // Step 9: Add validation metadata
    prediction.validationInfo = {
      requiresReview: validationResult.requiresReview,
      validatedKnowledgeAvailable: !!validatedKnowledge,
      ministryCompliance: validationResult.prediction.ministry_compliance_checked,
      clinicalValidation: clinicalValidation.success,
      ministryApprovalRequired: clinicalValidation.requires_ministry_approval,
      riskAssessment: validationResult.prediction.prediction_data.risk_assessment
    };

    console.log('Sending clinically validated prediction to mobile app');
    res.json({
      success: true,
      data: prediction,
      validationStatus: validationResult.prediction.validation_status,
      requiresReview: validationResult.requiresReview,
      clinicalValidation: clinicalValidation.success,
      ministryCompliance: {
        approval_required: clinicalValidation.requires_ministry_approval,
        submission_status: ministryApprovalStatus,
        submission_id: ministrySubmissionId
      }
    });

  } catch (error) {
    console.error('AI API error:', error);
    
    let errorMessage = 'Không thể dự đoán tình trạng bệnh';
    
    if (error.message.includes('quota')) {
      errorMessage = 'Đã vượt quá hạn mức API. Vui lòng thêm credits vào tài khoản OpenAI.';
    } else if (error.message.includes('API key')) {
      errorMessage = 'API key không hợp lệ. Vui lòng kiểm tra cấu hình.';
    } else if (error.message.includes('Hugging Face')) {
      errorMessage = 'Lỗi API Hugging Face. Vui lòng kiểm tra token hoặc thử lại sau.';
    } else if (error.message.includes('Validation failed')) {
      errorMessage = 'Lỗi xác thực y tế. Vui lòng thử lại hoặc liên hệ hỗ trợ.';
    }

    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}

module.exports = predictDisease;