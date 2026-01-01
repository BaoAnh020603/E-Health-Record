// lib/api/hospitals.ts
// Hospital & Department Management

import { supabase } from '../supabase-client'

export interface Hospital {
  id: string
  ma_cskcb: string
  ten_cskcb: string
  dia_chi?: string
  dien_thoai?: string
  email?: string
  website?: string
  hang_benh_vien?: string
  loai_hinh?: string
  tuyen_benh_vien?: string
  is_active: boolean
}

export interface Department {
  id: string
  hospital_id: string
  ma_khoa: string
  ten_khoa: string
  mo_ta?: string
  dien_thoai?: string
  is_active: boolean
}

export interface HospitalStaff {
  id: string
  user_id: string
  hospital_id: string
  department_id?: string
  ma_nhan_vien?: string
  chuc_danh?: string
  trinh_do?: string
  chuyen_khoa?: string[]
  can_prescribe: boolean
  can_diagnose: boolean
  can_admit: boolean
  is_active: boolean
}

/**
 * Get all active hospitals
 */
export async function getHospitals(filters?: {
  search?: string
  loai_hinh?: string
  tuyen?: string
  ma_tinh?: string
}) {
  try {
    let query = supabase
      .from('hospitals')
      .select('*')
      .eq('is_active', true)

    if (filters?.search) {
      query = query.or(`ten_cskcb.ilike.%${filters.search}%,ma_cskcb.ilike.%${filters.search}%`)
    }

    if (filters?.loai_hinh) {
      query = query.eq('loai_hinh', filters.loai_hinh)
    }

    if (filters?.tuyen) {
      query = query.eq('tuyen_benh_vien', filters.tuyen)
    }

    if (filters?.ma_tinh) {
      query = query.eq('ma_tinh', filters.ma_tinh)
    }

    const { data, error } = await query.order('ten_cskcb')

    if (error) throw error
    return data
  } catch (error) {
    console.error('Get hospitals error:', error)
    return []
  }
}

/**
 * Get hospital by ID
 */
export async function getHospitalById(hospitalId: string) {
  try {
    const { data, error } = await supabase
      .from('hospitals')
      .select('*')
      .eq('id', hospitalId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Get hospital error:', error)
    return null
  }
}

/**
 * Get departments by hospital
 */
export async function getDepartmentsByHospital(hospitalId: string) {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .order('ten_khoa')

    if (error) throw error
    return data
  } catch (error) {
    console.error('Get departments error:', error)
    return []
  }
}

/**
 * Get doctors by hospital/department
 */
export async function getDoctors(filters: {
  hospital_id?: string
  department_id?: string
  chuyen_khoa?: string
}) {
  try {
    let query = supabase
      .from('hospital_staff')
      .select(`
        *,
        users_profile:user_id (
          id,
          ho_ten,
          email,
          dien_thoai,
          avatar_url
        )
      `)
      .eq('is_active', true)
      .in('users_profile.role', ['doctor', 'hospital_admin'])

    if (filters.hospital_id) {
      query = query.eq('hospital_id', filters.hospital_id)
    }

    if (filters.department_id) {
      query = query.eq('department_id', filters.department_id)
    }

    if (filters.chuyen_khoa) {
      query = query.contains('chuyen_khoa', [filters.chuyen_khoa])
    }

    const { data, error } = await query

    if (error) throw error
    return data
  } catch (error) {
    console.error('Get doctors error:', error)
    return []
  }
}

// ============================================
// APPOINTMENT MANAGEMENT
// ============================================

export interface Appointment {
  id: string
  patient_id: string
  doctor_id?: string
  hospital_id: string
  department_id?: string
  ngay_hen: string
  thoi_gian_du_kien?: number
  ly_do?: string
  loai_kham?: string
  trang_thai: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  ghi_chu_benh_nhan?: string
  ghi_chu_bac_si?: string
  medical_record_id?: string
  created_at: string
}

export interface CreateAppointmentData {
  hospital_id: string
  department_id?: string
  doctor_id?: string
  ngay_hen: string // ISO datetime
  ly_do?: string
  loai_kham?: string
  ghi_chu_benh_nhan?: string
}

/**
 * Create new appointment
 */
export async function createAppointment(data: CreateAppointmentData) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Chưa đăng nhập')

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: user.id,
        ...data,
        trang_thai: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data: appointment,
      message: 'Đặt lịch hẹn thành công'
    }
  } catch (error: any) {
    console.error('Create appointment error:', error)
    return {
      success: false,
      error: error.message || 'Đặt lịch thất bại'
    }
  }
}

