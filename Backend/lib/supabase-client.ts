// lib/supabase-client.ts

import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Safety check: ensure the Supabase service role key is NOT exposed via a
// `NEXT_PUBLIC_` environment variable which would make it available to clients.
if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
  const msg = 'Security risk: NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY is set. Remove the service role key from public env vars.'
  if (process.env.NODE_ENV === 'production') {
    throw new Error(msg)
  } else {
    // In development warn loudly but don't crash the process immediately.
    // eslint-disable-next-line no-console
    console.error(msg)
  }
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'medical-records-app'
    }
  }
})

// =============================================
// AUTH FUNCTIONS
// =============================================

export interface SignUpData {
  email: string
  password: string
  ho_ten: string
  so_cccd?: string
  ngay_sinh?: string
  gioi_tinh?: 'Nam' | 'Nữ' | 'Khác'
  dien_thoai?: string
}

/**
 * Đăng ký người dùng mới
 */
export async function signUp(data: SignUpData) {
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          ho_ten: data.ho_ten
        }
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Đăng ký thất bại')

    // 2. Create user profile
    const { error: profileError } = await supabase
      .from('users_profile')
      .insert({
        id: authData.user.id,
        ho_ten: data.ho_ten,
        so_cccd: data.so_cccd,
        ngay_sinh: data.ngay_sinh,
        gioi_tinh: data.gioi_tinh,
        dien_thoai: data.dien_thoai
      })

    if (profileError) {
      // Rollback auth user if profile creation fails
      console.error('Profile creation failed:', profileError)
      throw new Error('Không thể tạo hồ sơ người dùng')
    }

    return {
      success: true,
      user: authData.user,
      session: authData.session
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Đăng ký thất bại'
    }
  }
}

/**
 * Đăng nhập
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    return {
      success: true,
      user: data.user,
      session: data.session
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Đăng nhập thất bại'
    }
  }
}

/**
 * Đăng xuất
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Lấy user hiện tại
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    return null
  }
}

/**
 * Lấy session hiện tại
 */
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    return null
  }
}

/**
 * Đổi mật khẩu
 */
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Reset mật khẩu qua email
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

// =============================================
// DATABASE TYPES
// =============================================

export interface UserProfile {
  id: string
  ho_ten: string
  so_cccd?: string
  ngay_sinh?: string
  gioi_tinh?: 'Nam' | 'Nữ' | 'Khác'
  nhom_mau?: string
  dia_chi?: string
  dien_thoai?: string
  ma_the_bhyt?: string
  created_at: string
  updated_at: string
}

export interface MedicalRecord {
  id: string
  user_id: string
  ma_hsba: string
  ngay_kham: string
  ma_benh_vien?: string
  ten_benh_vien?: string
  ma_khoa?: string
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
  toa_thuoc?: any
  chi_phi?: any
  loai_kham?: 'Ngoại trú' | 'Nội trú' | 'Cấp cứu'
  trang_thai: 'active' | 'archived' | 'deleted'
  created_at: string
  updated_at: string
}

export interface MedicalFile {
  id: string
  record_id: string
  user_id: string
  file_name: string
  file_type: 'image' | 'pdf' | 'lab_result'
  file_path: string
  file_size?: number
  mime_type?: string
  mo_ta?: string
  created_at: string
}

export interface ShareToken {
  id: string
  user_id: string
  record_ids: string[]
  token: string
  permissions: {
    view: boolean
    download: boolean
  }
  expires_at: string
  accessed_count: number
  max_access?: number
  shared_with?: string
  notes?: string
  is_active: boolean
  created_at: string
  last_accessed_at?: string
}