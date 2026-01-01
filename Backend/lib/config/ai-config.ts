// lib/config/ai-config.ts
// Configuration for AI services

export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'custom' | 'mock'
  apiKey?: string
  endpoint?: string
  model?: string
  maxTokens?: number
  temperature?: number
}

// AI Configuration
export const aiConfig: AIConfig = {
  // Change this to your preferred AI provider
  provider: process.env.AI_PROVIDER as any || 'mock',
  
  // API Keys (set in environment variables)
  apiKey: process.env.AI_API_KEY,
  
  // Custom endpoint (if using custom AI service)
  endpoint: process.env.AI_ENDPOINT,
  
  // Model configuration
  model: process.env.AI_MODEL || 'gpt-4',
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000'),
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7')
}

// Prompts for AI services
export const aiPrompts = {
  simplification: {
    system: `You are a medical translator specialized in converting complex medical terminology into simple, easy-to-understand language for patients. 

Your task is to:
1. Explain medical concepts in layman's terms
2. Avoid medical jargon when possible
3. Use analogies and simple examples
4. Be empathetic and reassuring
5. Maintain accuracy while simplifying

Format your response as JSON with:
- simplifiedText: The simplified explanation
- keyPoints: Array of 3-5 key takeaways
- medicalTermsExplained: Array of {term, explanation} objects`,
    
    user: (text: string, context?: any) => `
Please simplify the following medical text for a patient to understand:

Medical Text: ${text}

${context ? `Additional Context: ${JSON.stringify(context)}` : ''}

Provide a clear, simple explanation that a patient without medical training can understand.
`
  },
  
  prediction: {
    system: `You are a medical AI assistant specialized in disease risk assessment and prevention advice.

Your task is to:
1. Analyze patient data and medical history
2. Assess risk of disease flare-ups
3. Provide evidence-based prevention advice
4. Recommend lifestyle changes
5. Identify warning signs
6. Suggest actionable next steps

Consider factors like:
- Disease characteristics and progression patterns
- Patient's medical history
- Current symptoms
- Lifestyle factors (smoking, exercise, diet)
- Age and other risk factors

Format your response as JSON with:
- flareUpProbability: Number (0-100)
- riskLevel: 'low' | 'moderate' | 'high' | 'very_high'
- contributingFactors: Array of {factor, impact, description}
- preventionAdvice: Array of {category, recommendations, priority}
- lifestyleChanges: Array of {change, benefit, difficulty}
- warningSign: Array of strings
- nextSteps: Array of strings`,
    
    user: (data: any) => `
Analyze the following patient data and provide a disease risk assessment:

Disease Code: ${data.diseaseCode}
Current Symptoms: ${data.currentSymptoms.join(', ')}
Medical History: ${JSON.stringify(data.medicalHistory || {})}
Lifestyle: ${JSON.stringify(data.lifestyle || {})}
Historical Records: ${data.historicalRecords?.length || 0} previous records

Provide a comprehensive risk assessment and prevention plan for the next 2-3 years.
`
  }
}

// Validation functions
export function validateAIConfig(): boolean {
  if (aiConfig.provider === 'mock') {
    console.warn('⚠️  Using mock AI responses. Configure a real AI provider for production.')
    return true
  }
  
  if (!aiConfig.apiKey && aiConfig.provider !== 'custom') {
    console.error('❌ AI API key is required. Set AI_API_KEY environment variable.')
    return false
  }
  
  if (aiConfig.provider === 'custom' && !aiConfig.endpoint) {
    console.error('❌ Custom AI endpoint is required. Set AI_ENDPOINT environment variable.')
    return false
  }
  
  console.log(`✅ AI configured with provider: ${aiConfig.provider}`)
  return true
}

// Helper to get AI service status
export function getAIServiceStatus() {
  return {
    provider: aiConfig.provider,
    configured: validateAIConfig(),
    model: aiConfig.model,
    endpoint: aiConfig.endpoint ? '***configured***' : 'not set',
    apiKey: aiConfig.apiKey ? '***configured***' : 'not set'
  }
}
