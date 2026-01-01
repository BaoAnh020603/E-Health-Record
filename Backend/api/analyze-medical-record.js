const express = require('express');
const router = express.Router();

/**
 * Phân tích chuyên sâu bệnh án bằng AI để tạo nhắc nhở thông minh
 * Phân tích toàn bộ: chẩn đoán, điều trị, lời dặn bác sĩ, đơn thuốc
 */
router.post('/analyze-medical-record', async (req, res) => {
  try {
    console.log('🧠 Advanced medical record analysis request received');
    
    const { user_id, record, analysis_type } = req.body;
    
    if (!user_id || !record) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, record'
      });
    }

    if (analysis_type !== 'advanced') {
      return res.status(400).json({
        success: false,
        error: 'This endpoint is for advanced analysis only'
      });
    }

    console.log('📋 Analyzing record from:', record.ten_benh_vien);
    console.log('👨‍⚕️ Doctor:', record.bac_si_kham);
    console.log('🏥 Diagnosis:', record.chan_doan_ra || record.chan_doan_vao);

    let reminders;

    // Check analysis type: basic uses Gemini, advanced uses Groq
    if (analysis_type === 'advanced') {
      // ADVANCED: Use Groq for deep analysis
      console.log('🤖 Using Groq for advanced analysis');
      
      if (process.env.GROQ_API_KEY) {
        reminders = await analyzeWithGroq(record, user_id);
      } else {
        console.log('⚠️ Groq API key not found, using fallback');
        reminders = generateBasicReminders(record, user_id);
      }
    } else {
      // BASIC: Use Gemini or rule-based
      console.log('🤖 Using Gemini for basic analysis');
      
      if (process.env.GEMINI_API_KEY) {
        reminders = await analyzeWithGemini(record, user_id);
      } else {
        console.log('⚠️ Gemini API key not found, using rule-based');
        reminders = generateBasicReminders(record, user_id);
      }
    }

    console.log('✅ Advanced analysis completed');
    console.log(`📅 Generated ${reminders.length} intelligent reminders`);

    res.json({
      success: true,
      reminders: reminders,
      message: '✅ Đã phân tích chuyên sâu và tạo nhắc nhở thông minh',
      disclaimer: '⚠️ LƯU Ý: AI chỉ đề xuất nhắc nhở dựa trên phân tích bệnh án. KHÔNG tự ý thay đổi chỉ định của bác sĩ. Luôn tuân thủ lời dặn bác sĩ và liên hệ bác sĩ nếu có bất thường.'
    });

  } catch (error) {
    console.error('❌ Advanced analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể phân tích bệnh án',
      details: error.message
    });
  }
});

/**
 * Phân tích chuyên sâu bằng Groq (FREE, FAST)
 */
