import { supabase, MedicalRecord } from '../lib/supabase'
import { validateRecordId } from '../lib/validation'

export interface CreateRecordData {
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

/**
 * Create new medical record
 */
export async function createMedicalRecord(data: CreateRecordData) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập để thực hiện chức năng này')
    }

    if (!data.ngay_kham) {
      throw new Error('Ngày khám là bắt buộc')
    }

    const { data: record, error } = await supabase
      .from('medical_records')
      .insert({
        user_id: user.id,
        ...data
      })
      .select()
      .single()

    if (error) throw error

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

/**
 * Get list of medical records
 */
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

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập để thực hiện chức năng này')
    }

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

    // Add public URLs to files for each record
    const recordsWithUrls = (records || []).map(record => {
      if (record.files && record.files.length > 0) {
        record.files = record.files.map((file: any) => {
          const { data: urlData } = supabase.storage
            .from('medical-files')
            .getPublicUrl(file.file_path)
          
          return {
            ...file,
            public_url: urlData.publicUrl
          }
        })
      }
      return record
    })

    return {
      success: true,
      data: recordsWithUrls,
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

/**
 * Get medical record details
 */
export async function getMedicalRecord(recordId: string) {
  try {
    // Validate recordId parameter
    const validation = validateRecordId(recordId)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập để thực hiện chức năng này')
    }

    const { data: record, error } = await supabase
      .from('medical_records')
      .select('*, files:medical_files!medical_files_record_id_fkey(*)')
      .eq('id', validation.sanitized!)
      .eq('user_id', user.id)
      .single()

    if (error) throw error
    if (!record) throw new Error('Không tìm thấy hồ sơ')

    // Add public URLs to files
    if (record.files && record.files.length > 0) {
      record.files = record.files.map((file: any) => {
        console.log('Processing file:', {
          name: file.file_name,
          path: file.file_path,
          status: file.trang_thai
        })
        
        // Generate public URL for all files with valid paths
        if (file.file_path && file.file_path.trim() !== '') {
          try {
            const { data: urlData } = supabase.storage
              .from('medical-files')
              .getPublicUrl(file.file_path)
            
            console.log('Generated public URL:', urlData.publicUrl)
            
            return {
              ...file,
              public_url: urlData.publicUrl
            }
          } catch (error) {
            console.error('Error generating public URL:', error)
            return {
              ...file,
              public_url: null
            }
          }
        }
        
        // No valid file path
        return {
          ...file,
          public_url: null
        }
      })
    }

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

/**
 * Update medical record
 */
export async function updateMedicalRecord(
  recordId: string,
  updates: Partial<CreateRecordData>
) {
  try {
    // Validate recordId parameter
    const validation = validateRecordId(recordId)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập để thực hiện chức năng này')
    }

    const { data: record, error } = await supabase
      .from('medical_records')
      .update(updates)
      .eq('id', validation.sanitized!)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    if (!record) throw new Error('Không tìm thấy hồ sơ hoặc không có quyền chỉnh sửa')

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

/**
 * Delete medical record (soft delete)
 */
export async function deleteMedicalRecord(recordId: string) {
  try {
    // Validate recordId parameter
    const validation = validateRecordId(recordId)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập để thực hiện chức năng này')
    }

    const { error } = await supabase
      .from('medical_records')
      .update({ trang_thai: 'deleted' })
      .eq('id', validation.sanitized!)
      .eq('user_id', user.id)

    if (error) throw error

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

/**
 * Get medical records statistics
 */
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