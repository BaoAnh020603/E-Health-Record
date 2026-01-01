import { supabase, UserProfile } from '../lib/supabase'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession()

/**
 * Sign in with Google using optimized flow
 */
export async function signInWithGoogle() {
  try {
    // Use the app's custom scheme for faster redirect
    const redirectUrl = Linking.createURL('/')
    
    // Start OAuth session with optimized settings
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account', // Changed from 'consent' to 'select_account' for faster flow
        }
      }
    })

    if (error) {
      console.error('Supabase OAuth error:', error)
      throw error
    }

    if (data?.url) {
      // Open the OAuth URL with optimized settings for mobile
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl, {
        // Use AuthSession for better mobile OAuth experience
        showInRecents: false,
      })
      
      if (result.type === 'success' && result.url) {
        // Handle the successful OAuth result immediately
        // Extract tokens from the result URL
        const url = new URL(result.url)
        const fragment = url.hash.substring(1)
        const params = new URLSearchParams(fragment)
        
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        
        if (accessToken) {
          // Set the session immediately
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          })
          
          if (sessionError) {
            throw sessionError
          }
          
          return {
            success: true,
            message: 'Đăng nhập Google thành công!',
            session: sessionData.session
          }
        }
      } else if (result.type === 'cancel') {
        return {
          success: false,
          error: 'Đăng nhập bị hủy'
        }
      }
      
      // Fallback for other result types
      return {
        success: true,
        message: 'Đang xử lý đăng nhập Google...'
      }
    } else {
      throw new Error('Không nhận được OAuth URL từ Supabase')
    }

  } catch (error: any) {
    console.error('Google login error:', error)
    
    let errorMessage = 'Không thể đăng nhập với Google'
    
    if (error.message?.includes('Provider not found') || error.message?.includes('provider')) {
      errorMessage = 'Google OAuth chưa được bật trong Supabase.\n\nHướng dẫn:\n1. Vào Supabase Dashboard\n2. Authentication > Providers\n3. Bật Google provider'
    } else if (error.message?.includes('network')) {
      errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.'
    }
    
    return {
      success: false,
      error: errorMessage,
      details: error.message
    }
  }
}

/**
 * Sign in with phone number (OTP)
 */
export async function signInWithPhone(phone: string) {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: {
        channel: 'sms'
      }
    })

    if (error) throw error

    return {
      success: true,
      data,
      message: 'Mã OTP đã được gửi đến số điện thoại của bạn'
    }
  } catch (error: any) {
    console.error('Phone login error:', error)
    
    let errorMessage = 'Tính năng đăng nhập bằng số điện thoại chưa được cấu hình. Vui lòng liên hệ quản trị viên.'
    
    if (error.message?.includes('SMS')) {
      errorMessage = 'Dịch vụ SMS chưa được cấu hình. Vui lòng liên hệ quản trị viên.'
    } else if (error.message?.includes('phone')) {
      errorMessage = 'Số điện thoại không hợp lệ hoặc không được hỗ trợ.'
    }
    
    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Verify OTP for phone login
 */
export async function verifyOTP(phone: string, otp: string) {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: otp,
      type: 'sms'
    })

    if (error) throw error

    return {
      success: true,
      user: data.user,
      session: data.session,
      message: 'Xác thực OTP thành công'
    }
  } catch (error: any) {
    console.error('OTP verification error:', error)
    
    let errorMessage = 'Xác thực OTP thất bại'
    
    if (error.message?.includes('expired')) {
      errorMessage = 'Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.'
    } else if (error.message?.includes('invalid')) {
      errorMessage = 'Mã OTP không chính xác. Vui lòng kiểm tra lại.'
    }
    
    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Get current user profile
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return null
    }

    // Check if profile exists
    const { data: profile, error } = await supabase
      .from('users_profile')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      // Handle specific database errors
      if (error.code === 'PGRST116') {
        // No profile found - this is expected for new users
        return null
      } else if (error.message?.includes('relation "users_profile" does not exist')) {
        console.error('users_profile table does not exist - migration needed')
        throw new Error('Database table missing: users_profile. Please run migration 008_create_users_profile_table.sql')
      } else {
        console.error('Profile query error:', error)
        throw error
      }
    }

    return profile
  } catch (error) {
    console.error('Get profile error:', error)
    throw error // Re-throw to let caller handle it
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  try {
    // First, check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('id', userId)
      .single()

    let result
    
    if (existingProfile) {
      // Update existing profile
      result = await supabase
        .from('users_profile')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()
    } else {
      // Create new profile (upsert)
      result = await supabase
        .from('users_profile')
        .insert({
          id: userId,
          ...updates,
          role: 'patient',
          status: 'pending_verification',
          cccd_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
    }

    const { data, error } = result

    if (error) {
      // Handle specific database errors
      if (error.message?.includes('relation "users_profile" does not exist')) {
        throw new Error('Database table missing: users_profile. Please run migration 008_create_users_profile_table.sql in Supabase Dashboard.')
      } else if (error.message?.includes('permission denied') || error.message?.includes('RLS')) {
        throw new Error('Permission denied: Check RLS policies for users_profile table in Supabase Dashboard.')
      } else {
        throw error
      }
    }

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
 * Update BHYT information
 */
export async function updateBHYT(userId: string, bhytData: {
  ma_the: string
  ngay_cap: string
  ngay_het_han: string
  noi_dang_ky?: string
}) {
  try {
    const { data, error } = await supabase
      .from('users_profile')
      .update({
        ma_the_bhyt: bhytData.ma_the,
        ngay_cap_bhyt: bhytData.ngay_cap,
        ngay_het_han_bhyt: bhytData.ngay_het_han,
        noi_dang_ky_kham_benh: bhytData.noi_dang_ky,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data,
      message: 'Cập nhật BHYT thành công'
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
 * Sign out
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