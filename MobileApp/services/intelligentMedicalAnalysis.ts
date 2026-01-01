import { supabase } from '../lib/supabase'
import type { MedicalRecord } from '../lib/supabase'
import { API_BASE_URL } from '../config'

export interface ComprehensiveAnalysisRequest {
  records: MedicalRecord[]
  additionalSymptoms?: string
  analysisType: 'comprehensive' | 'focused'
}

export interface ComprehensiveAnalysisResult {
  patient_summary: {
    medical_history: string[]
    current_conditions: string[]
    risk_factors: string[]
    hospital_visits: {
      hospital: string
      frequency: number
      last_visit: string
    }[]
  }
  disease_progression: {
    current_status: string
    likely_progression: string[]
    timeline_predictions: {
      timeframe: string
      probability: number
      expected_changes: string[]
    }[]
  }
  proactive_management: {
    immediate_actions: string[]
    lifestyle_modifications: string[]
    monitoring_schedule: string[]
    preventive_measures: string[]
  }
  risk_mitigation: {
    high_priority_risks: string[]
    avoidance_strategies: string[]
    early_warning_signs: string[]
    emergency_protocols: string[]
  }
  personalized_recommendations: {
    based_on_history: string[]
    hospital_specific: string[]
    condition_specific: string[]
    age_appropriate: string[]
  }
  evidence_sources: {
    primary_analysis: string
    medical_guidelines: string[]
    research_citations: string[]
    reliability_score: number
    confidence_level: string
  }
}

/**
 * Analyze patient's complete medical history using AI
 */
export async function analyzePatientHistory(request: ComprehensiveAnalysisRequest) {
  try {
    console.log('🔍 Starting comprehensive patient analysis...')

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập để sử dụng tính năng này')
    }

    // Prepare comprehensive analysis request
    const analysisRequest = {
      user_id: user.id,
      analysis_type: request.analysisType,
      medical_records: request.records.map(record => ({
        id: record.id,
        exam_date: record.ngay_kham,
        hospital: record.ten_benh_vien,
        department: record.ten_khoa,
        doctor: record.bac_si_kham,
        diagnosis_in: record.chan_doan_vao,
        diagnosis_out: record.chan_doan_ra,
        primary_disease_code: record.ma_benh_chinh,
        secondary_disease_codes: record.ma_benh_phu,
        treatment_method: record.phuong_phap_dieu_tri,
        treatment_result: record.ket_qua_dieu_tri,
        treatment_days: record.so_ngay_dieu_tri,
        doctor_notes: record.ghi_chu_bac_si,
        exam_type: record.loai_kham,
        medications: record.toa_thuoc,
        costs: record.chi_phi
      })),
      additional_symptoms: request.additionalSymptoms,
      patient_context: {
        total_records: request.records.length,
        date_range: {
          first_visit: request.records[request.records.length - 1]?.ngay_kham,
          last_visit: request.records[0]?.ngay_kham
        }
      }
    }

    console.log('📤 Sending comprehensive analysis request to backend...')

    // Call backend API - NO MOCK DATA
    const response = await fetch(`${API_BASE_URL}/api/analyze-patient-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analysisRequest),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Không thể kết nối với hệ thống phân tích AI. Vui lòng kiểm tra kết nối mạng và thử lại.')
    }

    const result = await response.json()
    console.log('✅ Backend comprehensive analysis successful')
    
    return {
      success: true,
      data: result.analysis
    }

  } catch (error: any) {
    console.error('❌ Comprehensive medical analysis error:', error)
    return {
      success: false,
      error: error.message || 'Không thể kết nối với hệ thống phân tích AI. Vui lòng kiểm tra kết nối và thử lại.'
    }
  }
}

// Mock analysis function removed - All analysis must come from AI backend
// This ensures 100% real AI analysis with no hardcoded responses

/**
 * Get analysis history for a user
 */
export async function getComprehensiveAnalysisHistory(_userId: string) {
  try {
    // This would typically fetch from a database
    // For now, return empty array as this is a new feature
    return {
      success: true,
      data: []
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}