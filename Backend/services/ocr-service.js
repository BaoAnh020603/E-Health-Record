const Tesseract = require('tesseract.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class OCRService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  /**
   * Trích xuất text từ ảnh sử dụng Tesseract OCR
   */
  async extractTextFromImage(imageBuffer) {
    try {
      const result = await Tesseract.recognize(
        imageBuffer,
        'vie+eng', // Hỗ trợ tiếng Việt và tiếng Anh
        {
          logger: m => console.log(m)
        }
      );
      
      return {
        success: true,
        text: result.data.text,
        confidence: result.data.confidence
      };
    } catch (error) {
      console.error('OCR Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Phân tích text bằng AI để trích xuất thông tin lịch khám/uống thuốc
   */
  async analyzeTextWithAI(text) {
    try {
      const prompt = `
Phân tích văn bản đơn thuốc sau và trích xuất thông tin về thuốc và lịch khám.
Chỉ trích xuất TỐI ĐA 10 LOẠI THUỐC QUAN TRỌNG NHẤT (những thuốc có đầy đủ thông tin liều lượng và tần suất).

Trả về JSON với cấu trúc sau (KHÔNG thêm markdown, chỉ JSON thuần):

{
  "type": "medication",
  "appointments": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "doctor": "tên bác sĩ",
      "location": "địa điểm",
      "notes": "ghi chú"
    }
  ],
  "medications": [
    {
      "name": "tên thuốc",
      "dosage": "liều lượng",
      "frequency": "tần suất",
      "timing": ["sáng", "trưa", "tối"],
      "duration": "thời gian",
      "instructions": "hướng dẫn",
      "startDate": "YYYY-MM-DD"
    }
  ],
  "summary": "tóm tắt ngắn gọn"
}

Văn bản:
${text}

LƯU Ý: Chỉ trả về JSON, không thêm markdown hay text khác. Chỉ lấy 10 thuốc quan trọng nhất.
`;

      // Thử các model khác nhau với API v1beta (giống server.js)
      const models = [
        'gemini-2.5-flash',
        'gemini-flash-latest',
        'gemini-2.0-flash',
        'gemini-pro-latest'
      ];

      let lastError = null;
      
      for (const modelName of models) {
        try {
          console.log(`Trying model: ${modelName}`);
          
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.3,
                  maxOutputTokens: 4096
                }
              })
            }
          );

          if (response.ok) {
            const data = await response.json();
            const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            console.log('AI Response (first 1000 chars):', aiText.substring(0, 1000)); // Debug
            
            // Remove markdown code blocks if present
            let cleanText = aiText.trim();
            if (cleanText.startsWith('```json')) {
              cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
            } else if (cleanText.startsWith('```')) {
              cleanText = cleanText.replace(/```\n?/g, '');
            }
            
            // Parse JSON từ response
            try {
              const parsed = JSON.parse(cleanText);
              return {
                success: true,
                data: parsed
              };
            } catch (parseError) {
              console.log('JSON parse error:', parseError.message);
              console.log('Trying to extract JSON...');
              
              // Try to find JSON in the text
              const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  const parsed = JSON.parse(jsonMatch[0]);
                  return {
                    success: true,
                    data: parsed
                  };
                } catch (e) {
                  console.log('Still failed to parse');
                }
              }
              
              // Trả về raw text nếu không parse được
              return {
                success: true,
                data: {
                  type: 'medication',
                  medications: [],
                  appointments: [],
                  summary: aiText.substring(0, 1000)
                }
              };
            }
          } else {
            const errorText = await response.text();
            lastError = new Error(`${modelName}: ${response.status} - ${errorText.substring(0, 100)}`);
            console.log(`Model ${modelName} failed, trying next...`);
            continue;
          }
        } catch (error) {
          lastError = error;
          console.log(`Model ${modelName} error:`, error.message);
          continue;
        }
      }
      
      throw lastError || new Error('All models failed');
      
    } catch (error) {
      console.error('AI Analysis Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Xử lý toàn bộ quy trình: OCR + AI Analysis
   */
  async processImage(imageBuffer) {
    // Bước 1: Trích xuất text từ ảnh
    const ocrResult = await this.extractTextFromImage(imageBuffer);
    
    if (!ocrResult.success) {
      return ocrResult;
    }

    console.log('Extracted Text:', ocrResult.text);

    // Bước 2: Phân tích text bằng AI
    const analysisResult = await this.analyzeTextWithAI(ocrResult.text);
    
    return {
      success: analysisResult.success,
      extractedText: ocrResult.text,
      confidence: ocrResult.confidence,
      analysis: analysisResult.data,
      error: analysisResult.error
    };
  }
}

module.exports = new OCRService();
