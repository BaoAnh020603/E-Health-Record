import { supabase } from '../lib/supabase'
import { validateRecordId } from '../lib/validation'

export interface CreateShareTokenParams {
  recordIds: string[]
  expiresInHours: number
  sharedWith?: string
  maxAccess?: number
  permissions?: {
    view: boolean
    download: boolean
  }
  notes?: string
}

/**
 * Create share token
 */
export async function createShareToken(params: CreateShareTokenParams) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập')
    }

    if (!params.recordIds || params.recordIds.length === 0) {
      throw new Error('Vui lòng chọn ít nhất 1 hồ sơ để chia sẻ')
    }

    if (!params.expiresInHours || params.expiresInHours <= 0) {
      throw new Error('Thời gian hết hạn không hợp lệ')
    }

    const { data, error } = await supabase.functions.invoke('create-share-token', {
      body: params
    })

    if (error) throw error

    return {
      success: true,
      data: data.data
    }
  } catch (error: any) {
    console.error('Create share token error:', error)
    return {
      success: false,
      error: error.message || 'Không thể tạo mã chia sẻ'
    }
  }
}

/**
 * Validate share token
 */
export async function validateShareToken(token: string) {
  try {
    if (!token) {
      throw new Error('Token không hợp lệ')
    }

    const { data, error } = await supabase.functions.invoke('validate-share-access', {
      body: { token }
    })

    if (error) throw error

    if (!data.success) {
      throw new Error(data.error || 'Token không hợp lệ')
    }

    return {
      success: true,
      data: data.data
    }
  } catch (error: any) {
    console.error('Validate token error:', error)
    return {
      success: false,
      error: error.message || 'Không thể xác thực mã chia sẻ'
    }
  }
}

/**
 * Get my share tokens
 */
export async function getMyShareTokens() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập')
    }

    const { data: tokens, error } = await supabase
      .from('share_tokens')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      success: true,
      data: tokens || []
    }
  } catch (error: any) {
    console.error('Get tokens error:', error)
    return {
      success: false,
      error: error.message,
      data: []
    }
  }
}

/**
 * Revoke share token
 */
export async function revokeShareToken(tokenId: string) {
  try {
    // Validate tokenId parameter
    const validation = validateRecordId(tokenId)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập')
    }

    const { error } = await supabase
      .from('share_tokens')
      .update({ is_active: false })
      .eq('id', validation.sanitized!)
      .eq('user_id', user.id)

    if (error) throw error

    return {
      success: true
    }
  } catch (error: any) {
    console.error('Revoke token error:', error)
    return {
      success: false,
      error: error.message || 'Không thể thu hồi quyền chia sẻ'
    }
  }
}

/**
 * Generate QR code data
 */
export function generateQRCodeData(token: string): string {
  const qrData = {
    token: token,
    type: 'medical_share',
    version: '1.0',
    app: 'medical-records'
  }

  return JSON.stringify(qrData)
}

/**
 * Format share link
 */
export function formatShareLink(token: string, baseUrl?: string): string {
  const base = baseUrl || 'https://your-app-domain.com'
  return `${base}/shared/${token}`
}

/**
 * Check if token is expired
 */
export function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date()
}

/**
 * Format time remaining
 */
export function formatTimeRemaining(expiresAt: string): string {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diff = expiry.getTime() - now.getTime()

  if (diff <= 0) return 'Đã hết hạn'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `Còn ${days} ngày`
  }

  if (hours > 0) {
    return `Còn ${hours} giờ ${minutes} phút`
  }

  return `Còn ${minutes} phút`
}