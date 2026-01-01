// AI Credibility Service for Mobile App
// Provides trust indicators and credibility information for AI medical recommendations

import { API_BASE_URL } from '../config'

export interface TrustIndicator {
  type: string;
  status: 'verified' | 'pending' | 'warning';
  icon: string;
  title: string;
  description: string;
}

export interface CredibilityReport {
  prediction_id: string;
  disease_code: string;
  overall_credibility_score: number;
  credibility_level: string;
  evidence_sources: EvidenceSource[];
  clinical_validation: ClinicalValidation;
  ministry_approval: MinistryApproval;
  patient_explanation: PatientExplanation;
  trust_indicators: TrustIndicator[];
  verification_timestamp: string;
}

export interface EvidenceSource {
  source_name: string;
  source_type: string;
  credibility_score: number;
  ministry_approved: boolean;
  credibility_info: {
    name: string;
    credibility_score: number;
    ministry_recognized: boolean;
    certification: string;
  };
}

export interface ClinicalValidation {
  validated: boolean;
  validation_date?: string;
  clinical_confidence_score: number;
  evidence_level: string;
  reviewing_professional?: any;
  ministry_approved: boolean;
}

export interface MinistryApproval {
  approved: boolean;
  approval_date?: string;
  approval_number?: string;
  valid_until?: string;
  approval_scope: string;
  approving_authority: string;
  status?: string;
}

export interface PatientExplanation {
  summary: string;
  data_sources: string;
  clinical_oversight: string;
  ministry_validation: string;
  ai_transparency: string;
}

export interface AIExplanation {
  credibility_score: number;
  credibility_level: string;
  patient_explanation: PatientExplanation;
  trust_indicators: TrustIndicator[];
  evidence_count: number;
  ministry_approved: boolean;
}

export interface SystemCertifications {
  total_certifications: number;
  active_certifications: number;
  certifications: {
    [key: string]: {
      status: string;
      certification_body: string;
      certification_number: string;
      valid_until: string;
      scope: string;
    };
  };
  last_updated: string;
}

/**
 * Get credibility report for a specific AI prediction
 */
export async function getCredibilityReport(
  predictionId: string, 
  diseaseCode: string
): Promise<{ success: boolean; data?: CredibilityReport; error?: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/ai-credibility/credibility-report/${predictionId}?diseaseCode=${diseaseCode}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Không thể kết nối với hệ thống xác thực AI. Mã lỗi: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        data: result.credibility_report
      };
    } else {
      return {
        success: false,
        error: result.error || 'Không thể lấy báo cáo độ tin cậy'
      };
    }
  } catch (error: any) {
    console.error('❌ Credibility report API failed:', error.message);
    return {
      success: false,
      error: error.message || 'Không thể kết nối với hệ thống xác thực AI. Vui lòng kiểm tra kết nối và thử lại.'
    };
  }
}

/**
 * Get patient-friendly AI explanation
 */
export async function getAIExplanation(
  predictionId: string, 
  diseaseCode: string
): Promise<{ success: boolean; data?: AIExplanation; error?: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/ai-credibility/ai-explanation/${predictionId}?diseaseCode=${diseaseCode}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Không thể kết nối với hệ thống giải thích AI. Mã lỗi: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        data: result.explanation
      };
    } else {
      return {
        success: false,
        error: result.error || 'Không thể lấy giải thích AI'
      };
    }
  } catch (error: any) {
    console.error('❌ AI explanation API failed:', error.message);
    return {
      success: false,
      error: error.message || 'Không thể kết nối với hệ thống giải thích AI. Vui lòng kiểm tra kết nối và thử lại.'
    };
  }
}

/**
 * Get AI system certifications
 */
