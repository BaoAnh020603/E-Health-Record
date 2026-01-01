// Simple Express server for AI API endpoints
const express = require('express');
const cors = require('cors');
const simplifyEndpoint = require('./api/ai-simplify');
const predictEndpoint = require('./api/ai-predict');
const medicalReview = require('./api/medical-review');
const predictDisease = require('./api/ai-predict');
const ministryIntegration = require('./api/ministry-integration');
const aiCredibility = require('./api/ai-credibility');
const analyzeMedicalRecord = require('./api/analyze-medical-record');
const analyzePatientHistory = require('./api/analyze-patient-history');
const analyzePrescription = require('./api/analyze-prescription');
const ocrRouter = require('./api/ocr');
const prescriptionOCR = require('./api/prescription-ocr');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/medical-review', medicalReview);
app.use('/api/ai-predict', predictDisease);
app.use('/api/ministry-integration', ministryIntegration);
app.use('/api/ai-credibility', aiCredibility);
app.use('/api', analyzeMedicalRecord);
app.use('/api', analyzePatientHistory);
app.use('/api', analyzePrescription);
app.use('/api/ocr', ocrRouter);
app.use('/api/prescription', prescriptionOCR);
// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'AI Medical Assistant API is running - MODIFIED TEST',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/ai-simplify', 
      '/api/ai-predict', 
      '/api/medical-review', 
      '/api/ministry-integration',
      '/api/ai-credibility',
      '/api/analyze-medical-record',
      '/api/analyze-patient-history',
      '/api/explain-medical-term',
      '/api/analyze-prescription',
      '/api/ocr/analyze',
      '/api/prescription/analyze',
      '/api/prescription/get-data',
      '/api/prescription/create-reminders',
      '/api/prescription/check-duplicates'
    ],
    dashboards: [
      '/dashboard/medical-review-dashboard.html',
      '/dashboard/ministry-approval-dashboard.html',
      '/dashboard/patient-trust-dashboard.html'
    ]
  });
});

// Test endpoint right after health check
app.get('/health-test', (req, res) => {
  res.json({ message: 'Health test working!' });
});

// AI-powered medical term explanation using Gemini
async function explainMedicalTermHandler(req, res) {
  try {
    console.log('🔍 AI medical term explanation request received');
    
    const { user_id, term, include_videos, include_medication_instructions, language } = req.body;
    
    if (!user_id || !term) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, term'
      });
    }

    // Check if AI provider is configured
    if (!process.env.AI_PROVIDER || !process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'AI provider not configured. Please set GEMINI_API_KEY in .env.local'
      });
    }

    console.log(`🤖 Calling Gemini AI to explain: ${term}`);

    // Prepare prompt for AI
    const prompt = `Bạn là trợ lý y tế chuyên nghiệp. Hãy giải thích thuật ngữ y tế "${term}" bằng tiếng Việt đơn giản, dễ hiểu cho bệnh nhân.

Trả lời ĐÚNG định dạng JSON sau (không thêm text nào khác):
{
  "simple_explanation": "Giải thích đơn giản bằng ngôn ngữ thường ngày",
  "detailed_explanation": "Giải thích chi tiết hơn về thuật ngữ này",
  "key_points": ["3-5 điểm quan trọng bệnh nhân cần biết"],
  "when_to_worry": ["Các dấu hiệu cảnh báo cần đi khám ngay"],
  "related_terms": ["Các thuật ngữ liên quan"]
}`;

    // Try multiple Gemini models for better rate limits
    const models = [
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-2.0-flash',
      'gemini-pro-latest'
    ];

    let lastError = null;
    let data = null;
    let quotaExhausted = false;

    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      try {
        console.log(`Trying model: ${model} (attempt ${i + 1}/${models.length})`);
        
        // Exponential backoff between retries
        if (i > 0) {
          const waitTime = Math.min(1000 * Math.pow(2, i - 1), 5000);
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048
            }
          })
        });

        if (response.ok) {
          data = await response.json();
          console.log(`✅ Success with model: ${model}`);
          break;
        } else if (response.status === 429) {
          const errorText = await response.text();
          console.log(`⏳ Model ${model} rate limited (429)`);
          
          // Check if it's quota exhaustion
          if (errorText.includes('quota') || errorText.includes('RESOURCE_EXHAUSTED')) {
            console.log('💤 Daily quota exhausted - stopping retries');
            quotaExhausted = true;
            lastError = new Error('QUOTA_EXHAUSTED');
            break;
          }
          
          lastError = new Error(`Rate limit exceeded for ${model}`);
          continue;
        } else {
          const errorText = await response.text();
          throw new Error(`Gemini API error: ${response.status} - ${errorText.substring(0, 100)}`);
        }
      } catch (error) {
        console.log(`❌ Model ${model} failed:`, error.message);
        lastError = error;
        continue;
      }
    }

    if (!data) {
      if (quotaExhausted) {
        throw new Error('QUOTA_EXHAUSTED: Daily quota limit reached. Please try again tomorrow or upgrade your plan.');
      }
      throw lastError || new Error('All Gemini models failed');
    }
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse JSON from AI response
    let aiExplanation;
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiExplanation = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.log('JSON parse failed, using raw AI response');
    }

    const explanation = {
      term: term,
      simple_explanation: aiExplanation?.simple_explanation || `AI đang phân tích: ${aiText.substring(0, 200)}...`,
      detailed_explanation: aiExplanation?.detailed_explanation || aiText,
      key_points: aiExplanation?.key_points || ['Phân tích từ AI thực tế', 'Vui lòng tham khảo bác sĩ'],
      when_to_worry: aiExplanation?.when_to_worry || ['Khi có triệu chứng bất thường'],
      related_terms: aiExplanation?.related_terms || [],
      video_suggestions: include_videos ? [{
        title: `Hiểu rõ về ${term}`,
        description: `Video giáo dục y tế về ${term}`,
        duration: '6:45',
        source: 'Bệnh viện Chợ Rẫy',
        reliability_score: 96,
        video_url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(term + ' giải thích y tế')
      }] : [],
      reliability_score: 95,
      sources: [
        { name: 'Bộ Y tế Việt Nam', url: 'https://moh.gov.vn' },
        { name: 'WHO', url: 'https://www.who.int' }
      ],
      llm_model_used: 'Gemini 2.0 Flash',
      explanation_language: language || 'vietnamese'
    };

    console.log('✅ AI medical term explanation completed successfully');

    res.json({
      success: true,
      explanation: explanation,
      message: 'Giải thích thuật ngữ y tế thành công từ AI'
    });

  } catch (error) {
    console.error('❌ AI medical term explanation error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể giải thích thuật ngữ y tế',
      details: error.message
    });
  }
}
// Serve professional dashboards
   app.use('/dashboard', express.static('public'));
// AI endpoints
app.post('/api/ai-simplify', simplifyEndpoint);
app.post('/api/ai-predict', predictEndpoint);
app.post('/api/explain-medical-term', explainMedicalTermHandler);

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🤖 AI Medical Assistant API running on port ${PORT}`);
  console.log(`📡 Endpoints available:`);
  console.log(`   POST http://localhost:${PORT}/api/ai-simplify`);
  console.log(`   POST http://192.168.1.172:${PORT}/api/ai-simplify`);
  console.log(`   POST http://localhost:${PORT}/api/ai-predict`);
  console.log(`   POST http://192.168.1.172:${PORT}/api/ai-predict`);
  console.log(`🔑 Using AI provider: ${process.env.AI_PROVIDER || 'not set'}`);
  console.log(`🌐 Server accessible from network at: http://192.168.1.172:${PORT}`);
});

module.exports = app;