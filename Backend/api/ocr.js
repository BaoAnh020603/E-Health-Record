const express = require('express');
const router = express.Router();
const deepseekOCR = require('../services/deepseek-ocr-service');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

/**
 * POST /api/ocr/analyze
 * Phân tích ảnh/text đơn thuốc bằng DeepSeek
 */
router.post('/analyze', async (req, res) => {
  try {
    const { text, userId } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu dữ liệu text'
      });
    }

    // Xử lý bằng DeepSeek
    const result = await deepseekOCR.processText(text);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Lưu kết quả vào database nếu có userId
    if (userId && result.data) {
      await saveReminders(userId, result.data);
    }

    res.json({
      success: true,
      data: result.data,
      stats: {
        originalLength: result.originalTextLength,
        filteredLength: result.filteredTextLength,
        filterRate: Math.round((1 - result.filteredTextLength / result.originalTextLength) * 100)
      }
    });
  } catch (error) {
    console.error('OCR API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Lưu nhắc nhở vào database
 */
async function saveReminders(userId, analysis) {
  try {
    // Lưu lịch khám
    if (analysis.appointments && analysis.appointments.length > 0) {
      for (const appointment of analysis.appointments) {
        await supabase.from('appointments').insert({
          user_id: userId,
          date: appointment.date,
          time: appointment.time,
          doctor: appointment.doctor,
          location: appointment.location,
          notes: appointment.notes,
          created_from: 'ocr'
        });
      }
    }

    // Lưu lịch uống thuốc
    if (analysis.medications && analysis.medications.length > 0) {
      for (const medication of analysis.medications) {
        // Lưu thông tin thuốc
        const { data: medData } = await supabase
          .from('medications')
          .insert({
            user_id: userId,
            name: medication.name,
            dosage: medication.dosage,
            frequency: medication.frequency,
            instructions: medication.instructions,
            start_date: medication.startDate,
            duration: medication.duration,
            created_from: 'ocr'
          })
          .select()
          .single();

        // Tạo nhắc nhở cho từng thời điểm trong ngày
        if (medData && medication.timing) {
          for (const time of medication.timing) {
            await supabase.from('medication_reminders').insert({
              medication_id: medData.id,
              user_id: userId,
              time_of_day: time,
              enabled: true
            });
          }
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Save Reminders Error:', error);
    throw error;
  }
}

module.exports = router;