async function analyzeWithGroq(record, userId) {
  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    const prompt = createAdvancedAnalysisPrompt(record);

    // Try different Groq models (newest to oldest, verified working models)
    const modelsToTry = [
      'llama-3.3-70b-versatile',  // Latest Llama 3.3
      'llama-3.1-8b-instant',     // Fast and efficient
      'gemma2-9b-it',             // Google's Gemma 2
      'mixtral-8x7b-32768'        // Mixtral fallback
    ];

    for (const modelName of modelsToTry) {
      try {
        console.log(`🚀 Calling Groq API with ${modelName}`);
        
        const completion = await groq.chat.completions.create({
          model: modelName,
          messages: [
            {
              role: "system",
              content: `Bạn là chuyên gia y tế AI được Bộ Y tế phê duyệt, chuyên phân tích bệnh án và tạo kế hoạch nhắc nhở toàn diện.

NHIỆM VỤ: Phân tích TOÀN BỘ bệnh án (chẩn đoán, điều trị, lời dặn bác sĩ, đơn thuốc) và tạo nhắc nhở thông minh.

QUY TẮC QUAN TRỌNG:
1. Phân tích chẩn đoán để hiểu tình trạng bệnh
2. Xem xét phương pháp điều trị và kết quả
3. ƯU TIÊN lời dặn của bác sĩ
4. Tạo nhắc nhở uống thuốc + nhắc nhở chăm sóc sức khỏe
5. Đề xuất thời gian uống thuốc tối ưu dựa trên bệnh
6. Cảnh báo tương tác thuốc nếu có
7. KHÔNG thay đổi chỉ định bác sĩ

Trả lời bằng JSON với danh sách nhắc nhở chi tiết.`
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 3000
        });

        const response = completion.choices[0].message.content;
        console.log(`✅ Groq API success with ${modelName}`);
        return parseAIReminders(response, record, userId);
        
      } catch (modelError) {
        console.log(`❌ Model ${modelName} failed:`, modelError.message);
        if (modelError.response) {
          console.log('Response status:', modelError.response.status);
          console.log('Response data:', JSON.stringify(modelError.response.data));
        }
        continue;
      }
    }

    // All models failed
    console.error('❌ All Groq models failed');
    return generateBasicReminders(record, userId);

  } catch (error) {
    console.error('❌ Groq analysis error:', error.message);
    console.log('⚠️ Falling back to basic analysis');
    return generateBasicReminders(record, userId);
  }
}

/**
 * Phân tích chuyên sâu bằng OpenAI
 */
async function analyzeWithOpenAI(record, userId) {
  try {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = createAdvancedAnalysisPrompt(record);

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Bạn là chuyên gia y tế AI được Bộ Y tế phê duyệt, chuyên phân tích bệnh án và tạo kế hoạch nhắc nhở toàn diện.

NHIỆM VỤ: Phân tích TOÀN BỘ bệnh án (chẩn đoán, điều trị, lời dặn bác sĩ, đơn thuốc) và tạo nhắc nhở thông minh.

QUY TẮC QUAN TRỌNG:
1. Phân tích chẩn đoán để hiểu tình trạng bệnh
2. Xem xét phương pháp điều trị và kết quả
3. ƯU TIÊN lời dặn của bác sĩ
4. Tạo nhắc nhở uống thuốc + nhắc nhở chăm sóc sức khỏe
5. Đề xuất thời gian uống thuốc tối ưu dựa trên bệnh
6. Cảnh báo tương tác thuốc nếu có
7. KHÔNG thay đổi chỉ định bác sĩ

Trả lời bằng JSON với danh sách nhắc nhở chi tiết.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 3000
    });

    const response = completion.choices[0].message.content;
    return parseAIReminders(response, record, userId);

  } catch (error) {
    console.error('OpenAI advanced analysis error:', error);
    return generateBasicReminders(record, userId);
  }
}

/**
 * Phân tích chuyên sâu bằng Gemini
 */
async function analyzeWithGemini(record, userId) {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // List of models to try (from newest to oldest)
    const modelsToTry = [
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-pro-latest',
      'gemini-1.5-pro'
    ];
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`🔄 Trying Gemini model: ${modelName}`);
        
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 3000,
          }
        });

        const prompt = createAdvancedAnalysisPrompt(record);
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log(`✅ Success with Gemini model: ${modelName}`);
        return parseAIReminders(text, record, userId);
        
      } catch (modelError) {
        console.log(`❌ Model ${modelName} failed:`, modelError.message);
        if (modelError.status) {
          console.log('Error status:', modelError.status);
        }
        if (modelError.statusText) {
          console.log('Error status text:', modelError.statusText);
        }
        // Try next model
        continue;
      }
    }
    
    // All models failed
    console.error('❌ All Gemini models failed, using fallback');
    return generateBasicReminders(record, userId);

  } catch (error) {
    console.error('❌ Gemini advanced analysis error:', error.message);
    console.log('⚠️ Falling back to basic analysis');
    return generateBasicReminders(record, userId);
  }
}

/**
 * Tạo prompt phân tích chuyên sâu
 */
