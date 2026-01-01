import { supabase } from '../lib/supabase'

export interface ShareableProfile {
  id: string
  ho_ten: string
  ngay_sinh: string
  gioi_tinh: string
  nhom_mau?: string
  ma_the_bhyt?: string
  ngay_het_han_bhyt?: string
  noi_dang_ky_kham_benh?: string
  avatar_url?: string
  // Removed sensitive fields: so_cccd, dien_thoai, email, dia_chi
  created_at: string
  updated_at: string
}

export interface ShareToken {
  id: string
  user_id: string
  token: string
  profile_data: ShareableProfile
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

/**
 * Generate a shareable QR code token for user profile and medical records
 * Only includes essential medical information for safety
 */
export async function generateShareToken(options: {
  includeRecentRecordsOnly?: boolean
  recordIds?: string[]
  maxRecords?: number
  expiresInHours?: number
  maxAccessCount?: number
  sharedWithName?: string
  sharedWithEmail?: string
  sharedWithPhone?: string
}): Promise<{ success: boolean; token?: string; qrData?: string; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Người dùng chưa đăng nhập' }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { success: false, error: 'Không tìm thấy thông tin cá nhân' }
    }

    // Get only the most recent and important medical records
    let medicalRecords = null
    if (options.includeRecentRecordsOnly || options.recordIds) {
      let query = supabase
        .from('medical_records')
        .select(`
          id,
          ma_hsba,
          ngay_kham,
          ten_benh_vien,
          ten_khoa,
          bac_si_kham,
          chan_doan_vao,
          chan_doan_ra,
          ma_benh_chinh,
          ma_benh_phu,
          phuong_phap_dieu_tri,
          ket_qua_dieu_tri,
          so_ngay_dieu_tri,
          loai_kham,
          toa_thuoc,
          created_at
        `)
        .eq('user_id', user.id)
        .eq('trang_thai', 'active')

      if (options.recordIds && options.recordIds.length > 0) {
        // Share specific records
        query = query.in('id', options.recordIds)
      } else {
        // Share recent records
        const maxRecords = options.maxRecords || 5
        query = query
          .order('ngay_kham', { ascending: false })
          .limit(maxRecords)
      }

      const { data: records, error: recordsError } = await query

      if (!recordsError && records) {
        // Only include essential medical information, exclude sensitive notes
        medicalRecords = records.map(record => ({
          id: record.id,
          ma_hsba: record.ma_hsba,
          ngay_kham: record.ngay_kham,
          ten_benh_vien: record.ten_benh_vien,
          ten_khoa: record.ten_khoa,
          bac_si_kham: record.bac_si_kham,
          chan_doan_vao: record.chan_doan_vao,
          chan_doan_ra: record.chan_doan_ra,
          ma_benh_chinh: record.ma_benh_chinh,
          ma_benh_phu: record.ma_benh_phu,
          phuong_phap_dieu_tri: record.phuong_phap_dieu_tri,
          ket_qua_dieu_tri: record.ket_qua_dieu_tri,
          so_ngay_dieu_tri: record.so_ngay_dieu_tri,
          loai_kham: record.loai_kham,
          toa_thuoc: record.toa_thuoc, // Include prescription
          created_at: record.created_at
        }))
      }
    }

    // Generate unique token
    const token = generateUniqueToken()
    
    // Calculate expiration time (default 24 hours)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + (options.expiresInHours || 24))

    // Create shareable profile data - ONLY ESSENTIAL MEDICAL INFO
    const shareableProfile: ShareableProfile = {
      id: profile.id,
      ho_ten: profile.ho_ten,
      ngay_sinh: profile.ngay_sinh,
      gioi_tinh: profile.gioi_tinh,
      nhom_mau: profile.nhom_mau, // Important for emergency
      ma_the_bhyt: profile.ma_the_bhyt ? maskBHYT(profile.ma_the_bhyt) : undefined,
      ngay_het_han_bhyt: profile.ngay_het_han_bhyt,
      noi_dang_ky_kham_benh: profile.noi_dang_ky_kham_benh,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at
      // Excluded: so_cccd, dien_thoai, email, dia_chi for privacy
    }

