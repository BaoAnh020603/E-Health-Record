// lib/api/medical-records.ts

import { supabase, type MedicalRecord } from '../supabase-client'

// =============================================
// CREATE - Tạo hồ sơ khám bệnh mới
// =============================================

export interface CreateRecordData {
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
  toa_thuoc?: {
    ten_thuoc: string
    lieu_dung: string
    so_luong: number
    cach_dung: string
  }[]
  chi_phi?: {
    tong_chi: number
    bhyt_chi_tra: number
    benh_nhan_tra: number
    chi_tiet?: any
  }
  loai_kham?: 'Ngoại trú' | 'Nội trú' | 'Cấp cứu'
}

export async function createMedicalRecord(data: CreateRecordData) {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập để thực hiện chức năng này')
    }

    // Validate required fields
    if (!data.ngay_kham) {
      throw new Error('Ngày khám là bắt buộc')
    }

    // Insert record (ma_hsba sẽ được tự động tạo bởi trigger)
    const { data: record, error } = await supabase
      .from('medical_records')
      .insert({
        user_id: user.id,
        ...data
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.from('access_logs').insert({
      user_id: user.id,
      record_id: record.id,
      action: 'create'
    })

    return {
      success: true,
      data: record
    }
  } catch (error: any) {
    console.error('Create record error:', error)
    return {
      success: false,
      error: error.message || 'Không thể tạo hồ sơ khám bệnh'
    }
  }
}

// =============================================
// READ - Lấy danh sách hồ sơ
// =============================================

export interface ListRecordsParams {
  page?: number
  limit?: number
  search?: string
  loai_kham?: string
  from_date?: string
  to_date?: string
  sort_by?: 'ngay_kham' | 'created_at'
  sort_order?: 'asc' | 'desc'
}

export async function listMedicalRecords(params: ListRecordsParams = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      loai_kham,
      from_date,
      to_date,
      sort_by = 'ngay_kham',
      sort_order = 'desc'
    } = params

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập để thực hiện chức năng này')
    }

    // Build query
    let query = supabase
      .from('medical_records')
      .select('*, files:medical_files(*)', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('trang_thai', 'active')

    // Apply filters
    if (search) {
      query = query.or(`chan_doan_vao.ilike.%${search}%,chan_doan_ra.ilike.%${search}%,ten_benh_vien.ilike.%${search}%`)
    }

    if (loai_kham) {
      query = query.eq('loai_kham', loai_kham)
    }

    if (from_date) {
      query = query.gte('ngay_kham', from_date)
    }

    if (to_date) {
      query = query.lte('ngay_kham', to_date)
    }

    // Sort and paginate
    query = query
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range((page - 1) * limit, page * limit - 1)

    const { data: records, error, count } = await query

    if (error) throw error

    return {
      success: true,
      data: records || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }
  } catch (error: any) {
    console.error('List records error:', error)
    return {
      success: false,
      error: error.message || 'Không thể tải danh sách hồ sơ',
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
    }
  }
}

// =============================================
// READ - Lấy chi tiết 1 hồ sơ
// =============================================

export async function getMedicalRecord(recordId: string) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập để thực hiện chức năng này')
    }

    const { data: record, error } = await supabase
      .from('medical_records')
      .select('*, files:medical_files(*)')
      .eq('id', recordId)
      .eq('user_id', user.id)
      .single()

    if (error) throw error
    if (!record) throw new Error('Không tìm thấy hồ sơ')

    // Log view activity
    await supabase.from('access_logs').insert({
      user_id: user.id,
      record_id: record.id,
      action: 'view'
    })

    return {
      success: true,
      data: record
    }
  } catch (error: any) {
    console.error('Get record error:', error)
    return {
      success: false,
      error: error.message || 'Không thể tải hồ sơ'
    }
  }
}

// =============================================
// UPDATE - Cập nhật hồ sơ
// =============================================

export async function updateMedicalRecord(
  recordId: string,
  updates: Partial<CreateRecordData>
) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập để thực hiện chức năng này')
    }

    // Update record
    const { data: record, error } = await supabase
      .from('medical_records')
      .update(updates)
      .eq('id', recordId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    if (!record) throw new Error('Không tìm thấy hồ sơ hoặc không có quyền chỉnh sửa')

    // Log activity
    await supabase.from('access_logs').insert({
      user_id: user.id,
      record_id: record.id,
      action: 'update'
    })

    return {
      success: true,
      data: record
    }
  } catch (error: any) {
    console.error('Update record error:', error)
    return {
      success: false,
      error: error.message || 'Không thể cập nhật hồ sơ'
    }
  }
}

// =============================================
// DELETE - Xóa hồ sơ (soft delete)
// =============================================

export async function deleteMedicalRecord(recordId: string) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập để thực hiện chức năng này')
    }

    // Soft delete
    const { error } = await supabase
      .from('medical_records')
      .update({ trang_thai: 'deleted' })
      .eq('id', recordId)
      .eq('user_id', user.id)

    if (error) throw error

    // Log activity
    await supabase.from('access_logs').insert({
      user_id: user.id,
      record_id: recordId,
      action: 'delete'
    })

    return {
      success: true
    }
  } catch (error: any) {
    console.error('Delete record error:', error)
    return {
      success: false,
      error: error.message || 'Không thể xóa hồ sơ'
    }
  }
}

// =============================================
// STATISTICS - Thống kê
// =============================================

export async function getMedicalRecordsStats() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập')
    }

    // Get total records
    const { count: totalRecords } = await supabase
      .from('medical_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('trang_thai', 'active')

    // Get records by type
    const { data: byType } = await supabase
      .from('medical_records')
      .select('loai_kham')
      .eq('user_id', user.id)
      .eq('trang_thai', 'active')

    const typeCounts = byType?.reduce((acc: any, r: { loai_kham: any }) => {
      acc[r.loai_kham || 'Khác'] = (acc[r.loai_kham || 'Khác'] || 0) + 1
      return acc
    }, {})

    // Get recent records
    const { data: recentRecords } = await supabase
      .from('medical_records')
      .select('ngay_kham, chan_doan_ra, ten_benh_vien')
      .eq('user_id', user.id)
      .eq('trang_thai', 'active')
      .order('ngay_kham', { ascending: false })
      .limit(5)

    return {
      success: true,
      data: {
        totalRecords: totalRecords || 0,
        byType: typeCounts || {},
        recentRecords: recentRecords || []
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}