function createAdvancedAnalysisPrompt(record) {
  const medicationsText = record.toa_thuoc?.map((med, index) => `
${index + 1}. ${med.ten_thuoc}
   - Liều dùng: ${med.lieu_dung}
   - Tần suất: ${med.tan_suat}
   - Cách dùng: ${med.cach_dung || 'Theo chỉ định'}
   - Ghi chú: ${med.ghi_chu || 'Không có'}
  `).join('\n') || 'Không có đơn thuốc';

  return `
Phân tích CHUYÊN SÂU bệnh án sau và tạo kế hoạch nhắc nhở toàn diện:

THÔNG TIN BỆNH VIỆN:
- Bệnh viện: ${record.ten_benh_vien}
- Bác sĩ khám: ${record.bac_si_kham}
- Ngày khám: ${record.ngay_kham}

CHẨN ĐOÁN:
- Chẩn đoán vào viện: ${record.chan_doan_vao || 'Không có'}
- Chẩn đoán ra viện: ${record.chan_doan_ra || 'Không có'}

ĐIỀU TRỊ:
- Phương pháp điều trị: ${record.phuong_phap_dieu_tri || 'Không có'}
- Kết quả điều trị: ${record.ket_qua_dieu_tri || 'Không có'}

LỜI DẶN BÁC SĨ (QUAN TRỌNG):
${record.loi_dan_bac_si || 'Không có lời dặn'}

ĐƠN THUỐC:
${medicationsText}

GHI CHÚ KHÁC:
${record.ghi_chu || 'Không có'}

YÊU CẦU PHÂN TÍCH:
1. Phân tích tình trạng bệnh dựa trên chẩn đoán
2. Xem xét lời dặn bác sĩ (ƯU TIÊN CAO NHẤT)
3. Tạo lịch nhắc nhở uống thuốc tối ưu theo bệnh
4. Thêm nhắc nhở chăm sóc sức khỏe (tái khám, theo dõi, kiêng khem)
5. Cảnh báo tương tác thuốc nếu có
6. Đề xuất thời gian uống thuốc phù hợp với bệnh

Trả lời theo định dạng JSON:
{
  "reminders": [
    {
      "medication_name": "Tên thuốc",
      "dosage": "Liều dùng",
      "frequency": "Tần suất",
      "time": "HH:mm",
      "instructions": "Cách dùng + lưu ý",
      "ai_notes": "Ghi chú từ AI về thuốc này",
      "recommendations": "Đề xuất từ AI (tương tác, lưu ý đặc biệt)"
    }
  ],
  "health_reminders": [
    {
      "type": "checkup|lifestyle|warning",
      "title": "Tiêu đề",
      "description": "Mô tả chi tiết",
      "time": "HH:mm",
      "frequency": "daily|weekly|monthly"
    }
  ]
}
`;
}

/**
 * Parse kết quả AI
 */
function parseAIReminders(response, record, userId) {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      const allReminders = [];
      
      // Medication reminders
      if (parsed.reminders && Array.isArray(parsed.reminders)) {
        for (const reminder of parsed.reminders) {
          allReminders.push({
            medication_name: reminder.medication_name,
            dosage: reminder.dosage,
            frequency: reminder.frequency,
            time: reminder.time,
            instructions: reminder.instructions,
            ai_notes: reminder.ai_notes,
            recommendations: reminder.recommendations
          });
        }
      }
      
      // Health reminders (tái khám, lifestyle, etc.)
      if (parsed.health_reminders && Array.isArray(parsed.health_reminders)) {
        for (const healthReminder of parsed.health_reminders) {
          allReminders.push({
            medication_name: `[${healthReminder.type.toUpperCase()}] ${healthReminder.title}`,
            dosage: 'N/A',
            frequency: healthReminder.frequency,
            time: healthReminder.time,
            instructions: healthReminder.description,
            ai_notes: 'Nhắc nhở chăm sóc sức khỏe từ AI',
            recommendations: 'Tuân thủ lời dặn bác sĩ'
          });
        }
      }
      
      return allReminders;
    }
  } catch (error) {
    console.log('Failed to parse AI response, using basic fallback');
  }

  return generateBasicReminders(record, userId);
}

/**
 * Fallback: Tạo nhắc nhở cơ bản
 */
function generateBasicReminders(record, userId) {
  const reminders = [];

  if (record.toa_thuoc && record.toa_thuoc.length > 0) {
    for (const med of record.toa_thuoc) {
      const times = parseFrequency(med.tan_suat);

      for (const time of times) {
        reminders.push({
          medication_name: med.ten_thuoc,
          dosage: med.lieu_dung,
          frequency: med.tan_suat || 'Theo chỉ định bác sĩ',
          time: time,
          instructions: med.cach_dung || 'Theo chỉ định bác sĩ',
          ai_notes: 'Nhắc nhở cơ bản từ đơn thuốc',
          recommendations: 'Tuân thủ chỉ định bác sĩ'
        });
      }
    }
  }

  return reminders;
}

/**
 * Parse frequency
 */
function parseFrequency(frequency) {
  if (!frequency) return ['08:00', '20:00'];
  
  const freq = frequency.toLowerCase();

  if (freq.includes('1 lần') || freq.includes('một lần')) {
    return ['08:00'];
  } else if (freq.includes('2 lần') || freq.includes('hai lần')) {
    return ['08:00', '20:00'];
  } else if (freq.includes('3 lần') || freq.includes('ba lần')) {
    return ['08:00', '13:00', '20:00'];
  } else if (freq.includes('4 lần') || freq.includes('bốn lần')) {
    return ['08:00', '12:00', '16:00', '20:00'];
  }

  return ['08:00', '20:00'];
}

module.exports = router;
