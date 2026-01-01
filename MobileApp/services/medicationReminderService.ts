import { supabase } from '../lib/supabase'
import { API_BASE_URL } from '../config'

export interface MedicationReminder {
  id: string
  user_id: string
  medication_name: string
  dosage: string
  frequency: string
  instructions?: string
  reminder_time: string // HH:mm format
  next_reminder_at?: string
  prescription_id?: string
  doctor_name: string
  hospital?: string
  diagnosis?: string
  prescription_date?: string
  verified_by_doctor: boolean
  user_confirmed: boolean
  is_active: boolean
  start_date?: string
  end_date?: string
  total_reminders: number
  completed_count: number
  missed_count: number
  last_taken_at?: string
  created_at: string
  updated_at: string
}

export interface MedicationHistory {
  id: string
  reminder_id: string
  user_id: string
  scheduled_time: string
  actual_time?: string
  status: 'taken' | 'missed' | 'skipped' | 'pending'
  notes?: string
  side_effects?: string
  created_at: string
}

export interface PrescriptionData {
  record_id: string
  bac_si_ke_don: string
  benh_vien?: string
  ngay_ke_don: string
  chan_doan?: string
  medications: Array<{
    ten_thuoc: string
    lieu_dung: string
    tan_suat: string
    cach_dung?: string
    ghi_chu?: string
    thoi_gian_uong?: string[] // Custom times if specified
  }>
  verified_by_doctor: boolean
  user_confirmed: boolean
}

/**
 * Tạo nhắc nhở từ đơn thuốc bằng AI
 * AI chỉ tạo lịch nhắc nhở, KHÔNG thay đổi chỉ định của bác sĩ
 */
