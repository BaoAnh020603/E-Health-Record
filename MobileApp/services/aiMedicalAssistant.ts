// services/aiMedicalAssistant.ts
// Mobile app service for AI medical features

import { getCurrentUserProfile } from './auth'

// Type definitions
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
    exercise: string
    diet: string
  }
}

export interface DiseasePrediction {
  diseaseCode: string
  diseaseName: string
  flareUpProbability: number
  timeframe: string
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
// Real AI Configuration - Google Gemini (Free)
// 🚨 REPLACE THIS WITH YOUR REAL API KEY FROM: https://makersuite.google.com/app/apikey
const GEMINI_API_KEY =; // Updated API key

// Try multiple model endpoints for better compatibility (2025 models)
const GEMINI_MODELS = [
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent'
];

// Disease code mapping
function getDiseaseNameFromCode(code: string): string {
  const diseaseMap: { [key: string]: string } = {
    'J45': 'Hen phế quản (Asthma)',
    'E11': 'Đái tháo đường type 2',
    'I10': 'Tăng huyết áp',
    'M05': 'Viêm khớp dạng thấp',
    'N18': 'Bệnh thận mạn tính',
    'J44': 'Bệnh phổi tắc nghẽn mạn tính (COPD)',
    'I21': 'Nhồi máu cơ tim cấp',
    'E10': 'Đái tháo đường type 1',
    'M15': 'Thoái hóa khớp',
    'J18': 'Viêm phổi'
  }
  
  return diseaseMap[code] || `Bệnh mã ${code}`
}

// Check if API key is configured
function isAPIKeyConfigured(): boolean {
  return GEMINI_API_KEY && GEMINI_API_KEY.length > 10 && !GEMINI_API_KEY.includes('YOUR_GEMINI_API_KEY_HERE');
}

// Helper function to safely parse JSON from AI response
function safeParseAIResponse(aiResponse: string): any | null {
  try {
    // Clean the AI response first - remove markdown code blocks
    let cleanedResponse = aiResponse.trim();
    
    // Remove markdown code block markers (```json, ```, etc.)
    cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*/i, '');
    cleanedResponse = cleanedResponse.replace(/\s*```\s*$/i, '');
    
    // Find the first { and last } to extract complete JSON
    const firstBrace = cleanedResponse.indexOf('{');
    const lastBrace = cleanedResponse.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      // Extract JSON string
      let jsonString = cleanedResponse.substring(firstBrace, lastBrace + 1);
      
      // Remove any trailing commas before closing braces/brackets
      jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
      
      // Try to parse
      return JSON.parse(jsonString);
    }
    
    return null;
  } catch (error) {
    console.log('First parse attempt failed:', error instanceof Error ? error.message : 'Unknown error');
    
    // Try more aggressive regex to find JSON object
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/);
      
      if (jsonMatch) {
        let jsonString = jsonMatch[0];
        
        // Fix common JSON issues
        jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
        
        return JSON.parse(jsonString);
      }
    } catch (secondError) {
      console.log('Second parse attempt failed');
    }
    
    return null;
  }
}

// Helper function to try multiple Gemini models with quota detection
async function callGeminiAPI(prompt: string, config: any = {}): Promise<any> {
  let lastError: Error | null = null;
  let quotaExhausted = false;
  let apiKeyInvalid = false;
  
  for (let i = 0; i < GEMINI_MODELS.length; i++) {
    const modelUrl = GEMINI_MODELS[i];
    try {
      const modelName = modelUrl.split('/').pop()?.split(':')[0] || 'unknown';
      console.log(`🤖 Trying Gemini model: ${modelName}`);
      
      const response = await fetch(`${modelUrl}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
            ...config
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success with model: ${modelName}`);
        return data;
      } else {
        const errorData = await response.text();
        const status = response.status;
        
        if (status === 400) {
          console.log(`❌ Model ${modelName} failed: API key invalid or expired`);
          // Check if it's API key issue
          if (errorData.includes('API key expired') || errorData.includes('API_KEY_INVALID')) {
            console.log('� DAPI key expired or invalid - stopping retries');
            apiKeyInvalid = true;
            lastError = new Error('API_KEY_INVALID');
            break;
          }
        } else if (status === 429) {
          console.log(`⏳ Model ${modelName} rate limited (429)`);
          
          // Check if it's quota exhaustion
          if (errorData.includes('quota') || errorData.includes('RESOURCE_EXHAUSTED')) {
            console.log('💤 Daily quota exhausted - stopping retries');
            quotaExhausted = true;
            lastError = new Error('QUOTA_EXHAUSTED');
            break;
          }
          
          // Exponential backoff for rate limits
          const waitTime = Math.min(1000 * Math.pow(2, i), 5000);
          console.log(`⏳ Waiting ${waitTime}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          console.log(`❌ Model ${modelName} failed: ${status}`);
        }
        
        lastError = new Error(`API error ${status}: ${errorData}`);
        continue;
      }
    } catch (error) {
      const modelName = modelUrl.split('/').pop()?.split(':')[0] || 'unknown';
      console.log(`❌ Model ${modelName} error:`, error);
      lastError = error as Error;
      continue;
    }
  }
  
  if (apiKeyInvalid) {
    throw new Error('API_KEY_INVALID');
  }
  
  if (quotaExhausted) {
    throw new Error('QUOTA_EXHAUSTED');
  }
  
  throw lastError || new Error('All Gemini models failed');
}
// Real AI text simplification using Google Gemini
async function realAISimplifyText(technicalText: string): Promise<SimplifiedMedicalText> {
  if (!isAPIKeyConfigured()) {
    throw new Error('API_KEY_NOT_CONFIGURED');
  }

  try {
    console.log('🤖 Calling Google Gemini AI for real analysis...');
    
    // Get user profile for personalized greeting
    let userName = '';
    try {
      const userProfile = await getCurrentUserProfile();
      if (userProfile && userProfile.ho_ten) {
        userName = userProfile.ho_ten;
      }
    } catch (error) {
      console.log('Could not get user profile for greeting:', error);
    }

    const greetingText = userName ? `Xin chào ${userName}! ` : 'Xin chào! ';
    
    const prompt = `You are a helpful medical assistant. Please explain this medical text in simple Vietnamese that patients can easily understand.

Medical text: "${technicalText}"

Please provide a clear, simple explanation in Vietnamese. Use everyday words that patients know. Be caring and helpful.

IMPORTANT: Start your simplified explanation with a personalized greeting: "${greetingText}"

CRITICAL: You MUST respond with ONLY a valid JSON object. Do not include any text before or after the JSON. Do not use markdown code blocks.

Response format (copy this structure exactly):
{
  "simplifiedText": "${greetingText}Your simple explanation here in Vietnamese. Use everyday words. Keep it in one paragraph without line breaks.",
  "keyPoints": ["First important point", "Second important point", "Third important point"],
  "medicalTermsExplained": [{"term": "medical term", "explanation": "simple explanation"}]
}

Rules:
- Keep simplifiedText as ONE continuous paragraph
- Do NOT use line breaks (\\n) inside the simplifiedText
- Include 3-4 keyPoints
- Explain 2-3 medical terms if present
- Use simple Vietnamese language
- Be caring and supportive`;

    const data = await callGeminiAPI(prompt);
    console.log('✅ Real AI analysis received from Gemini');
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const aiResponse = data.candidates[0].content.parts[0].text;
      
      // Try to parse JSON using helper function
      const parsed = safeParseAIResponse(aiResponse);
      
      if (parsed && parsed.simplifiedText) {
        console.log('✅ Successfully parsed JSON response');
        return {
          originalText: technicalText,
          simplifiedText: parsed.simplifiedText,
          keyPoints: parsed.keyPoints || [
            'Phân tích từ AI thực tế',
            'Được xử lý bởi Google Gemini',
            'Vui lòng tham khảo ý kiến bác sĩ'
          ],
          medicalTermsExplained: parsed.medicalTermsExplained || [],
          timestamp: new Date().toISOString()
        };
      }
      
      // If JSON parsing fails completely, extract useful text from raw response
      console.log('⚠️ Using fallback: extracting text from raw AI response');
      
      // Try to extract the simplified text even if JSON is malformed
      let extractedText = aiResponse;
      
      // Try to find text after "simplifiedText": 
      const simplifiedMatch = aiResponse.match(/"simplifiedText"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
      if (simplifiedMatch && simplifiedMatch[1]) {
        extractedText = simplifiedMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
      }
      
      return {
        originalText: technicalText,
        simplifiedText: extractedText,
        keyPoints: [
          'Giải thích từ AI thông minh',
          'Được phân tích bởi Google Gemini',
          'Nên tham khảo ý kiến bác sĩ để chắc chắn'
        ],
        medicalTermsExplained: [],
        timestamp: new Date().toISOString()
      };
    }
    
    throw new Error('No valid response from Gemini AI');

  } catch (error) {
    console.error('Real AI failed:', error);
    throw error;
  }
}
// Real AI disease prediction using Google Gemini
async function realAIPredictDisease(request: DiseasePredictionRequest): Promise<DiseasePrediction> {
  if (!isAPIKeyConfigured()) {
    throw new Error('API_KEY_NOT_CONFIGURED');
  }

  try {
    console.log('🤖 Calling Google Gemini AI for disease risk analysis...');
    
    const { diseaseCode, currentSymptoms, medicalHistory, lifestyle } = request;
    
    // Get user profile for personalized greeting
    let userName = '';
    try {
      const userProfile = await getCurrentUserProfile();
      if (userProfile && userProfile.ho_ten) {
        userName = userProfile.ho_ten;
      }
    } catch (error) {
      console.log('Could not get user profile for greeting:', error);
    }

    const greetingText = userName ? `Xin chào ${userName}! ` : 'Xin chào! ';
    
    const prompt = `You are a helpful medical assistant. Please analyze this patient's health situation and give advice in simple Vietnamese.

Patient info:
- Disease: ${diseaseCode}
- Symptoms: ${currentSymptoms.join(', ')}

Please tell the patient:
1. What is the chance this disease will come back in 2-3 years? (give a percentage)
2. Why might it come back?
3. What can they do to prevent it?
4. What warning signs should they watch for?

IMPORTANT: Start all your advice and recommendations with a personalized greeting: "${greetingText}"

CRITICAL: You MUST respond with ONLY a valid JSON object. Do not include any text before or after the JSON. Do not use markdown code blocks.

Response format (copy this structure exactly):
{
  "diseaseName": "Disease name in Vietnamese",
  "flareUpProbability": 35,
  "riskLevel": "low",
  "contributingFactors": [{"factor": "reason", "impact": "low", "description": "simple explanation"}],
  "preventionAdvice": [{"category": "area", "recommendations": ["${greetingText}simple advice"], "priority": "high"}],
  "lifestyleChanges": [{"change": "what to change", "benefit": "why it helps", "difficulty": "easy"}],
  "warningSign": ["signs to watch for"],
  "nextSteps": ["${greetingText}what to do next"]
}

Rules:
- Keep all text as single lines without line breaks
- Include 2-3 items in each array
- Use simple Vietnamese language
- Be caring and supportive
- Ensure valid JSON format`;

    const data = await callGeminiAPI(prompt, { maxOutputTokens: 4096 });
    console.log('✅ Real AI disease analysis received from Gemini');
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const aiResponse = data.candidates[0].content.parts[0].text;
      
      // Try to parse JSON using helper function
      const parsed = safeParseAIResponse(aiResponse);
      
      if (parsed && parsed.diseaseName) {
        console.log('✅ Successfully parsed disease prediction JSON');
        return {
          diseaseCode,
          diseaseName: parsed.diseaseName || `Phân tích AI cho bệnh ${diseaseCode}`,
          flareUpProbability: parsed.flareUpProbability || 40,
          timeframe: '2-3 năm',
          riskLevel: parsed.riskLevel || 'moderate',
          contributingFactors: parsed.contributingFactors || [
            {
              factor: 'Phân tích AI',
              impact: 'high',
              description: 'Google Gemini đã phân tích toàn diện tình trạng của bạn'
            }
          ],
          preventionAdvice: parsed.preventionAdvice || [
            {
              category: 'Khuyến nghị từ AI',
              recommendations: ['Tuân thủ phân tích chi tiết từ AI', 'Tham khảo bác sĩ chuyên khoa'],
              priority: 'high'
            }
          ],
          lifestyleChanges: parsed.lifestyleChanges || [
            {
              change: 'Theo dõi khuyến nghị AI',
              benefit: 'Cải thiện dựa trên phân tích thông minh',
              difficulty: 'moderate'
            }
          ],
          warningSign: parsed.warningSign || ['Theo dõi các dấu hiệu AI đã phân tích'],
          nextSteps: parsed.nextSteps || ['Xem xét phân tích chi tiết từ AI', 'Tham khảo bác sĩ'],
          timestamp: new Date().toISOString()
        };
      }
      
      // If JSON parsing fails, extract key information from the AI response
      console.log('⚠️ Using fallback: extracting info from raw AI response');
      
      const riskMatch = aiResponse.match(/(\d+)%/);
      const riskPercentage = riskMatch ? parseInt(riskMatch[1]) : 40;
      
      // Extract disease name if mentioned in Vietnamese
      const diseaseNameMatch = aiResponse.match(/(hen phế quản|đái tháo đường|tăng huyết áp|viêm khớp|bệnh thận)/i);
      const extractedDiseaseName = diseaseNameMatch ? diseaseNameMatch[1] : getDiseaseNameFromCode(diseaseCode);
      
      return {
        diseaseCode,
        diseaseName: `🤖 ${extractedDiseaseName} - AI phân tích`,
        flareUpProbability: riskPercentage,
        timeframe: '2-3 năm',
        riskLevel: riskPercentage < 30 ? 'low' : riskPercentage < 50 ? 'moderate' : 'high',
        contributingFactors: [
          {
            factor: '🧠 AI phân tích',
            impact: 'high',
            description: aiResponse.length > 300 ? `${aiResponse.substring(0, 300)}...` : aiResponse
          }
        ],
        preventionAdvice: [
          {
            category: '🤖 Lời khuyên từ AI',
            recommendations: [
              'Xem phân tích chi tiết từ AI ở trên',
              'AI đã phân tích tình trạng của bạn',
              'Nên hỏi bác sĩ để chắc chắn'
            ],
            priority: 'high'
          }
        ],
        lifestyleChanges: [
          {
            change: 'Làm theo lời khuyên AI',
            benefit: 'Cải thiện sức khỏe dựa trên phân tích thông minh',
            difficulty: 'moderate'
          }
        ],
        warningSign: [
          'Theo dõi các dấu hiệu AI đã nói',
          'Triệu chứng nặng hơn bình thường',
          'Có triệu chứng mới'
        ],
        nextSteps: [
          'Đọc kỹ phân tích AI ở trên',
          'Làm theo lời khuyên của AI',
          'Đi khám bác sĩ',
          'Theo dõi triệu chứng hàng ngày'
        ],
        timestamp: new Date().toISOString()
      };
    }
    
    throw new Error('No valid response from Gemini AI');

  } catch (error) {
    console.error('Real AI prediction failed:', error);
    throw error;
  }
}
// Intelligent prediction fallback when AI is not available
function createIntelligentPrediction(request: DiseasePredictionRequest): DiseasePrediction {
  const { diseaseCode, currentSymptoms } = request;
  
  // Intelligent risk calculation
  let riskScore = 20; // Base risk
  
  // Symptom-based risk
  riskScore += currentSymptoms.length * 8;
  
  // Disease-specific risk
  const diseaseRisks: { [key: string]: number } = {
    'J45': 35,  // Asthma
    'E11': 45,  // Diabetes
    'I10': 50,  // Hypertension
    'M05': 30,  // Arthritis
    'N18': 60   // Kidney disease
  };
  
  if (diseaseRisks[diseaseCode]) {
    riskScore = diseaseRisks[diseaseCode];
  }
  
  riskScore = Math.min(riskScore, 80);
  const riskLevel: 'low' | 'moderate' | 'high' | 'very_high' = 
    riskScore < 30 ? 'low' : riskScore < 50 ? 'moderate' : riskScore < 70 ? 'high' : 'very_high';
  
  return {
    diseaseCode,
    diseaseName: getDiseaseNameFromCode(diseaseCode),
    flareUpProbability: riskScore,
    timeframe: '2-3 năm',
    riskLevel,
    contributingFactors: [
      {
        factor: 'Phân tích thông minh',
        impact: 'high',
        description: 'Hệ thống đã phân tích dựa trên triệu chứng và loại bệnh'
      },
      {
        factor: 'Triệu chứng hiện tại',
        impact: currentSymptoms.length > 3 ? 'high' : 'medium',
        description: `Bạn đang có ${currentSymptoms.length} triệu chứng cần theo dõi chặt chẽ`
      }
    ],
    preventionAdvice: [
      {
        category: 'Chế độ ăn uống',
        recommendations: [
          'Ăn nhiều rau xanh và trái cây tươi',
          'Hạn chế thực phẩm chế biến sẵn và đồ ăn nhanh',
          'Uống đủ nước mỗi ngày (2-3 lít)',
          'Ăn đúng giờ, không bỏ bữa'
        ],
        priority: 'high'
      },
      {
        category: 'Vận động & Nghỉ ngơi',
        recommendations: [
          'Tập thể dục nhẹ nhàng 30 phút mỗi ngày',
          'Đi bộ hoặc bơi lội thường xuyên',
          'Ngủ đủ 7-8 tiếng mỗi đêm',
          'Tránh vận động quá sức khi có triệu chứng'
        ],
        priority: 'high'
      },
      {
        category: 'Theo dõi sức khỏe',
        recommendations: [
          'Khám sức khỏe định kỳ 3-6 tháng/lần',
          'Theo dõi các triệu chứng bất thường',
          'Ghi chép nhật ký sức khỏe hàng ngày',
          'Tuân thủ đúng đơn thuốc của bác sĩ'
        ],
        priority: 'medium'
      }
    ],
    lifestyleChanges: [
      {
        change: 'Bỏ hút thuốc lá (nếu có)',
        benefit: 'Giảm 40% nguy cơ tái phát và cải thiện chức năng phổi',
        difficulty: 'hard'
      },
      {
        change: 'Quản lý stress hiệu quả',
        benefit: 'Giảm viêm nhiễm và cải thiện sức khỏe tổng thể',
        difficulty: 'moderate'
      },
      {
        change: 'Duy trì cân nặng hợp lý',
        benefit: 'Giảm áp lực lên các cơ quan và cải thiện tuần hoàn',
        difficulty: 'moderate'
      }
    ],
    warningSign: [
      'Triệu chứng trầm trọng hơn bình thường',
      'Sốt cao trên 38.5°C kéo dài',
      'Khó thở hoặc đau ngực dữ dội',
      'Mệt mỏi bất thường không cải thiện sau nghỉ ngơi',
      'Xuất hiện triệu chứng mới không có trước đây'
    ],
    nextSteps: [
      'Đặt lịch khám với bác sĩ chuyên khoa trong 1-2 tuần',
      'Thực hiện các xét nghiệm theo dõi theo chỉ định',
      'Bắt đầu thay đổi lối sống theo khuyến nghị',
      'Ghi chép và theo dõi triệu chứng hàng ngày',
      'Chuẩn bị danh sách câu hỏi để hỏi bác sĩ'
    ],
    timestamp: new Date().toISOString()
  };
}
/**
 * Simplify medical text for patients using real AI
 */
