// services/aiReminderAnalysis.ts
// AI-powered reminder analysis from medical records only

import { simplifyDoctorNotes, getDiseasePredict } from './aiMedicalAssistant'
import type { MedicalRecord } from '../lib/supabase'
import type { SmartReminder } from './smartReminders'

export interface AIReminderSuggestion {
  title: string
  body: string
  type: 'medication' | 'checkup' | 'lifestyle' | 'warning' | 'followup'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  schedule_time: {
    hour: number
    minute: number
    days_from_now: number
  }
  repeat_interval?: 'daily' | 'weekly' | 'monthly'
  reasoning: string
  confidence: number
}

/**
 * Analyze medical records with AI and generate smart reminders
 */
export async function analyzeRecordsForReminders(
  records: MedicalRecord[],
  userId: string
): Promise<{ success: boolean; suggestions?: AIReminderSuggestion[]; error?: string }> {
  try {
    console.log('📋 Analyzing medical records with AI for smart reminders...')
    
    const suggestions: AIReminderSuggestion[] = []
    
    for (const record of records) {
      // 1. Analyze diagnosis with AI
      const diagnosis = record.chan_doan_ra || record.chan_doan_vao
      if (diagnosis) {
        const diagnosisReminders = await analyzeWithAI(diagnosis, 'diagnosis', userId)
        suggestions.push(...diagnosisReminders)
      }
      
      // 2. Analyze treatment with AI
      const treatment = record.phuong_phap_dieu_tri
      if (treatment) {
        const treatmentReminders = await analyzeWithAI(treatment, 'treatment', userId)
        suggestions.push(...treatmentReminders)
      }
      
      // 3. Analyze doctor notes with AI
      const notes = record.ghi_chu_bac_si
      if (notes) {
        const notesReminders = await analyzeWithAI(notes, 'notes', userId)
        suggestions.push(...notesReminders)
      }
      
      // 4. Predict disease risk and create preventive reminders
      if (record.ma_benh_chinh) {
        const predictionReminders = await generatePredictiveReminders(
          record.ma_benh_chinh,
          userId
        )
        suggestions.push(...predictionReminders)
      }
    }
    
    // Remove duplicates and sort by priority
    const uniqueSuggestions = deduplicateReminders(suggestions)
    const sortedSuggestions = sortByPriority(uniqueSuggestions)
    
    console.log(`✅ Generated ${sortedSuggestions.length} AI reminder suggestions from records`)
    return { success: true, suggestions: sortedSuggestions }
  } catch (error: any) {
    console.error('Error analyzing records for reminders:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Analyze text with AI to extract reminder suggestions
 */
async function analyzeWithAI(
  text: string,
  context: 'diagnosis' | 'treatment' | 'notes',
  userId: string
): Promise<AIReminderSuggestion[]> {
  try {
    // Use AI to simplify and understand the medical text
    const result = await simplifyDoctorNotes(text, {})
    
    if (!result.success || !result.data) {
      return []
    }
    
    const simplified = result.data
    const suggestions: AIReminderSuggestion[] = []
    
    // Extract key points and generate reminders
    if (simplified.keyPoints && simplified.keyPoints.length > 0) {
      for (const point of simplified.keyPoints) {
        const reminder = extractReminderFromKeyPoint(point, context)
        if (reminder) {
          suggestions.push(reminder)
        }
      }
    }
    
    // Check for medication mentions
    if (text.toLowerCase().includes('thuốc') || text.toLowerCase().includes('uống')) {
      suggestions.push({
        title: '💊 Nhắc uống thuốc',
        body: `Nhớ uống thuốc theo chỉ định: ${simplified.simplifiedText.substring(0, 100)}...`,
        type: 'medication',
        priority: 'high',
        schedule_time: { hour: 8, minute: 0, days_from_now: 0 },
        repeat_interval: 'daily',
        reasoning: 'Phát hiện đề cập đến thuốc trong hồ sơ',
        confidence: 90
      })
    }
    
    // Check for follow-up mentions
    if (text.toLowerCase().includes('tái khám') || text.toLowerCase().includes('theo dõi')) {
      suggestions.push({
        title: '🏥 Nhắc tái khám',
        body: 'Đã đến lịch tái khám theo chỉ định của bác sĩ',
        type: 'checkup',
        priority: 'medium',
        schedule_time: { hour: 9, minute: 0, days_from_now: 14 },
        reasoning: 'Bác sĩ yêu cầu tái khám',
        confidence: 85
      })
    }
    
    return suggestions
  } catch (error) {
    console.error('Error analyzing with AI:', error)
    return []
  }
}

/**
 * Generate predictive reminders based on disease risk
 */
async function generatePredictiveReminders(
  diseaseCode: string,
  userId: string
): Promise<AIReminderSuggestion[]> {
  try {
    // Use AI to predict disease risk
    const result = await getDiseasePredict({
      userId,
      diseaseCode,
      currentSymptoms: []
    })
    
    if (!result.success || !result.data) {
      return []
    }
    
    const prediction = result.data
    const suggestions: AIReminderSuggestion[] = []
    
    // High risk - create urgent reminders
    if (prediction.riskLevel === 'high' || prediction.riskLevel === 'very_high') {
      suggestions.push({
        title: '⚠️ Cảnh báo nguy cơ cao',
        body: `Nguy cơ tái phát ${prediction.diseaseName}: ${prediction.flareUpProbability}%. Cần theo dõi chặt chẽ!`,
        type: 'warning',
        priority: 'urgent',
        schedule_time: { hour: 9, minute: 0, days_from_now: 0 },
        repeat_interval: 'weekly',
        reasoning: `AI dự đoán nguy cơ ${prediction.riskLevel}`,
        confidence: prediction.flareUpProbability
      })
    }
    
    // Add prevention reminders
    if (prediction.preventionAdvice && prediction.preventionAdvice.length > 0) {
      for (const advice of prediction.preventionAdvice.slice(0, 2)) {
        suggestions.push({
          title: `💡 ${advice.category}`,
          body: advice.recommendations[0] || 'Thực hiện lời khuyên phòng ngừa',
          type: 'lifestyle',
          priority: advice.priority === 'high' ? 'high' : 'medium',
          schedule_time: { hour: 18, minute: 0, days_from_now: 0 },
          repeat_interval: 'daily',
          reasoning: 'Lời khuyên phòng ngừa từ AI',
          confidence: 80
        })
      }
    }
    
    // Add lifestyle change reminders
    if (prediction.lifestyleChanges && prediction.lifestyleChanges.length > 0) {
      for (const change of prediction.lifestyleChanges.slice(0, 2)) {
        suggestions.push({
          title: `🏃‍♂️ ${change.change}`,
          body: change.benefit,
          type: 'lifestyle',
          priority: 'medium',
          schedule_time: { hour: 17, minute: 0, days_from_now: 0 },
          repeat_interval: 'daily',
          reasoning: 'Thay đổi lối sống được AI khuyến nghị',
          confidence: 75
        })
      }
    }
    
    return suggestions
  } catch (error) {
    console.error('Error generating predictive reminders:', error)
    return []
  }
}

/**
 * Extract reminder from key point
 */
function extractReminderFromKeyPoint(
  keyPoint: string,
  context: string
): AIReminderSuggestion | null {
  const lowerPoint = keyPoint.toLowerCase()
  
  // Check for time-sensitive keywords
  if (lowerPoint.includes('ngay') || lowerPoint.includes('khẩn cấp')) {
    return {
      title: '⚠️ Cần chú ý ngay',
      body: keyPoint,
      type: 'warning',
      priority: 'urgent',
      schedule_time: { hour: 9, minute: 0, days_from_now: 0 },
      reasoning: 'Phát hiện từ khóa khẩn cấp',
      confidence: 85
    }
  }
  
  // Check for monitoring keywords
  if (lowerPoint.includes('theo dõi') || lowerPoint.includes('kiểm tra')) {
    return {
      title: '📊 Nhắc theo dõi sức khỏe',
      body: keyPoint,
      type: 'lifestyle',
      priority: 'medium',
      schedule_time: { hour: 7, minute: 0, days_from_now: 0 },
      repeat_interval: 'daily',
      reasoning: 'Cần theo dõi định kỳ',
      confidence: 80
    }
  }
  
  // Check for lifestyle keywords
  if (lowerPoint.includes('tập') || lowerPoint.includes('ăn') || lowerPoint.includes('nghỉ')) {
    return {
      title: '💪 Lời khuyên lối sống',
      body: keyPoint,
      type: 'lifestyle',
      priority: 'low',
      schedule_time: { hour: 18, minute: 0, days_from_now: 0 },
      repeat_interval: 'daily',
      reasoning: 'Khuyến nghị về lối sống',
      confidence: 70
    }
  }
  
  return null
}

/**
 * Remove duplicate reminders
 */
function deduplicateReminders(suggestions: AIReminderSuggestion[]): AIReminderSuggestion[] {
  const seen = new Set<string>()
  const unique: AIReminderSuggestion[] = []
  
  for (const suggestion of suggestions) {
    const key = `${suggestion.type}_${suggestion.title}_${suggestion.schedule_time.hour}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(suggestion)
    }
  }
  
  return unique
}

/**
 * Sort reminders by priority
 */
function sortByPriority(suggestions: AIReminderSuggestion[]): AIReminderSuggestion[] {
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
  
  return suggestions.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    
    // If same priority, sort by confidence
    return b.confidence - a.confidence
  })
}

/**
 * Convert AI suggestions to SmartReminder format
 */
export function convertSuggestionsToReminders(
  suggestions: AIReminderSuggestion[],
  userId: string
): SmartReminder[] {
  return suggestions.map((suggestion, index) => {
    const scheduledTime = new Date()
    scheduledTime.setHours(suggestion.schedule_time.hour, suggestion.schedule_time.minute, 0, 0)
    scheduledTime.setDate(scheduledTime.getDate() + suggestion.schedule_time.days_from_now)
    
    return {
      id: `ai_reminder_${Date.now()}_${index}`,
      user_id: userId,
      title: suggestion.title,
      body: suggestion.body,
      type: suggestion.type,
      priority: suggestion.priority,
      scheduled_time: scheduledTime,
      repeat_interval: suggestion.repeat_interval,
      based_on: {
        condition: suggestion.reasoning
      },
      created_at: new Date(),
      is_active: true
    }
  })
}