export async function getSystemCertifications(): Promise<{ success: boolean; data?: SystemCertifications; error?: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/ai-credibility/certifications`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Không thể kết nối với hệ thống chứng nhận. Mã lỗi: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        data: result.certifications
      };
    } else {
      return {
        success: false,
        error: result.error || 'Không thể lấy thông tin chứng nhận'
      };
    }
  } catch (error: any) {
    console.error('❌ Certifications error:', error);
    return {
      success: false,
      error: error.message || 'Không thể kết nối với hệ thống chứng nhận. Vui lòng kiểm tra kết nối và thử lại.'
    };
  }
}

/**
 * Submit patient trust feedback
 */
export async function submitTrustFeedback(feedback: {
  user_id: string;
  prediction_id: string;
  trust_score: number;
  credibility_helpful?: boolean;
  explanation_clear?: boolean;
  would_follow_recommendation?: boolean;
  concerns?: string;
  suggestions?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/ai-credibility/trust-feedback`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback)
      }
    );

    if (!response.ok) {
      throw new Error(`Không thể gửi phản hồi. Mã lỗi: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      success: result.success,
      error: result.error
    };
  } catch (error: any) {
    console.error('❌ Trust feedback API failed:', error.message);
    return {
      success: false,
      error: error.message || 'Không thể gửi phản hồi. Vui lòng kiểm tra kết nối và thử lại.'
    };
  }
}

// Mock data functions removed - All data must come from AI backend
// This ensures 100% real AI analysis with no hardcoded responses

// Legacy function kept for reference only - NOT USED
function createMockCredibilityReport_DEPRECATED(predictionId: string, diseaseCode: string): CredibilityReport {
  return {
    prediction_id: predictionId,
    disease_code: diseaseCode,
    overall_credibility_score: 92,
    credibility_level: 'Excellent',
    evidence_sources: [
      {
        source_name: 'World Health Organization',
        source_type: 'WHO',
        credibility_score: 100,
        ministry_approved: true,
        credibility_info: {
          name: 'World Health Organization',
          credibility_score: 100,
          ministry_recognized: true,
          certification: 'International Health Authority'
        }
      },
      {
        source_name: 'PubMed/MEDLINE Database',
        source_type: 'PUBMED',
        credibility_score: 95,
        ministry_approved: true,
        credibility_info: {
          name: 'PubMed/MEDLINE Database',
          credibility_score: 95,
          ministry_recognized: true,
          certification: 'Peer-Reviewed Medical Literature'
        }
      }
    ],
    clinical_validation: {
      validated: true,
      validation_date: new Date().toISOString(),
      clinical_confidence_score: 92,
      evidence_level: 'A',
      ministry_approved: true
    },
    ministry_approval: {
      approved: true,
      approval_date: '2024-01-15',
      approval_number: 'MOH-AI-2024-001',
      valid_until: '2025-12-31',
      approval_scope: 'Clinical Decision Support System',
      approving_authority: 'Vietnam Ministry of Health'
    },
    patient_explanation: {
      summary: 'Dự đoán AI này đạt điểm tin cậy xuất sắc dựa trên bằng chứng y khoa đã được xác minh, được xác thực lâm sàng bởi các chuyên gia y tế và được Bộ Y tế phê duyệt.',
      data_sources: 'AI của chúng tôi chỉ sử dụng dữ liệu y tế đã được xác minh từ các nguồn uy tín bao gồm WHO, PubMed và cơ sở dữ liệu Bộ Y tế Việt Nam.',
      clinical_oversight: 'Khuyến nghị này đã được xác thực lâm sàng với điểm tin cậy 92% và được xem xét bởi các chuyên gia y tế có giấy phép.',
      ministry_validation: 'Hệ thống AI của chúng tôi được Bộ Y tế Việt Nam phê duyệt như Thiết bị Y tế Phần mềm Loại IIa để hỗ trợ quyết định lâm sàng.',
      ai_transparency: 'AI của chúng tôi cung cấp lý do minh bạch cho tất cả các khuyến nghị, hiển thị bằng chứng y tế và các yếu tố được xem xét trong mỗi đánh giá.'
    },
    trust_indicators: [
      {
        type: 'ministry_approved',
        status: 'verified',
        icon: '🏛️',
        title: 'Bộ Y tế Phê duyệt',
        description: 'Được chứng nhận bởi Bộ Y tế Việt Nam như phần mềm thiết bị y tế'
      },
      {
        type: 'clinically_validated',
        status: 'verified',
        icon: '👨‍⚕️',
        title: 'Xác thực Lâm sàng',
        description: 'Được xem xét bởi các chuyên gia y tế có giấy phép với độ tin cậy 92%'
      },
      {
        type: 'evidence_based',
        status: 'verified',
        icon: '📚',
        title: 'Dựa trên Bằng chứng',
        description: 'Dựa trên tài liệu y khoa được đánh giá và hướng dẫn lâm sàng'
      },
      {
        type: 'data_secure',
        status: 'verified',
        icon: '🔒',
        title: 'Dữ liệu Bảo mật',
        description: 'Tuân thủ GDPR với bảo mật dữ liệu cấp độ chăm sóc sức khỏe'
      }
    ],
    verification_timestamp: new Date().toISOString()
  };
}

function createMockAIExplanation_DEPRECATED(diseaseCode: string): AIExplanation {
  return {
    credibility_score: 92,
    credibility_level: 'Excellent',
    patient_explanation: {
      summary: 'Dự đoán AI này đạt điểm tin cậy xuất sắc dựa trên bằng chứng y khoa chất lượng cao và được xác thực bởi các chuyên gia y tế.',
      data_sources: 'AI sử dụng dữ liệu từ WHO, PubMed và Bộ Y tế Việt Nam - tất cả đều là nguồn y tế uy tín được công nhận.',
      clinical_oversight: 'Tất cả dự đoán có rủi ro cao được xem xét bởi bác sĩ có giấy phép và chuyên gia y tế.',
      ministry_validation: 'Hệ thống được Bộ Y tế Việt Nam phê duyệt và tuân thủ các tiêu chuẩn an toàn y tế cao nhất.',
      ai_transparency: 'Chúng tôi hiển thị rõ ràng cách AI đưa ra quyết định và bạn luôn có thể yêu cầu xem xét của con người.'
    },
    trust_indicators: [
      {
        type: 'ministry_approved',
        status: 'verified',
        icon: '🏛️',
        title: 'Bộ Y tế Phê duyệt',
        description: 'Chứng nhận chính thức từ Bộ Y tế Việt Nam'
      },
      {
        type: 'clinically_validated',
        status: 'verified',
        icon: '👨‍⚕️',
        title: 'Xác thực Lâm sàng',
        description: 'Được xác thực bởi các chuyên gia y tế'
      },
      {
        type: 'evidence_based',
        status: 'verified',
        icon: '📚',
        title: 'Dựa trên Bằng chứng',
        description: 'Sử dụng nghiên cứu y khoa được đánh giá'
      },
      {
        type: 'data_secure',
        status: 'verified',
        icon: '🔒',
        title: 'Dữ liệu An toàn',
        description: 'Bảo mật cấp độ chăm sóc sức khỏe'
      }
    ],
    evidence_count: 4,
    ministry_approved: true
  };
}

function createMockCertifications_DEPRECATED(): SystemCertifications {
  return {
    total_certifications: 4,
    active_certifications: 4,
    certifications: {
      clinical_validation: {
        status: 'certified',
        certification_body: 'Vietnam Ministry of Health',
        certification_number: 'MOH-AI-2024-001',
        valid_until: '2025-12-31',
        scope: 'Clinical Decision Support System'
      },
      data_protection: {
        status: 'certified',
        certification_body: 'Vietnam Data Protection Authority',
        certification_number: 'DPA-HC-2024-001',
        valid_until: '2025-12-31',
        scope: 'Healthcare Data Processing'
      },
      medical_device: {
        status: 'approved',
        certification_body: 'Department of Medical Equipment and Construction (DMEC)',
        certification_number: 'DMEC-SoftMD-2024-001',
        valid_until: '2025-12-31',
        scope: 'Class IIa Medical Device Software'
      },
      quality_management: {
        status: 'certified',
        certification_body: 'ISO Certification Body',
        certification_number: 'ISO-13485-2024-001',
        valid_until: '2025-12-31',
        scope: 'ISO 13485:2016 Medical Device Quality Management'
      }
    },
    last_updated: new Date().toISOString()
  };
}