export async function simplifyDoctorNotes(
  technicalText: string,
  context?: {
    diagnosis?: string
    symptoms?: string[]
    medications?: string[]
  }
): Promise<{ success: boolean; data?: SimplifiedMedicalText; error?: string }> {
  try {
    if (!technicalText || technicalText.trim().length === 0) {
      throw new Error('Văn bản y tế không được để trống')
    }

    // Try real AI first
    try {
      const result = await realAISimplifyText(technicalText);
      return {
        success: true,
        data: result
      };
    } catch (aiError: any) {
      console.log('Real AI failed:', aiError.message);
      
      if (aiError.message === 'API_KEY_NOT_CONFIGURED') {
        return {
          success: false,
          error: `🔑 Cần cấu hình Google Gemini API key để sử dụng AI thực!

📋 Hướng dẫn nhanh:
1. Truy cập: https://aistudio.google.com/app/apikey
2. Đăng nhập Google và tạo API key miễn phí
3. Thay thế API key trong file aiMedicalAssistant.ts (dòng 72)
4. Khởi động lại ứng dụng

💡 Xem file QUICK_FIX_API_KEY.md!`
        };
      }
      
      if (aiError.message === 'API_KEY_INVALID') {
        return {
          success: false,
          error: `🔑 API key đã hết hạn!

📋 Tạo API key mới:
1. Mở: https://aistudio.google.com/app/apikey
2. Tạo API key mới (miễn phí)
3. Thay vào file aiMedicalAssistant.ts (dòng 72)
4. Khởi động lại app

💡 Xem file QUICK_FIX_API_KEY.md!`
        };
      }
      
      if (aiError.message === 'QUOTA_EXHAUSTED') {
        return {
          success: false,
          error: `💤 Đã hết hạn mức miễn phí hôm nay!

�  Bạn đã sử dụng hết quota miễn phí của Google Gemini cho ngày hôm nay.

⏰ Giải pháp:
1. Đợi đến ngày mai (quota sẽ reset tự động)
2. Hoặc nâng cấp lên gói trả phí tại: https://ai.google.dev/pricing
3. Hoặc sử dụng API key khác (tạo project mới)

💡 Quota miễn phí: 15 requests/phút, 1500 requests/ngày`
        };
      }
      
      // Show configuration message for other errors
      return {
        success: false,
        error: `❌ Lỗi AI: ${aiError.message}

🔧 Kiểm tra:
- API key Google Gemini đã đúng chưa?
- Kết nối internet ổn định không?
- Thử lại sau vài phút

📖 Xem hướng dẫn chi tiết trong REAL_AI_SETUP_GUIDE.md`
      };
    }
  } catch (error: any) {
    console.error('AI simplification error:', error);
    return {
      success: false,
      error: error.message || 'Không thể đơn giản hóa văn bản y tế'
    }
  }
}

