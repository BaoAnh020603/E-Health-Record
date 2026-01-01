// Backend API endpoint for AI text simplification
// This will be called by the mobile app

const OpenAI = require('openai');
const { simplifyWithHuggingFace } = require('./ai-huggingface');
require('dotenv').config({ path: '.env.local' });

// Initialize OpenAI only if using OpenAI provider
let openai = null;
if (process.env.AI_PROVIDER === 'openai') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

async function simplifyMedicalText(req, res) {
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
    const { technicalText, context, userName } = req.body;

    if (!technicalText || technicalText.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Văn bản y tế không được để trống' 
      });
    }

    console.log('Simplifying text with provider:', process.env.AI_PROVIDER);
    console.log('Text:', technicalText.substring(0, 100) + '...');
    console.log('User name for greeting:', userName || 'No name provided');

    let response_data;

    if (process.env.AI_PROVIDER === 'huggingface') {
      // Use free Hugging Face API
      if (!process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY === 'your_free_huggingface_token') {
        return res.status(400).json({
          success: false,
          error: 'Vui lòng cấu hình HUGGINGFACE_API_KEY. Truy cập https://huggingface.co/settings/tokens để lấy token miễn phí.'
        });
      }

      response_data = await simplifyWithHuggingFace(technicalText, userName);
      
    } else if (process.env.AI_PROVIDER === 'openai' && openai) {
      // Use OpenAI (paid)
      const greetingText = userName ? `Xin chào ${userName}! ` : 'Xin chào! ';
      
      const response = await openai.chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Bạn là một bác sĩ chuyên dịch thuật y tế. Nhiệm vụ của bạn là chuyển đổi thuật ngữ y tế phức tạp thành ngôn ngữ đơn giản, dễ hiểu cho bệnh nhân.

Hãy:
1. Giải thích bằng ngôn ngữ thông thường, tránh thuật ngữ y tế
2. Sử dụng ví dụ và so sánh dễ hiểu
3. Thể hiện sự đồng cảm và an ủi
4. Duy trì tính chính xác trong khi đơn giản hóa
5. Trả lời bằng tiếng Việt
6. Bắt đầu giải thích với lời chào: "${greetingText}"

Định dạng phản hồi dưới dạng JSON:
{
  "simplifiedText": "${greetingText}Giải thích đơn giản",
  "keyPoints": ["Điểm chính 1", "Điểm chính 2", "Điểm chính 3"],
  "medicalTermsExplained": [
    {"term": "Thuật ngữ", "explanation": "Giải thích"}
  ]
}`
          },
          {
            role: 'user',
            content: `Hãy đơn giản hóa văn bản y tế sau cho bệnh nhân hiểu:

Văn bản y tế: ${technicalText}

${context ? `Thông tin bổ sung: ${JSON.stringify(context)}` : ''}

Hãy cung cấp lời giải thích rõ ràng, đơn giản mà bệnh nhân có thể hiểu được.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const content = response.choices[0].message.content;
      console.log('OpenAI Response received:', content.substring(0, 200) + '...');

      let result;
      try {
        result = JSON.parse(content);
      } catch (parseError) {
        console.log('Failed to parse JSON, using text response');
        result = {
          simplifiedText: content,
          keyPoints: [
            'Thông tin y tế đã được đơn giản hóa',
            'Vui lòng tham khảo ý kiến bác sĩ để hiểu rõ hơn',
            'Đây là thông tin tham khảo, không thay thế lời khuyên y tế'
          ],
          medicalTermsExplained: []
        };
      }

      response_data = {
        originalText: technicalText,
        simplifiedText: result.simplifiedText || content,
        keyPoints: result.keyPoints || [],
        medicalTermsExplained: result.medicalTermsExplained || [],
        timestamp: new Date().toISOString()
      };
      
    } else {
      // Fallback to simple rule-based simplification
      response_data = {
        originalText: technicalText,
        simplifiedText: `Giải thích đơn giản: ${technicalText}

Đây là thông tin y tế được trình bày một cách dễ hiểu hơn. Vui lòng tham khảo ý kiến bác sĩ để có lời khuyên chính xác về tình trạng sức khỏe của bạn.`,
        keyPoints: [
          'Thông tin y tế đã được đơn giản hóa',
          'Vui lòng tham khảo ý kiến bác sĩ để hiểu rõ hơn',
          'Đây là thông tin tham khảo, không thay thế lời khuyên y tế chuyên nghiệp'
        ],
        medicalTermsExplained: [
          {
            term: 'Chẩn đoán',
            explanation: 'Kết luận của bác sĩ về bệnh của bạn sau khi khám và xét nghiệm'
          }
        ],
        timestamp: new Date().toISOString()
      };
    }

    console.log('Sending response to mobile app');
    res.json({
      success: true,
      data: response_data
    });

  } catch (error) {
    console.error('AI API error:', error);
    
    let errorMessage = 'Không thể đơn giản hóa văn bản y tế';
    
    if (error.message.includes('quota')) {
      errorMessage = 'Đã vượt quá hạn mức API. Vui lòng thêm credits vào tài khoản OpenAI.';
    } else if (error.message.includes('API key')) {
      errorMessage = 'API key không hợp lệ. Vui lòng kiểm tra cấu hình.';
    } else if (error.message.includes('Hugging Face')) {
      errorMessage = 'Lỗi API Hugging Face. Vui lòng kiểm tra token hoặc thử lại sau.';
    }

    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}

module.exports = simplifyMedicalText;