export async function createRemindersFromPrescription(
  prescriptionData: PrescriptionData
): Promise<{ success: boolean; reminders?: MedicationReminder[]; error?: string }> {
  try {
    console.log('💊 Creating medication reminders from prescription')

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập để sử dụng tính năng này')
    }

    // Validate prescription data
    if (!prescriptionData.verified_by_doctor) {
      throw new Error('Đơn thuốc chưa được xác minh từ bác sĩ')
    }

    if (!prescriptionData.user_confirmed) {
      throw new Error('Bạn cần cam kết rằng đơn thuốc này là theo chỉ định của bác sĩ')
    }

    // Call backend AI service
    const response = await fetch(`${API_BASE_URL}/api/analyze-prescription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user.id,
        prescription_data: prescriptionData
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Không thể tạo nhắc nhở')
    }

    const result = await response.json()
    console.log('✅ AI generated reminders:', result.reminders.length)

    // Save reminders to database
    const remindersToSave = result.reminders.map((r: any) => ({
      user_id: user.id,
      medication_name: r.medication_name,
      dosage: r.dosage,
      frequency: r.frequency,
      instructions: r.instructions,
      reminder_time: r.time,
      prescription_id: prescriptionData.record_id,
      doctor_name: prescriptionData.bac_si_ke_don,
      hospital: prescriptionData.benh_vien,
      diagnosis: prescriptionData.chan_doan,
      prescription_date: prescriptionData.ngay_ke_don,
      verified_by_doctor: true,
      user_confirmed: true,
      is_active: true,
    }))

    const { data: savedReminders, error: saveError } = await supabase
      .from('medication_reminders')
      .insert(remindersToSave)
      .select()

    if (saveError) {
      console.error('Error saving reminders:', saveError)
      throw new Error('Không thể lưu nhắc nhở')
    }

    return {
      success: true,
      reminders: savedReminders as MedicationReminder[]
    }

  } catch (error: any) {
    console.error('❌ Create reminders error:', error)
    return {
      success: false,
      error: error.message || 'Không thể tạo nhắc nhở uống thuốc'
    }
  }
}

/**
 * Lấy danh sách nhắc nhở đang hoạt động
 */
export async function getActiveReminders(): Promise<{
  success: boolean
  reminders?: MedicationReminder[]
  error?: string
}> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập')
    }

    const { data, error } = await supabase
      .from('medication_reminders')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('reminder_time', { ascending: true })

    if (error) throw error

    return {
      success: true,
      reminders: data as MedicationReminder[]
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Đánh dấu đã uống thuốc
 */
export async function markMedicationTaken(
  reminderId: string,
  notes?: string,
  sideEffects?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập')
    }

    // Get reminder details
    const { data: reminder, error: reminderError } = await supabase
      .from('medication_reminders')
      .select('*')
      .eq('id', reminderId)
      .single()

    if (reminderError || !reminder) {
      throw new Error('Không tìm thấy nhắc nhở')
    }

    // Create history entry
    const { error: historyError } = await supabase
      .from('medication_history')
      .insert({
        reminder_id: reminderId,
        user_id: user.id,
        scheduled_time: reminder.next_reminder_at,
        actual_time: new Date().toISOString(),
        status: 'taken',
        notes,
        side_effects: sideEffects
      })

    if (historyError) throw historyError

    // Update reminder statistics
    const { error: updateError } = await supabase
      .from('medication_reminders')
      .update({
        completed_count: reminder.completed_count + 1,
        total_reminders: reminder.total_reminders + 1,
        last_taken_at: new Date().toISOString()
      })
      .eq('id', reminderId)

    if (updateError) throw updateError

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Bỏ qua lần uống thuốc
 */
export async function skipMedication(
  reminderId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập')
    }

    const { data: reminder, error: reminderError } = await supabase
      .from('medication_reminders')
      .select('*')
      .eq('id', reminderId)
      .single()

    if (reminderError || !reminder) {
      throw new Error('Không tìm thấy nhắc nhở')
    }

    // Create history entry
    const { error: historyError } = await supabase
      .from('medication_history')
      .insert({
        reminder_id: reminderId,
        user_id: user.id,
        scheduled_time: reminder.next_reminder_at,
        status: 'skipped',
        notes: reason
      })

    if (historyError) throw historyError

    // Update statistics
    const { error: updateError } = await supabase
      .from('medication_reminders')
      .update({
        missed_count: reminder.missed_count + 1,
        total_reminders: reminder.total_reminders + 1
      })
      .eq('id', reminderId)

    if (updateError) throw updateError

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Tắt/bật nhắc nhở
 */
export async function toggleReminder(
  reminderId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('medication_reminders')
      .update({ is_active: isActive })
      .eq('id', reminderId)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Xóa nhắc nhở
 */
export async function deleteReminder(
  reminderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('medication_reminders')
      .delete()
      .eq('id', reminderId)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Lấy lịch sử uống thuốc
 */
export async function getMedicationHistory(
  reminderId?: string,
  limit: number = 50
): Promise<{
  success: boolean
  history?: MedicationHistory[]
  error?: string
}> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập')
    }

    let query = supabase
      .from('medication_history')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_time', { ascending: false })
      .limit(limit)

    if (reminderId) {
      query = query.eq('reminder_id', reminderId)
    }

    const { data, error } = await query

    if (error) throw error

    return {
      success: true,
      history: data as MedicationHistory[]
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Lấy thống kê tuân thủ uống thuốc
 */
export async function getMedicationCompliance(): Promise<{
  success: boolean
  data?: {
    total_reminders: number
    completed: number
    missed: number
    compliance_rate: number
  }
  error?: string
}> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập')
    }

    const { data: reminders, error } = await supabase
      .from('medication_reminders')
      .select('completed_count, missed_count, total_reminders')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (error) throw error

    const totals = reminders.reduce(
      (acc, r) => ({
        total: acc.total + r.total_reminders,
        completed: acc.completed + r.completed_count,
        missed: acc.missed + r.missed_count
      }),
      { total: 0, completed: 0, missed: 0 }
    )

    const complianceRate = totals.total > 0 
      ? (totals.completed / totals.total) * 100 
      : 0

    return {
      success: true,
      data: {
        total_reminders: totals.total,
        completed: totals.completed,
        missed: totals.missed,
        compliance_rate: Math.round(complianceRate)
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}
