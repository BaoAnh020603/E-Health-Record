// lib/api/ai-medical-assistant.ts
// AI Medical Assistant for text simplification and disease prediction

import { supabase } from '../supabase-client'
import { aiConfig, aiPrompts } from '../config/ai-config'

// Import OpenAI when not using mock
let openai: any = null
if (aiConfig.provider === 'openai') {
  try {
    const OpenAI = require('openai')
    openai = new OpenAI({
      apiKey: aiConfig.apiKey
    })
  } catch (error) {
    console.error('OpenAI not installed. Run: npm install openai')
  }
}

// =============================================
// AI Text Simplification
// =============================================

export interface SimplifyMedicalTextRequest {
  technicalText: string
  context?: {
    diagnosis?: string
    symptoms?: string[]
    medications?: string[]
  }
}

export interface SimplifiedMedicalText {
  originalText: string
  simplifiedText: string
  keyPoints: string[]
  medicalTermsExplained: {
    term: string
    explanation: string
  }[]
  timestamp: string
}

/**
 * Simplify medical text from technical language to layman's terms
 * This uses AI to convert complex medical terminology into easy-to-understand language
 */
export async function simplifyMedicalText(
  request: SimplifyMedicalTextRequest
): Promise<{ success: boolean; data?: SimplifiedMedicalText; error?: string }> {
  try {
    const { technicalText, context } = request

    if (!technicalText || technicalText.trim().length === 0) {
      throw new Error('Văn bản y tế không được để trống')
    }

    // Call AI service to simplify text
    // In production, this would call OpenAI, Anthropic, or a custom medical AI model
    const simplifiedResult = await callAISimplificationService(technicalText, context)

    return {
      success: true,
      data: simplifiedResult
    }
  } catch (error: any) {
    console.error('Simplify medical text error:', error)
    return {
      success: false,
      error: error.message || 'Không thể đơn giản hóa văn bản y tế'
    }
  }
}

// =============================================
// Disease Prediction & Prevention
// =============================================

export interface DiseasePredictionRequest {
  userId: string
  diseaseCode: string
  currentSymptoms: string[]
  medicalHistory?: {
    previousDiagnoses: string[]
    chronicConditions: string[]
    medications: string[]
    allergies: string[]
  }
  lifestyle?: {
    smoking: boolean
    alcohol: boolean
    exercise: string // 'none' | 'light' | 'moderate' | 'heavy'
    diet: string // 'poor' | 'average' | 'good'
  }
}

export interface DiseasePrediction {
  diseaseCode: string
  diseaseName: string
  flareUpProbability: number // 0-100
  timeframe: string // e.g., "2-3 years"
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high'
  contributingFactors: {
    factor: string
    impact: 'low' | 'medium' | 'high'
    description: string
  }[]
  preventionAdvice: {
    category: string
    recommendations: string[]
    priority: 'high' | 'medium' | 'low'
  }[]
  lifestyleChanges: {
    change: string
    benefit: string
    difficulty: 'easy' | 'moderate' | 'hard'
  }[]
  warningSign: string[]
  nextSteps: string[]
  timestamp: string
}

/**
 * Predict disease flare-up probability and provide prevention advice
 * Uses AI and medical data to assess risk and recommend preventive measures
 */
export async function predictDiseaseFlareUp(
  request: DiseasePredictionRequest
): Promise<{ success: boolean; data?: DiseasePrediction; error?: string }> {
  try {
    const { userId, diseaseCode, currentSymptoms, medicalHistory, lifestyle } = request

    // Validate inputs
    if (!userId || !diseaseCode || !currentSymptoms || currentSymptoms.length === 0) {
      throw new Error('Thông tin không đầy đủ để dự đoán')
    }

    // Get user's medical records for analysis
    const { data: userRecords, error: recordsError } = await supabase
      .from('medical_records')
      .select('*')
      .eq('user_id', userId)
      .eq('trang_thai', 'active')
      .order('ngay_kham', { ascending: false })
      .limit(20)

    if (recordsError) throw recordsError

    // Call AI prediction service
    const prediction = await callAIPredictionService({
      diseaseCode,
      currentSymptoms,
      medicalHistory,
      lifestyle,
      historicalRecords: userRecords || []
    })

    // Store prediction for future reference
    await storePrediction(userId, prediction)

    return {
      success: true,
      data: prediction
    }
  } catch (error: any) {
    console.error('Disease prediction error:', error)
    return {
      success: false,
      error: error.message || 'Không thể dự đoán tình trạng bệnh'
    }
  }
}

