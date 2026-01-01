const express = require('express');
const router = express.Router();

/**
 * Phân tích đơn thuốc bằng AI để tạo lịch nhắc nhở thông minh
 * QUAN TRỌNG: AI CHỈ TẠO NHẮC NHỞ, KHÔNG THAY ĐỔI CHỈ ĐỊNH CỦA BÁC SĨ
 */
router.post('/analyze-prescription', async (req, res) => {
  try {
    console.log('💊 Prescription analysis request received');
    
    const { user_id, prescription_data } = req.body;
    
    if (!user_id || !prescription_data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, prescription_data'
      });
    }

    // Xác minh đơn thuốc có đầy đủ thông tin từ bác sĩ
    if (!prescription_data.verified_by_doctor) {
      return res.status(400).json({
        success: false,
        error: 'Đơn thuốc chưa được xác minh từ bác sĩ'
      });
    }

    if (!prescription_data.user_confirmed) {
      return res.status(400).json({
        success: false,
        error: 'Người dùng chưa cam kết đơn thuốc từ bác sĩ'
      });
    }

    console.log('✅ Prescription verified and user confirmed');
    console.log('🔍 Analyzing prescription from:', prescription_data.bac_si_ke_don);
    console.log('🏥 Hospital:', prescription_data.benh_vien);
    console.log('💊 Medications:', prescription_data.medications.length);

    let reminders;

    // For basic prescription analysis, use Gemini
    console.log('🤖 Using Gemini for basic prescription reminders');
    
    if (process.env.GEMINI_API_KEY) {
      reminders = await analyzeWithGemini(prescription_data, user_id);
    } else {
      console.log('⚠️ Gemini API key not found, using rule-based analysis');
      reminders = generateRuleBasedReminders(prescription_data, user_id);
    }

    console.log('✅ Prescription analysis completed successfully');
    console.log(`📅 Generated ${reminders.length} medication reminders`);

    res.json({
      success: true,
      reminders: reminders,
      message: '✅ Đã tạo lịch nhắc nhở uống thuốc thành công',
      disclaimer: '⚠️ LƯU Ý: AI chỉ tạo nhắc nhở dựa trên đơn thuốc của bác sĩ. KHÔNG tự ý thay đổi liều lượng, tần suất hoặc ngừng thuốc. Luôn tuân thủ chỉ định của bác sĩ và liên hệ bác sĩ nếu có bất thường.'
    });

  } catch (error) {
    console.error('❌ Prescription analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể phân tích đơn thuốc',
      details: error.message
    });
  }
});

/**
 * Phân tích đơn thuốc bằng Groq (FREE, FAST)
 */
async function analyzeWithGroq(prescriptionData, userId) {
  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    const prompt = createPrescriptionAnalysisPrompt(prescriptionData);

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
              content: `Bạn là trợ lý y tế AI được Bộ Y tế phê duyệt. 
          
NHIỆM VỤ: Phân tích đơn thuốc của bác sĩ và tạo lịch nhắc nhở uống thuốc cho bệnh nhân.

QUY TẮC QUAN TRỌNG:
1. CHỈ TẠO NHẮC NHỞ - KHÔNG THAY ĐỔI CHỈ ĐỊNH CỦA BÁC SĨ
2. Giữ nguyên liều lượng, tần suất, cách dùng theo đơn bác sĩ
3. Chỉ đề xuất thời gian uống thuốc hợp lý trong ngày
4. Luôn nhắc nhở tuân thủ chỉ định bác sĩ
5. Cảnh báo không tự ý thay đổi hoặc ngừng thuốc

Trả lời bằng JSON với danh sách nhắc nhở.`
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        });

        const response = completion.choices[0].message.content;
        console.log(`✅ Groq API success with ${modelName}`);
        return parseAIReminders(response, prescriptionData, userId);
        
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
    return generateRuleBasedReminders(prescriptionData, userId);

  } catch (error) {
    console.error('❌ Groq analysis error:', error.message);
    console.log('⚠️ Falling back to rule-based analysis');
    return generateRuleBasedReminders(prescriptionData, userId);
  }
}

/**
 * Phân tích đơn thuốc bằng OpenAI
 */
