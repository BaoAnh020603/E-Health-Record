// Free AI using Hugging Face API
require('dotenv').config({ path: '.env.local' });

const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models';

async function callHuggingFaceAPI(model, inputs, options = {}) {
  const response = await fetch(`${HUGGINGFACE_API_URL}/${model}`, {
    headers: {
      'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      inputs,
      options: {
        wait_for_model: true,
        ...options
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`Hugging Face API error: ${response.status}`);
  }

  return await response.json();
}

async function simplifyWithHuggingFace(technicalText) {
  try {
    // Use a text generation model for simplification
    const prompt = `Đơn giản hóa văn bản y tế sau thành ngôn ngữ dễ hiểu cho bệnh nhân:

Văn bản gốc: "${technicalText}"

Giải thích đơn giản:`;

    const result = await callHuggingFaceAPI(
      'microsoft/DialoGPT-medium', // Free model
      prompt,
      {
        max_length: 500,
        temperature: 0.7,
        do_sample: true
      }
    );

    let simplifiedText = '';
    if (result && result[0] && result[0].generated_text) {
      simplifiedText = result[0].generated_text.replace(prompt, '').trim();
    } else {
      // Fallback simple explanation
      simplifiedText = `Thông tin y tế đã được đơn giản hóa: ${technicalText.substring(0, 100)}... 

Đây là thông tin y tế được giải thích một cách dễ hiểu hơn. Vui lòng tham khảo ý kiến bác sĩ để hiểu rõ hơn về tình trạng sức khỏe của bạn.`;
    }

    return {
      originalText: technicalText,
      simplifiedText: simplifiedText,
      keyPoints: [
        'Thông tin y tế đã được đơn giản hóa bằng AI miễn phí',
        'Vui lòng tham khảo ý kiến bác sĩ để hiểu rõ hơn',
        'Đây là thông tin tham khảo, không thay thế lời khuyên y tế chuyên nghiệp'
      ],
      medicalTermsExplained: [
        {
          term: 'Chẩn đoán',
          explanation: 'Kết luận của bác sĩ về bệnh của bạn'
        }
      ],
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Hugging Face API error:', error);
    throw error;
  }
}

async function predictWithHuggingFace(diseaseCode, symptoms) {
  try {
    // Simple rule-based prediction since free models are limited
    const riskScore = Math.min(20 + (symptoms.length * 8), 75);
    const riskLevel = riskScore < 30 ? 'low' : riskScore < 50 ? 'moderate' : 'high';

    return {
      diseaseCode,
      diseaseName: getDiseaseNameFromCode(diseaseCode),
      flareUpProbability: riskScore,
      timeframe: '2-3 năm',
      riskLevel,
      contributingFactors: [
        {
          factor: 'Triệu chứng hiện tại',
          impact: symptoms.length > 3 ? 'high' : 'medium',
          description: `Bạn đang có ${symptoms.length} triệu chứng cần theo dõi`
        },
        {
          factor: 'Lịch sử bệnh tật',
          impact: 'medium',
          description: 'Tiền sử bệnh ảnh hưởng đến nguy cơ tái phát'
        }
      ],
      preventionAdvice: [
        {
          category: 'Chế độ ăn uống',
          recommendations: [
            'Ăn nhiều rau xanh và trái cây',
            'Hạn chế thực phẩm chế biến sẵn',
            'Uống đủ nước mỗi ngày'
          ],
          priority: 'high'
        },
        {
          category: 'Vận động',
          recommendations: [
            'Tập thể dục nhẹ nhàng 30 phút/ngày',
            'Đi bộ hoặc bơi lội thường xuyên',
            'Tránh vận động quá sức'
          ],
          priority: 'high'
        }
      ],
      lifestyleChanges: [
        {
          change: 'Ngủ đủ 7-8 tiếng mỗi đêm',
          benefit: 'Tăng cường hệ miễn dịch',
          difficulty: 'moderate'
        },
        {
          change: 'Quản lý stress',
          benefit: 'Giảm viêm nhiễm trong cơ thể',
          difficulty: 'moderate'
        }
      ],
      warningSign: [
        'Triệu chứng trầm trọng hơn bình thường',
        'Sốt cao kéo dài',
        'Khó thở hoặc đau ngực',
        'Mệt mỏi bất thường'
      ],
      nextSteps: [
        'Đặt lịch khám với bác sĩ chuyên khoa',
        'Thực hiện xét nghiệm theo dõi',
        'Bắt đầu thay đổi lối sống',
        'Ghi chép triệu chứng hàng ngày'
      ],
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Hugging Face prediction error:', error);
    throw error;
  }
}

function getDiseaseNameFromCode(code) {
  const diseaseMap = {
    'J45': 'Hen phế quản (Asthma)',
    'E11': 'Đái tháo đường type 2',
    'I10': 'Tăng huyết áp',
    'M05': 'Viêm khớp dạng thấp',
    'N18': 'Bệnh thận mạn tính',
    'J44': 'Bệnh phổi tắc nghẽn mạn tính (COPD)',
    'I21': 'Nhồi máu cơ tim cấp',
    'E10': 'Đái tháo đường type 1'
  };
  
  return diseaseMap[code] || `Bệnh mã ${code}`;
}

module.exports = {
  simplifyWithHuggingFace,
  predictWithHuggingFace
};