    // Save share token to database
    const { data: shareTokenData, error: tokenError } = await supabase
      .from('share_tokens')
      .insert({
        user_id: user.id,
        token: token,
        profile_data: shareableProfile,
        medical_records: medicalRecords,
        shared_with_name: options.sharedWithName,
        shared_with_email: options.sharedWithEmail,
        shared_with_phone: options.sharedWithPhone,
        expires_at: expiresAt.toISOString(),
        access_count: 0,
        max_access_count: options.maxAccessCount || 10,
        is_active: true
      })
      .select()
      .single()

    if (tokenError) {
      console.error('Error creating share token:', tokenError)
      return { success: false, error: 'Không thể tạo mã chia sẻ' }
    }

    // Create QR code data (URL that can be scanned)
    const qrData = `https://medical-records.app/share/${token}`

    return {
      success: true,
      token: token,
      qrData: qrData
    }

  } catch (error: any) {
    console.error('Generate share token error:', error)
    return {
      success: false,
      error: error.message || 'Có lỗi xảy ra khi tạo mã chia sẻ'
    }
  }
}

/**
 * Get shared data by token
 */
export async function getSharedData(token: string): Promise<{ success: boolean; data?: ShareToken; error?: string }> {
  try {
    const { data: shareToken, error } = await supabase
      .from('share_tokens')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .single()

    if (error || !shareToken) {
      return { success: false, error: 'Mã chia sẻ không hợp lệ hoặc đã hết hạn' }
    }

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(shareToken.expires_at)
    if (now > expiresAt) {
      return { success: false, error: 'Mã chia sẻ đã hết hạn' }
    }

    // Check access count
    if (shareToken.access_count >= shareToken.max_access_count) {
      return { success: false, error: 'Mã chia sẻ đã đạt giới hạn truy cập' }
    }

    // Increment access count
    await supabase
      .from('share_tokens')
      .update({ 
        access_count: shareToken.access_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', shareToken.id)

    return {
      success: true,
      data: shareToken
    }

  } catch (error: any) {
    console.error('Get shared data error:', error)
    return {
      success: false,
      error: error.message || 'Có lỗi xảy ra khi truy cập dữ liệu chia sẻ'
    }
  }
}

/**
 * Revoke/deactivate a share token
 */
export async function revokeShareToken(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Người dùng chưa đăng nhập' }
    }

    const { error } = await supabase
      .from('share_tokens')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('token', token)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: 'Không thể thu hồi mã chia sẻ' }
    }

    return { success: true }

  } catch (error: any) {
    console.error('Revoke share token error:', error)
    return {
      success: false,
      error: error.message || 'Có lỗi xảy ra khi thu hồi mã chia sẻ'
    }
  }
}

/**
 * Get user's active share tokens
 */
export async function getUserShareTokens(): Promise<{ success: boolean; tokens?: ShareToken[]; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Người dùng chưa đăng nhập' }
    }

    const { data: tokens, error } = await supabase
      .from('share_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: 'Không thể tải danh sách mã chia sẻ' }
    }

    return {
      success: true,
      tokens: tokens || []
    }

  } catch (error: any) {
    console.error('Get user share tokens error:', error)
    return {
      success: false,
      error: error.message || 'Có lỗi xảy ra khi tải danh sách mã chia sẻ'
    }
  }
}

// Helper functions
function generateUniqueToken(): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 15)
  return `${timestamp}-${randomStr}`
}

function maskCCCD(cccd: string): string {
  if (cccd.length < 8) return cccd
  return cccd.substring(0, 3) + '***' + cccd.substring(cccd.length - 3)
}

function maskPhone(phone: string): string {
  if (phone.length < 8) return phone
  return phone.substring(0, 3) + '***' + phone.substring(phone.length - 3)
}

function maskBHYT(bhyt: string): string {
  if (bhyt.length < 8) return bhyt
  return bhyt.substring(0, 3) + '***' + bhyt.substring(bhyt.length - 3)
}