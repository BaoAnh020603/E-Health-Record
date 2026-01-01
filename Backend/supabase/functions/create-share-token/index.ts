// supabase/functions/create-share-token/index.ts

/// <reference lib="deno.ns" />

import { serve } from "std/http/server.ts"
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShareTokenRequest {
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

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Get user from auth header and initialize Supabase client
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // 2. Verify user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // 3. Parse and validate request body
    const body: ShareTokenRequest = await req.json()

    if (!body.recordIds || body.recordIds.length === 0) {
      throw new Error('recordIds is required')
    }

    if (!body.expiresInHours || body.expiresInHours <= 0) {
      throw new Error('expiresInHours must be positive')
    }

    // 4. Verify user owns all records
    const { data: records, error: recordsError } = await supabaseClient
      .from('medical_records')
      .select('id')
      .in('id', body.recordIds)
      .eq('user_id', user.id)

    if (recordsError) throw recordsError

    if (!records || records.length !== body.recordIds.length) {
      throw new Error('Invalid record IDs or access denied')
    }

    // 5. Generate secure token (32 bytes = 64 hex chars)
    const tokenBytes = new Uint8Array(32)
    crypto.getRandomValues(tokenBytes)
    const token = Array.from(tokenBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // 6. Calculate expiry
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + body.expiresInHours)

    // 7. Create share token in database
    const { data: shareToken, error: tokenError } = await supabaseClient
      .from('share_tokens')
      .insert({
        user_id: user.id,
        record_ids: body.recordIds,
        token: token,
        expires_at: expiresAt.toISOString(),
        max_access: body.maxAccess || null,
        permissions: body.permissions || { view: true, download: false },
        shared_with: body.sharedWith || null,
        notes: body.notes || null,
        is_active: true
      })
      .select()
      .single()

    if (tokenError) throw tokenError

    // 8. Log activity
    await supabaseClient.from('access_logs').insert({
      user_id: user.id,
      share_token_id: shareToken.id,
      action: 'share',
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown'
    })

    // 9. Generate QR code URL
    const qrData = {
      token: token,
      type: 'medical_share',
      version: '1.0'
    }
    // Gợi ý: Có thể tạo sơ đồ luồng dữ liệu Edge Function
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify(qrData))}` 

    // 10. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          token: token,
          shareUrl: `${Deno.env.get('APP_URL')}/shared/${token}`,
          qrCodeUrl: qrCodeUrl,
          expiresAt: expiresAt.toISOString(),
          permissions: shareToken.permissions,
          maxAccess: shareToken.max_access
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})