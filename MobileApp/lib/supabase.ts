import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aadydqifnwrcbjtxanje.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZHlkcWlmbndyY2JqdHhhbmplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzQ2ODksImV4cCI6MjA4MDk1MDY4OX0.KpfPaLJZto07-sXfceCXXdJVKBJZzrzq8J5X1dTPZlc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Types
export interface UserProfile {
  id: string
  so_cccd: string
  ho_ten: string
  ngay_sinh: string
  gioi_tinh: string
  dien_thoai?: string
  email?: string
  dia_chi?: string
  nhom_mau?: string
  ma_the_bhyt?: string
  ngay_cap_bhyt?: string
  ngay_het_han_bhyt?: string
  noi_dang_ky_kham_benh?: string
  role: 'patient' | 'doctor' | 'nurse' | 'hospital_admin' | 'super_admin'
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification'
  avatar_url?: string
  cccd_verified: boolean
  created_at: string
}

export interface MedicalRecord {
  id: string
  user_id: string
  ma_hsba: string
  ten_ho_so?: string // Tên/số thứ tự hồ sơ do người dùng đặt
  ngay_kham: string
  ten_benh_vien?: string
  ma_benh_vien?: string
  ten_khoa?: string
  bac_si_kham?: string
  ly_do_kham?: string
  chan_doan_vao?: string
  chan_doan_ra?: string
  ma_benh_chinh?: string
  ma_benh_phu?: string[]
  phuong_phap_dieu_tri?: string
  ket_qua_dieu_tri?: string
  so_ngay_dieu_tri?: number
  ghi_chu_bac_si?: string
  toa_thuoc?: any[]
  chi_phi?: any
  loai_kham?: 'Ngoại trú' | 'Nội trú' | 'Cấp cứu'
  trang_thai: 'active' | 'deleted'
  created_at: string
  updated_at: string
  files?: MedicalFile[]
}

export interface MedicalFile {
  id: string
  record_id: string
  user_id: string
  file_name: string
  file_path: string
  file_size?: number
  file_type: string
  description?: string
  loai_file?: 'Kết quả xét nghiệm' | 'Hình ảnh y khoa' | 'Đơn thuốc' | 'Khác'
  trang_thai: 'active' | 'deleted' | 'pending' | 'failed'
  created_at: string
  updated_at: string
  public_url?: string // Optional public URL added dynamically
}

export interface ShareToken {
  id: string
  user_id: string
  token: string
  record_ids?: string[] | null
  profile_data?: any
  medical_records?: any[]
  shared_with_name?: string
  shared_with_email?: string
  shared_with_phone?: string
  expires_at: string
  access_count: number
  max_access_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MedicationReminder {
  id: string
  user_id: string
  medication_name: string
  dosage: string
  frequency: string
  instructions?: string
  reminder_time: string
  next_reminder_at?: string
  prescription_id?: string
  doctor_name: string
  hospital?: string
  diagnosis?: string
  prescription_date?: string
  verified_by_doctor: boolean
  user_confirmed: boolean
  is_active: boolean
  start_date?: string
  end_date?: string
  total_reminders: number
  completed_count: number
  missed_count: number
  last_taken_at?: string
  created_at: string
  updated_at: string
}

export interface MedicationHistory {
  id: string
  reminder_id: string
  user_id: string
  scheduled_time: string
  actual_time?: string
  status: 'taken' | 'missed' | 'skipped' | 'pending'
  notes?: string
  side_effects?: string
  created_at: string
}