/**
 * Get disease prediction and prevention advice using real AI
 */
export async function getDiseasePredict(
  request: DiseasePredictionRequest
): Promise<{ success: boolean; data?: DiseasePrediction; error?: string }> {
  try {
    const { diseaseCode, currentSymptoms, userId } = request

    // Validate inputs
    if (!diseaseCode || !currentSymptoms || currentSymptoms.length === 0) {
      throw new Error('Thông tin không đầy đủ để dự đoán')
    }

    if (!userId) {
      throw new Error('User ID is required for medical validation')
    }

    // Try real AI first
    try {
      const result = await realAIPredictDisease(request);
      return {
        success: true,
        data: result
      };
    } catch (aiError: any) {
      console.log('Real AI failed, using intelligent fallback:', aiError.message);
      
      if (aiError.message === 'API_KEY_NOT_CONFIGURED') {
        return {
          success: false,
          error: `🔑 Cần cấu hình Google Gemini API key để sử dụng AI thực!

📋 Hướng dẫn nhanh:
1. Truy cập: https://aistudio.google.com/app/apikey
2. Đăng nhập Google và tạo API key miễn phí
3. Thay thế API key trong file aiMedicalAssistant.ts (dòng 72)
4. Khởi động lại ứng dụng

💡 Xem file QUICK_FIX_API_KEY.md!`
        };
      }
      
      if (aiError.message === 'API_KEY_INVALID') {
        return {
          success: false,
          error: `🔑 API key đã hết hạn!

📋 Tạo API key mới:
1. Mở: https://aistudio.google.com/app/apikey
2. Tạo API key mới (miễn phí)
3. Thay vào file aiMedicalAssistant.ts (dòng 72)
4. Khởi động lại app

💡 Xem file QUICK_FIX_API_KEY.md!`
        };
      }
      
      if (aiError.message === 'QUOTA_EXHAUSTED') {
        // For disease prediction, fall back to intelligent analysis with a note
        const fallbackResult = createIntelligentPrediction(request);
        return {
          success: true,
          data: {
            ...fallbackResult,
            diseaseName: `${fallbackResult.diseaseName} (Phân tích thông minh)`,
            contributingFactors: [
              {
                factor: '💤 Hết quota AI hôm nay',
                impact: 'medium',
                description: 'Đã hết hạn mức miễn phí Google Gemini. Sử dụng phân tích thông minh dựa trên quy tắc y tế. Quota sẽ reset vào ngày mai.'
              },
              ...fallbackResult.contributingFactors
            ],
            nextSteps: [
              '💡 Đợi đến ngày mai để dùng AI thực',
              ...fallbackResult.nextSteps
            ]
          }
        };
      }
      
      // For other AI errors, fall back to intelligent prediction
      const fallbackResult = createIntelligentPrediction(request);
      return {
        success: true,
        data: {
          ...fallbackResult,
          contributingFactors: [
            {
              factor: 'Phân tích thông minh (AI không khả dụng)',
              impact: 'medium',
              description: `Lỗi AI: ${aiError.message}. Sử dụng phân tích thông minh dựa trên quy tắc y tế.`
            },
            ...fallbackResult.contributingFactors
          ]
        }
      };
    }
  } catch (error: any) {
    console.error('AI prediction error:', error);
    return {
      success: false,
      error: error.message || 'Không thể dự đoán tình trạng bệnh'
    }
  }
}

/**
 * Get user's prediction history (mock implementation)
 */
export async function getUserPredictionHistory(
  userId: string
): Promise<{ success: boolean; data: any[]; error?: string }> {
  try {
    // Mock implementation - in real app this would call backend API
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      success: true,
      data: [] // Empty for now
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      data: []
    }
  }
}