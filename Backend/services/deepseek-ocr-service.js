require('dotenv').config({ path: '.env.local' });

class DeepSeekOCRService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.apiUrl = 'https://api.deepseek.com/v1/chat/completions';
  }

  /**
   * Middleware lọc thông tin quan trọng từ text
   * Chỉ giữ lại: thuốc, lịch tái khám, lời dặn bác sĩ
   */
  filterImportantInfo(text) {
    const lines = text.split('\n');
    const important = [];
    
    // Keywords để nhận diện thông tin quan trọng
    const medicationKeywords = ['thuốc', 'viên', 'lần/ngày', 'mg', 'ml', 'uống', 'liều'];
    const appointmentKeywords = ['tái khám', 'khám lại', 'hẹn khám', 'ngày khám'];
    const instructionKeywords = ['lời dặn', 'chú ý', 'hướng dẫn', 'cắt chỉ', 'thay băng'];
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Kiểm tra có chứa keyword quan trọng không
      const hasMedication = medicationKeywords.some(kw => lowerLine.includes(kw));
      const hasAppointment = appointmentKeywords.some(kw => lowerLine.includes(kw));
      const hasInstruction = instructionKeywords.some(kw => lowerLine.includes(kw));
      
      if (hasMedication || hasAppointment || hasInstruction) {
        important.push(line.trim());
      }
    }
    
    return important.join('\n');
  }

  /**
   * Phân tích text bằng DeepSeek API
   */
  async analyzeWithDeepSeek(text) {
    try {
      // Lọc text trước khi gửi cho AI
      const filteredText = this.filterImportantInfo(text);
      
      console.log(`📊 Đã lọc từ ${text.length} → ${filteredText.length} ký tự`);
      
      const prompt = `Bạn là chuyên gia phân tích đơn thuốc y tế. Phân tích văn bản sau và trích xuất CHÍNH XÁC:

1. THUỐC: Tên, liều lượng, tần suất, thời gian uống (sáng/trưa/tối), thời hạn
2. LỊCH TÁI KHÁM: Ngày, giờ, địa điểm
3. LỜI DẶN BÁC SĨ: Các hướng dẫn quan trọng

Trả về JSON thuần (KHÔNG có markdown):
{
  "medications": [
    {
      "name": "tên thuốc",
      "dosage": "liều lượng",
      "frequency": "tần suất",
      "timing": ["sáng", "trưa", "tối"],
      "duration": "thời hạn",
      "instructions": "hướng dẫn"
    }
  ],
  "appointments": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "location": "địa điểm",
      "notes": "ghi chú"
    }
  ],
  "doctorInstructions": "lời dặn của bác sĩ",
  "summary": "tóm tắt ngắn gọn"
}

Văn bản:
${filteredText}

CHỈ trả về JSON, không thêm text khác.`;

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 4096
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const aiText = data.choices?.[0]?.message?.content || '';
      
      console.log('DeepSeek Response (first 500 chars):', aiText.substring(0, 500));
      
      // Parse JSON
      let cleanText = aiText.trim();
      
      // Remove markdown if present
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\n?/g, '');
      }
      
      try {
        const parsed = JSON.parse(cleanText);
        return {
          success: true,
          data: parsed,
          filteredTextLength: filteredText.length,
          originalTextLength: text.length
        };
      } catch (parseError) {
        console.log('JSON parse error:', parseError.message);
        
        // Try to extract JSON
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              success: true,
              data: parsed,
              filteredTextLength: filteredText.length,
              originalTextLength: text.length
            };
          } catch (e) {
            console.log('Still failed to parse');
          }
        }
        
        return {
          success: false,
          error: 'Không thể parse JSON từ DeepSeek response',
          rawResponse: aiText.substring(0, 1000)
        };
      }
      
    } catch (error) {
      console.error('DeepSeek Analysis Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Xử lý toàn bộ: lọc text → phân tích bằng DeepSeek
   */
  async processText(text) {
    console.log('🚀 Bắt đầu xử lý với DeepSeek OCR...');
    
    // Kiểm tra API key
    if (!this.apiKey || this.apiKey === 'your_deepseek_key_here') {
      return {
        success: false,
        error: 'DEEPSEEK_API_KEY chưa được cấu hình trong .env.local'
      };
    }
    
    const result = await this.analyzeWithDeepSeek(text);
    
    if (result.success) {
      console.log('✅ DeepSeek phân tích thành công!');
      console.log(`📊 Lọc: ${result.originalTextLength} → ${result.filteredTextLength} ký tự`);
    }
    
    return result;
  }
}

module.exports = new DeepSeekOCRService();
