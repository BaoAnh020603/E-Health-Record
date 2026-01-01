// lib/api/share-token.ts

import { supabase } from '../supabase-client'

// =============================================
// CREATE SHARE TOKEN
// =============================================

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

export async function createShareToken(params: CreateShareTokenParams) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập')
    }

    // Validate
    if (!params.recordIds || params.recordIds.length === 0) {
      throw new Error('Vui lòng chọn ít nhất 1 hồ sơ để chia sẻ')
    }

    if (!params.expiresInHours || params.expiresInHours <= 0) {
      throw new Error('Thời gian hết hạn không hợp lệ')
    }

    // Call Edge Function to create token
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

// =============================================
// VALIDATE SHARE TOKEN
// =============================================

export async function validateShareToken(token: string) {
  try {
    if (!token) {
      throw new Error('Token không hợp lệ')
    }

    // Call Edge Function to validate
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

// =============================================
// GET MY SHARE TOKENS
// =============================================

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

// =============================================
// REVOKE SHARE TOKEN
// =============================================

export async function revokeShareToken(tokenId: string) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập')
    }

    const { error } = await supabase
      .from('share_tokens')
      .update({ is_active: false })
      .eq('id', tokenId)
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

// =============================================
// GET SHARE TOKEN DETAILS
// =============================================

export async function getShareTokenDetails(tokenId: string) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập')
    }

    // Get token with records info
    const { data: token, error } = await supabase
      .from('share_tokens')
      .select(`
        *,
        records:medical_records!inner(id, ma_hsba, ngay_kham, chan_doan_ra)
      `)
      .eq('id', tokenId)
      .eq('user_id', user.id)
      .single()

    if (error) throw error
    if (!token) throw new Error('Không tìm thấy mã chia sẻ')

    return {
      success: true,
      data: token
    }
  } catch (error: any) {
    console.error('Get token details error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// =============================================
// GENERATE QR CODE (Client-side)
// =============================================

export function generateQRCodeUrl(token: string): string {
  const qrData = {
    token: token,
    type: 'medical_share',
    version: '1.0',
    app: 'medical-records'
  }

  const dataString = JSON.stringify(qrData)
  
  // Using QR Server API
  const size = '300x300'
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}&data=${encodeURIComponent(dataString)}`
  
  return qrCodeUrl
}

// Alternative: Generate QR using library (npm install qrcode)
export async function generateQRCodeDataURL(token: string): Promise<string> {
  try {
    // Dynamic import to avoid SSR issues
    const QRCode = await import('qrcode')
    
    const qrData = {
      token: token,
      type: 'medical_share',
      version: '1.0'
    }

    const dataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    return dataUrl
  } catch (error) {
    console.error('QR generation error:', error)
    throw new Error('Không thể tạo mã QR')
  }
}

// =============================================
// GET ACCESS LOGS
// =============================================

export async function getShareTokenAccessLogs(tokenId: string) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập')
    }

    // Verify token ownership
    const { data: token, error: tokenError } = await supabase
      .from('share_tokens')
      .select('id')
      .eq('id', tokenId)
      .eq('user_id', user.id)
      .single()

    if (tokenError || !token) {
      throw new Error('Không có quyền truy cập')
    }

    // Get logs
    const { data: logs, error } = await supabase
      .from('access_logs')
      .select('*')
      .eq('share_token_id', tokenId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return {
      success: true,
      data: logs || []
    }
  } catch (error: any) {
    console.error('Get logs error:', error)
    return {
      success: false,
      error: error.message,
      data: []
    }
  }
}

// =============================================
// HELPER: Format share link
// =============================================

export function formatShareLink(token: string, baseUrl?: string): string {
  const base = baseUrl || window.location.origin
  return `${base}/shared/${token}`
}

// =============================================
// HELPER: Check if token is expired
// =============================================

export function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date()
}

// =============================================
// HELPER: Format time remaining
// =============================================

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