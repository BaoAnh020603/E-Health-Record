import { supabase } from '../lib/supabase'
import type { MedicalRecord } from '../lib/supabase'
import { API_BASE_URL } from '../config'

export interface MedicalAnalysisResult {
  summary: {
    condition: string
    diagnosis: string
    treatment: string
    key_findings: string[]
  }
  explanation: {
    what_it_means: string
    why_important: string
    next_steps: string[]
  }
  recommendations: {
    lifestyle: string[]
    follow_up: string[]
    warning_signs: string[]
  }
  sources: {
    primary_source: string
    references: string[]
    reliability_score: number
  }
}

/**
 * Analyze a medical record using AI with Ministry of Health approved sources
 */
export async function analyzeMedicalRecord(record: MedicalRecord) {
  try {
    console.log('🔍 Analyzing medical record:', record.id)

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập để sử dụng tính năng này')
    }

    // Prepare analysis request
    const analysisRequest = {
      record_id: record.id,
      user_id: user.id,
      medical_data: {
        diagnosis_in: record.chan_doan_vao,
        diagnosis_out: record.chan_doan_ra,
        disease_code: record.ma_benh_chinh,
        secondary_codes: record.ma_benh_phu,
        treatment_method: record.phuong_phap_dieu_tri,
        treatment_result: record.ket_qua_dieu_tri,
        doctor_notes: record.ghi_chu_bac_si,
        hospital: record.ten_benh_vien,
        department: record.ten_khoa,
        exam_date: record.ngay_kham,
        exam_type: record.loai_kham,
        medications: record.toa_thuoc,
        treatment_days: record.so_ngay_dieu_tri
      }
    }

    console.log('📤 Sending analysis request to backend...')

    // Call backend API - NO MOCK DATA
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await fetch(`${API_BASE_URL}/api/analyze-medical-record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analysisRequest),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Không thể kết nối với hệ thống phân tích AI. Vui lòng kiểm tra kết nối và thử lại.')
    }

    const result = await response.json()
    console.log('✅ Backend analysis successful')
    
    return {
      success: true,
      data: result.analysis
    }

  } catch (error: any) {
    console.error('❌ Medical record analysis error:', error)
    return {
      success: false,
      error: error.message || 'Không thể kết nối với hệ thống phân tích AI. Vui lòng kiểm tra kết nối mạng và thử lại.'
    }
  }
}

// Mock analysis functions removed - All analysis must come from AI backend
// This ensures 100% real AI analysis with no hardcoded responses

/**
 * Get analysis history for a user
 */
export async function getAnalysisHistory(userId: string) {
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