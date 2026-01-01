// supabase/functions/validate-share-access/index.ts
/// <reference lib="deno.ns" />
import { serve } from "std/http/server.ts"
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ValidationResult {
  valid: boolean
  token_data: {
    user_id: string
    record_ids: string[]
    permissions: {
      view: boolean
      download: boolean
    }
    shared_with?: string
  } | null
  error_message: string | null
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token } = await req.json()
    
    if (!token) {
      throw new Error('Token is required')
    }

    // Create admin client for validation
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Validate token using database function
    const { data, error: validationError } = await supabaseAdmin
      .rpc('validate_share_token', { p_token: token })
      .single()

    if (validationError) throw validationError

    const validation = data as ValidationResult

    if (!validation.valid) {
      throw new Error(validation.error_message || 'Invalid token')
    }

    // Get token data
    const tokenData = validation.token_data!

    // Fetch medical records
    const { data: records, error: recordsError } = await supabaseAdmin
      .from('medical_records')
      .select(`
        *,
        files:medical_files(*)
      `)
      .in('id', tokenData.record_ids)

    if (recordsError) throw recordsError

    // Fetch user profile (masked)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users_profile')
      .select('ho_ten, ngay_sinh, gioi_tinh, nhom_mau')
      .eq('id', tokenData.user_id)
      .single()

    if (profileError) throw profileError

    // Log access
    await supabaseAdmin.from('access_logs').insert({
      user_id: tokenData.user_id,
      action: 'view_shared',
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown'
    })

    // Prepare response (remove sensitive data based on permissions)
    const responseData = {
      profile: profile,
      records: records?.map(record => ({
        ...record,
        // Remove sensitive fields if no permission
        ghi_chu_bac_si: tokenData.permissions.view ? record.ghi_chu_bac_si : '[Đã ẩn]',
        chi_phi: tokenData.permissions.view ? record.chi_phi : null
      })),
      permissions: tokenData.permissions,
      sharedWith: tokenData.shared_with
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: responseData
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