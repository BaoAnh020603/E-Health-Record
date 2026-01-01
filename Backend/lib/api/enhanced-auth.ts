// lib/api/enhanced-auth.ts
// Enhanced Authentication with CCCD

import { supabase } from '../supabase-client'

export interface CCCDRegistrationData {
  cccd: string
  password: string
  ho_ten: string
  ngay_sinh: string // YYYY-MM-DD
  gioi_tinh: 'Nam' | 'Nữ' | 'Khác'
  dien_thoai?: string
  email?: string
  dia_chi?: string
}

export interface BHYTUpdateData {
  ma_the: string
  ngay_cap: string // YYYY-MM-DD
  ngay_het_han: string // YYYY-MM-DD
  noi_dang_ky?: string
}

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

/**
 * Register new user with CCCD
 */
export async function registerWithCCCD(data: CCCDRegistrationData) {
  try {
    // Call Supabase function to register
    const { data: result, error } = await supabase.rpc('register_user_with_cccd', {
      p_cccd: data.cccd,
      p_password: data.password,
      p_ho_ten: data.ho_ten,
      p_ngay_sinh: data.ngay_sinh,
      p_gioi_tinh: data.gioi_tinh,
      p_dien_thoai: data.dien_thoai,
      p_email: data.email,
      p_dia_chi: data.dia_chi
    })

    if (error) throw error

    if (!result.success) {
      throw new Error(result.error)
    }

    // Auto login after registration
    const loginEmail = data.email || `${data.cccd}@cccd.ehealthrecord.vn`
    const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: data.password
    })

    if (loginError) throw loginError

    return {
      success: true,
      user: authData.user,
      session: authData.session,
      message: 'Đăng ký thành công'
    }
  } catch (error: any) {
    console.error('Registration error:', error)
    return {
      success: false,
      error: error.message || 'Đăng ký thất bại'
    }
  }
}

/**
 * Login with CCCD
 */
export async function loginWithCCCD(cccd: string, password: string) {
  try {
    // Get email from CCCD
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('email, so_cccd')
      .eq('so_cccd', cccd)
      .single()

    if (profileError || !profile) {
      throw new Error('CCCD không tồn tại trong hệ thống')
    }

    const loginEmail = profile.email || `${cccd}@cccd.ehealthrecord.vn`

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: password
    })

    if (error) throw error

    return {
      success: true,
      user: data.user,
      session: data.session,
      message: 'Đăng nhập thành công'
    }
  } catch (error: any) {
    console.error('Login error:', error)
    return {
      success: false,
      error: error.message || 'Đăng nhập thất bại'
    }
  }
}

/**
 * Get current user profile
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('users_profile')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Get profile error:', error)
    return null
  }
}

/**
 * Update BHYT information
 */
export async function updateBHYT(userId: string, bhytData: BHYTUpdateData) {
  try {
    const { data, error } = await supabase.rpc('update_bhyt_info', {
      p_user_id: userId,
      p_ma_the: bhytData.ma_the,
      p_ngay_cap: bhytData.ngay_cap,
      p_ngay_het_han: bhytData.ngay_het_han,
      p_noi_dang_ky: bhytData.noi_dang_ky
    })

    if (error) throw error

    if (!data.success) {
      throw new Error(data.error)
    }

    return {
      success: true,
      message: data.message
    }
  } catch (error: any) {
    console.error('Update BHYT error:', error)
    return {
      success: false,
      error: error.message || 'Cập nhật BHYT thất bại'
    }
  }
}

/**
 * Check BHYT validity
 */
export async function checkBHYTValidity(userId: string) {
  try {
    const { data, error } = await supabase.rpc('check_bhyt_validity', {
      p_user_id: userId
    })

    if (error) throw error
    return data
  } catch (error: any) {
    console.error('Check BHYT error:', error)
    return {
      valid: false,
      error: error.message
    }
  }
}

/**
 * Upload CCCD images for verification
 */
export async function uploadCCCDImages(userId: string, frontImage: File, backImage: File) {
  try {
    // Upload front image
    const frontFileName = `${userId}/cccd_front_${Date.now()}.jpg`
    const { data: frontData, error: frontError } = await supabase.storage
      .from('medical-documents')
      .upload(frontFileName, frontImage)

    if (frontError) throw frontError

    // Upload back image
    const backFileName = `${userId}/cccd_back_${Date.now()}.jpg`
    const { data: backData, error: backError } = await supabase.storage
      .from('medical-documents')
      .upload(backFileName, backImage)

    if (backError) throw backError

    // Get public URLs
    const { data: { publicUrl: frontUrl } } = supabase.storage
      .from('medical-documents')
      .getPublicUrl(frontFileName)

    const { data: { publicUrl: backUrl } } = supabase.storage
      .from('medical-documents')
      .getPublicUrl(backFileName)

    // Verify CCCD
    const { data, error } = await supabase.rpc('verify_cccd_images', {
      p_user_id: userId,
      p_cccd_front_url: frontUrl,
      p_cccd_back_url: backUrl
    })

    if (error) throw error

    if (!data.success) {
      throw new Error(data.error)
    }

    return {
      success: true,
      message: data.message
    }
  } catch (error: any) {
    console.error('Upload CCCD error:', error)
    return {
      success: false,
      error: error.message || 'Upload CCCD thất bại'
    }
  }
}

/**
 * Get user statistics
 */
export async function getUserStatistics(userId: string) {
  try {
    const { data, error } = await supabase.rpc('get_user_statistics', {
      p_user_id: userId
    })

    if (error) throw error
    return data
  } catch (error: any) {
    console.error('Get statistics error:', error)
    return null
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  try {
    const { data, error } = await supabase
      .from('users_profile')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data,
      message: 'Cập nhật thông tin thành công'
    }
  } catch (error: any) {
    console.error('Update profile error:', error)
    return {
      success: false,
      error: error.message || 'Cập nhật thất bại'
    }
  }
}

/**
 * Get BHYT history
 */
export async function getBHYTHistory(userId: string) {
  try {
    const { data, error } = await supabase
      .from('bhyt_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Get BHYT history error:', error)
    return []
  }
}