/**
 * Get patient's appointments
 */
export async function getMyAppointments(status?: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Chưa đăng nhập')

    let query = supabase
      .from('appointments')
      .select(`
        *,
        hospitals (ten_cskcb, dia_chi, dien_thoai),
        departments (ten_khoa),
        doctor:users_profile!doctor_id (ho_ten, dien_thoai)
      `)
      .eq('patient_id', user.id)

    if (status) {
      query = query.eq('trang_thai', status)
    }

    const { data, error } = await query.order('ngay_hen', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Get appointments error:', error)
    return []
  }
}

/**
 * Get doctor's appointments
 */
export async function getDoctorAppointments(filters?: {
  date?: string
  status?: string
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Chưa đăng nhập')

    let query = supabase
      .from('appointments')
      .select(`
        *,
        patient:users_profile!patient_id (
          ho_ten,
          ngay_sinh,
          gioi_tinh,
          dien_thoai,
          ma_the_bhyt
        ),
        hospitals (ten_cskcb),
        departments (ten_khoa)
      `)
      .eq('doctor_id', user.id)

    if (filters?.date) {
      const startOfDay = new Date(filters.date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(filters.date)
      endOfDay.setHours(23, 59, 59, 999)

      query = query
        .gte('ngay_hen', startOfDay.toISOString())
        .lte('ngay_hen', endOfDay.toISOString())
    }

    if (filters?.status) {
      query = query.eq('trang_thai', filters.status)
    }

    const { data, error } = await query.order('ngay_hen', { ascending: true })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Get doctor appointments error:', error)
    return []
  }
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show',
  notes?: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Chưa đăng nhập')

    const updates: any = {
      trang_thai: status,
      updated_at: new Date().toISOString()
    }

    if (status === 'cancelled') {
      updates.cancelled_at = new Date().toISOString()
      updates.cancelled_by = user.id
      updates.cancellation_reason = notes
    }

    if (notes) {
      // Check if user is doctor or patient
      const { data: appointment } = await supabase
        .from('appointments')
        .select('doctor_id, patient_id')
        .eq('id', appointmentId)
        .single()

      if (appointment?.doctor_id === user.id) {
        updates.ghi_chu_bac_si = notes
      } else {
        updates.ghi_chu_benh_nhan = notes
      }
    }

    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', appointmentId)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data,
      message: 'Cập nhật lịch hẹn thành công'
    }
  } catch (error: any) {
    console.error('Update appointment error:', error)
    return {
      success: false,
      error: error.message || 'Cập nhật thất bại'
    }
  }
}

/**
 * Cancel appointment (patient)
 */
export async function cancelAppointment(appointmentId: string, reason: string) {
  return updateAppointmentStatus(appointmentId, 'cancelled', reason)
}

/**
 * Complete appointment and link to medical record
 */
export async function completeAppointment(appointmentId: string, medicalRecordId: string) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({
        trang_thai: 'completed',
        medical_record_id: medicalRecordId,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data,
      message: 'Hoàn thành lịch hẹn'
    }
  } catch (error: any) {
    console.error('Complete appointment error:', error)
    return {
      success: false,
      error: error.message || 'Hoàn thành thất bại'
    }
  }
}

/**
 * Get available time slots for doctor
 */
export async function getAvailableTimeSlots(doctorId: string, date: string) {
  try {
    // Get existing appointments for that date
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('ngay_hen, thoi_gian_du_kien')
      .eq('doctor_id', doctorId)
      .gte('ngay_hen', startOfDay.toISOString())
      .lte('ngay_hen', endOfDay.toISOString())
      .in('trang_thai', ['pending', 'confirmed'])

    if (error) throw error

    // Generate time slots (8:00 - 17:00, 30-minute intervals)
    const slots = []
    const slotDate = new Date(date)
    
    for (let hour = 8; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slotDate.setHours(hour, minute, 0, 0)
        
        // Check if slot is available
        const isAvailable = !appointments?.some(apt => {
          const aptTime = new Date(apt.ngay_hen)
          const aptDuration = apt.thoi_gian_du_kien || 30
          const aptEnd = new Date(aptTime.getTime() + aptDuration * 60000)
          
          return slotDate >= aptTime && slotDate < aptEnd
        })

        slots.push({
          time: slotDate.toISOString(),
          hour,
          minute,
          available: isAvailable
        })
      }
    }

    return slots
  } catch (error) {
    console.error('Get time slots error:', error)
    return []
  }
}