// =============================================
// Helper Functions - AI Service Calls
// =============================================

/**
 * Call AI service to simplify medical text
 * In production, integrate with OpenAI GPT-4, Claude, or custom medical AI
 */
async function callAISimplificationService(
  technicalText: string,
  context?: any
): Promise<SimplifiedMedicalText> {
  
  if (aiConfig.provider === 'openai' && openai) {
    try {
      const response = await openai.chat.completions.create({
        model: aiConfig.model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: aiPrompts.simplification.system
          },
          {
            role: 'user',
            content: aiPrompts.simplification.user(technicalText, context)
          }
        ],
        temperature: aiConfig.temperature,
        max_tokens: aiConfig.maxTokens
      })

      const content = response.choices[0].message.content
      let result
      
      try {
        result = JSON.parse(content)
      } catch (parseError) {
        // If AI doesn't return valid JSON, create a structured response
        result = {
          simplifiedText: content,
          keyPoints: [
            'Thông tin y tế đã được đơn giản hóa',
            'Vui lòng tham khảo ý kiến bác sĩ để hiểu rõ hơn',
            'Đây chỉ là thông tin tham khảo'
          ],
          medicalTermsExplained: []
        }
      }
      
      return {
        originalText: technicalText,
        simplifiedText: result.simplifiedText || content,
        keyPoints: result.keyPoints || [],
        medicalTermsExplained: result.medicalTermsExplained || [],
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      // Fall back to mock response
      return await simulateAISimplification(technicalText)
    }
  }
  
  // Mock implementation - Replace with actual AI API call
  // Example: OpenAI API, Anthropic Claude, or custom medical AI model
  
  const prompt = `
You are a medical translator. Convert the following technical medical text into simple, easy-to-understand language for patients:

Technical Text: ${technicalText}

${context ? `Context: ${JSON.stringify(context)}` : ''}

Provide:
1. Simplified explanation in layman's terms
2. Key points (3-5 bullet points)
3. Explanation of medical terms used

Format as JSON.
`

  // Simulate AI response (replace with actual API call)
  const simplifiedText = await simulateAISimplification(technicalText)
  
  return simplifiedText
}

/**
 * Call AI service for disease prediction
 * In production, use ML model trained on medical data
 */
async function callAIPredictionService(data: any): Promise<DiseasePrediction> {
  
  if (aiConfig.provider === 'openai' && openai) {
    try {
      const response = await openai.chat.completions.create({
        model: aiConfig.model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: aiPrompts.prediction.system
          },
          {
            role: 'user',
            content: aiPrompts.prediction.user(data)
          }
        ],
        temperature: aiConfig.temperature,
        max_tokens: aiConfig.maxTokens
      })

      const content = response.choices[0].message.content
      let result
      
      try {
        result = JSON.parse(content)
      } catch (parseError) {
        console.error('Failed to parse AI prediction response:', parseError)
        // Fall back to mock response
        return await simulateAIPrediction(data)
      }
      
      return {
        diseaseCode: data.diseaseCode,
        diseaseName: result.diseaseName || 'Tên bệnh từ AI',
        flareUpProbability: result.flareUpProbability || 30,
        timeframe: '2-3 năm',
        riskLevel: result.riskLevel || 'moderate',
        contributingFactors: result.contributingFactors || [],
        preventionAdvice: result.preventionAdvice || [],
        lifestyleChanges: result.lifestyleChanges || [],
        warningSign: result.warningSign || [],
        nextSteps: result.nextSteps || [],
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      // Fall back to mock response
      return await simulateAIPrediction(data)
    }
  }
  
  // Mock implementation - Replace with actual AI/ML model
  // This should use a trained model on medical datasets
  
  const prediction = await simulateAIPrediction(data)
  
  return prediction
}

// =============================================
// Mock AI Functions (Replace in Production)
// =============================================