async function analyzeWithOpenAI(prescriptionData, userId) {
  try {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = createPrescriptionAnalysisPrompt(prescriptionData);

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Bạn là trợ lý y tế AI được Bộ Y tế phê duyệt. 
          
NHIỆM VỤ: Phân tích đơn thuốc của bác sĩ và tạo lịch nhắc nhở uống thuốc cho bệnh nhân.

QUY TẮC QUAN TRỌNG:
1. CHỈ TẠO NHẮC NHỞ - KHÔNG THAY ĐỔI CHỈ ĐỊNH CỦA BÁC SĨ
2. Giữ nguyên liều lượng, tần suất, cách dùng theo đơn bác sĩ
3. Chỉ đề xuất thời gian uống thuốc hợp lý trong ngày
4. Luôn nhắc nhở tuân thủ chỉ định bác sĩ
5. Cảnh báo không tự ý thay đổi hoặc ngừng thuốc

Trả lời bằng JSON với danh sách nhắc nhở.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const response = completion.choices[0].message.content;
    return parseAIReminders(response, prescriptionData, userId);

  } catch (error) {
    console.error('OpenAI analysis error:', error);
    return generateRuleBasedReminders(prescriptionData, userId);
  }
}

/**
 * Phân tích đơn thuốc bằng Gemini
 */
async function analyzeWithGemini(prescriptionData, userId) {
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
            maxOutputTokens: 2000,
          }
        });

        const prompt = createPrescriptionAnalysisPrompt(prescriptionData);
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log(`✅ Success with Gemini model: ${modelName}`);
        return parseAIReminders(text, prescriptionData, userId);
        
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
    return generateRuleBasedReminders(prescriptionData, userId);

  } catch (error) {
    console.error('❌ Gemini analysis error:', error.message);
    console.log('⚠️ Falling back to rule-based analysis');
    return generateRuleBasedReminders(prescriptionData, userId);
  }
}

/**
 * Tạo prompt cho AI phân tích đơn thuốc
 */
function createPrescriptionAnalysisPrompt(prescriptionData) {
  const medicationsText = prescriptionData.medications.map((med, index) => `
${index + 1}. ${med.ten_thuoc}
   - Liều dùng: ${med.lieu_dung}
   - Tần suất: ${med.tan_suat}
   - Cách dùng: ${med.cach_dung || 'Theo chỉ định'}
   - Ghi chú: ${med.ghi_chu || 'Không có'}
  `).join('\n');

  return `
Phân tích đơn thuốc sau và tạo lịch nhắc nhở uống thuốc:

THÔNG TIN ĐỚN THUỐC:
- Bác sĩ kê đơn: ${prescriptionData.bac_si_ke_don}
- Bệnh viện: ${prescriptionData.benh_vien}
- Ngày kê đơn: ${prescriptionData.ngay_ke_don}
- Chẩn đoán: ${prescriptionData.chan_doan}

DANH SÁCH THUỐC:
${medicationsText}

YÊU CẦU:
1. Tạo lịch nhắc nhở cho từng loại thuốc
2. Đề xuất thời gian uống hợp lý trong ngày (VD: 8:00, 13:00, 20:00)
3. GIỮ NGUYÊN liều lượng và cách dùng theo đơn bác sĩ
4. Thêm lời nhắc tuân thủ chỉ định bác sĩ

Trả lời theo định dạng JSON:
{
  "reminders": [
    {
      "medication_name": "Tên thuốc",
      "dosage": "Liều dùng theo đơn bác sĩ",
      "time": "HH:mm",
      "frequency": "Tần suất theo đơn",
      "instructions": "Cách dùng + nhắc nhở tuân thủ"
    }
  ]
}
`;
}

/**
 * Parse kết quả từ AI
 */
function parseAIReminders(response, prescriptionData, userId) {
  try {
    // Tìm JSON trong response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (parsed.reminders && Array.isArray(parsed.reminders)) {
        const allReminders = [];
        
        for (const reminder of parsed.reminders) {
          // Check if time contains multiple times (e.g., "8:00, 20:00")
          const timeStr = reminder.time || '';
          const times = timeStr.includes(',') 
            ? timeStr.split(',').map(t => t.trim()) 
            : [timeStr.trim()];
          
          // Create a reminder for each time
          for (const time of times) {
            // Validate time format (HH:mm)
            if (!/^\d{1,2}:\d{2}$/.test(time)) {
              console.warn(`Invalid time format: ${time}, skipping`);
              continue;
            }
            
            allReminders.push({
              id: `med_${prescriptionData.record_id}_${reminder.medication_name}_${time}`.replace(/\s/g, '_'),
              user_id: userId,
              medication_name: reminder.medication_name,
              dosage: reminder.dosage,
              time: time,
              frequency: reminder.frequency || 'Theo chỉ định bác sĩ',
              instructions: reminder.instructions || 'Theo chỉ định bác sĩ',
              prescription_id: prescriptionData.record_id,
              doctor_name: prescriptionData.bac_si_ke_don,
              hospital: prescriptionData.benh_vien,
              diagnosis: prescriptionData.chan_doan,
              scheduled_time: getNextScheduledTime(time),
              is_active: true,
              created_at: new Date().toISOString()
            });
          }
        }
        
        return allReminders;
      }
    }
  } catch (error) {
    console.log('Failed to parse AI response, using rule-based fallback');
  }

  return generateRuleBasedReminders(prescriptionData, userId);
}

/**
 * Tạo nhắc nhở dựa trên quy tắc (fallback khi AI không khả dụng)
 */
function generateRuleBasedReminders(prescriptionData, userId) {
  const reminders = [];

  for (const med of prescriptionData.medications) {
    const times = parseFrequency(med.tan_suat, med.thoi_gian_uong);
    const frequency = med.tan_suat || 'Theo chỉ định bác sĩ';

    for (const time of times) {
      const instructions = buildInstructions(med);
      
      reminders.push({
        id: `med_${prescriptionData.record_id}_${med.ten_thuoc}_${time}`.replace(/\s/g, '_'),
        user_id: userId,
        medication_name: med.ten_thuoc,
        dosage: med.lieu_dung,
        time: time,
        frequency: frequency,
        instructions: instructions,
        prescription_id: prescriptionData.record_id,
        doctor_name: prescriptionData.bac_si_ke_don,
        hospital: prescriptionData.benh_vien,
        diagnosis: prescriptionData.chan_doan,
        scheduled_time: getNextScheduledTime(time),
        is_active: true,
        created_at: new Date().toISOString()
      });
    }
  }

  return reminders;
}

/**
 * Phân tích tần suất uống thuốc
 */
function parseFrequency(frequency, customTimes) {
  // Nếu có thời gian tùy chỉnh
  if (customTimes && Array.isArray(customTimes) && customTimes.length > 0) {
    return customTimes;
  }

  // Nếu không có frequency, mặc định 2 lần/ngày
  if (!frequency) {
    return ['08:00', '20:00'];
  }

  const freq = frequency.toLowerCase();

  // 1 lần/ngày
  if (freq.includes('1 lần') || freq.includes('một lần') || freq.includes('1x')) {
    return ['08:00'];
  }

  // 2 lần/ngày
  if (freq.includes('2 lần') || freq.includes('hai lần') || freq.includes('2x')) {
    return ['08:00', '20:00'];
  }

  // 3 lần/ngày
  if (freq.includes('3 lần') || freq.includes('ba lần') || freq.includes('3x')) {
    return ['08:00', '13:00', '20:00'];
  }

  // 4 lần/ngày
  if (freq.includes('4 lần') || freq.includes('bốn lần') || freq.includes('4x')) {
    return ['08:00', '12:00', '16:00', '20:00'];
  }

  // Mặc định: 2 lần/ngày
  return ['08:00', '20:00'];
}

/**
 * Xây dựng hướng dẫn uống thuốc
 */
function buildInstructions(medication) {
  let instructions = medication.cach_dung || 'Theo chỉ định bác sĩ';
  
  // Thêm disclaimer
  instructions += ' - Không tự ý thay đổi liều lượng.';
  
  if (medication.ghi_chu) {
    instructions += ` Lưu ý: ${medication.ghi_chu}`;
  }
  
  return instructions;
}

/**
 * Tính thời gian nhắc nhở tiếp theo
 */
function getNextScheduledTime(timeStr) {
  try {
    if (!timeStr || typeof timeStr !== 'string') {
      console.warn('Invalid timeStr:', timeStr);
      return new Date().toISOString();
    }
    
    const parts = timeStr.split(':');
    if (parts.length < 2) {
      console.warn('Invalid time format:', timeStr);
      return new Date().toISOString();
    }
    
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.warn('Invalid hours/minutes:', hours, minutes);
      return new Date().toISOString();
    }
    
    const now = new Date();
    const scheduled = new Date();
    
    scheduled.setHours(hours, minutes, 0, 0);
    
    if (scheduled < now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }
    
    return scheduled.toISOString();
  } catch (error) {
    console.error('Error in getNextScheduledTime:', error);
    return new Date().toISOString();
  }
}

module.exports = router;