async function simulateAISimplification(technicalText: string): Promise<SimplifiedMedicalText> {
  // This is a mock - replace with actual AI API
  await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
  
  return {
    originalText: technicalText,
    simplifiedText: `Giải thích đơn giản: ${technicalText.substring(0, 100)}... (Đã được đơn giản hóa bởi AI)`,
    keyPoints: [
      'Điểm chính 1: Tình trạng sức khỏe hiện tại',
      'Điểm chính 2: Phương pháp điều trị được đề xuất',
      'Điểm chính 3: Những gì bạn cần làm tiếp theo'
    ],
    medicalTermsExplained: [
      {
        term: 'Chẩn đoán',
        explanation: 'Kết luận của bác sĩ về bệnh của bạn'
      }
    ],
    timestamp: new Date().toISOString()
  }
}

async function simulateAIPrediction(data: any): Promise<DiseasePrediction> {
  // This is a mock - replace with actual ML model
  await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API delay
  
  const { diseaseCode, currentSymptoms } = data
  
  return {
    diseaseCode,
    diseaseName: 'Tên bệnh (từ mã bệnh)',
    flareUpProbability: 35,
    timeframe: '2-3 năm',
    riskLevel: 'moderate',
    contributingFactors: [
      {
        factor: 'Lịch sử bệnh tật',
        impact: 'high',
        description: 'Bạn đã có tiền sử mắc bệnh này trước đây'
      },
      {
        factor: 'Lối sống',
        impact: 'medium',
        description: 'Một số thói quen sinh hoạt có thể ảnh hưởng'
      }
    ],
    preventionAdvice: [
      {
        category: 'Chế độ ăn uống',
        recommendations: [
          'Ăn nhiều rau xanh và trái cây',
          'Hạn chế thực phẩm chế biến sẵn',
          'Uống đủ nước mỗi ngày (2-3 lít)'
        ],
        priority: 'high'
      },
      {
        category: 'Vận động',
        recommendations: [
          'Tập thể dục nhẹ nhàng 30 phút mỗi ngày',
          'Đi bộ hoặc bơi lội thường xuyên',
          'Tránh vận động quá sức'
        ],
        priority: 'high'
      },
      {
        category: 'Theo dõi sức khỏe',
        recommendations: [
          'Khám sức khỏe định kỳ 3-6 tháng/lần',
          'Theo dõi các triệu chứng bất thường',
          'Ghi chép nhật ký sức khỏe'
        ],
        priority: 'medium'
      }
    ],
    lifestyleChanges: [
      {
        change: 'Bỏ hút thuốc lá',
        benefit: 'Giảm 40% nguy cơ tái phát',
        difficulty: 'hard'
      },
      {
        change: 'Ngủ đủ 7-8 tiếng mỗi đêm',
        benefit: 'Tăng cường hệ miễn dịch',
        difficulty: 'moderate'
      },
      {
        change: 'Giảm stress',
        benefit: 'Cải thiện sức khỏe tổng thể',
        difficulty: 'moderate'
      }
    ],
    warningSign: [
      'Đau đầu kéo dài hơn 3 ngày',
      'Sốt cao trên 38.5°C',
      'Khó thở hoặc đau ngực',
      'Triệu chứng tái phát hoặc trầm trọng hơn'
    ],
    nextSteps: [
      'Đặt lịch khám với bác sĩ chuyên khoa',
      'Thực hiện các xét nghiệm theo dõi',
      'Bắt đầu thay đổi lối sống theo khuyến nghị',
      'Ghi chép và theo dõi triệu chứng hàng ngày'
    ],
    timestamp: new Date().toISOString()
  }
}

/**
 * Store prediction results for historical tracking
 */
async function storePrediction(userId: string, prediction: DiseasePrediction) {
  try {
    await supabase.from('ai_predictions').insert({
      user_id: userId,
      disease_code: prediction.diseaseCode,
      prediction_data: prediction,
      flare_up_probability: prediction.flareUpProbability,
      risk_level: prediction.riskLevel,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error storing prediction:', error)
    // Don't throw - this is not critical
  }
}

// =============================================
// Get Prediction History
// =============================================

export async function getPredictionHistory(userId: string) {
  try {
    const { data, error } = await supabase
      .from('ai_predictions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error

    return {
      success: true,
      data: data || []
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      data: []
    }
  }
}
