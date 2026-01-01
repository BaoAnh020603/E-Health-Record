// services/smartReminders.ts
// Service for intelligent health reminders based on medical records and images

import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'
import type { MedicalRecord } from '../lib/supabase'

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export interface SmartReminder {
  id: string
  user_id: string
  title: string
  body: string
  type: 'medication' | 'checkup' | 'lifestyle' | 'warning' | 'followup'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  scheduled_time: Date
  repeat_interval?: 'daily' | 'weekly' | 'monthly'
  based_on: {
    record_id?: string
    condition?: string
    image_analysis?: string
  }
  created_at: Date
  is_active: boolean
}

export interface ReminderAnalysis {
  medication_reminders: SmartReminder[]
  checkup_reminders: SmartReminder[]
  lifestyle_reminders: SmartReminder[]
  warning_alerts: SmartReminder[]
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    
    if (finalStatus !== 'granted') {
      console.log('❌ Notification permission denied')
      return false
    }
    
    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('health-reminders', {
        name: 'Nhắc nhở sức khỏe',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CAF50',
      })
    }
    
    console.log('✅ Notification permission granted')
    return true
  } catch (error) {
    console.error('Error requesting notification permissions:', error)
    return false
  }
}

/**
 * Analyze medical records and generate smart reminders
 */
export async function analyzeAndCreateReminders(
  userId: string,
  records: MedicalRecord[]
): Promise<{ success: boolean; reminders?: ReminderAnalysis; error?: string }> {
  try {
    console.log('🔍 Analyzing medical records for smart reminders...')
    
    const reminders: ReminderAnalysis = {
      medication_reminders: [],
      checkup_reminders: [],
      lifestyle_reminders: [],
      warning_alerts: []
    }

    // Analyze each record
    for (const record of records) {
      // 1. Medication reminders based on treatment
      if (record.phuong_phap_dieu_tri) {
        const medReminders = generateMedicationReminders(userId, record)
        reminders.medication_reminders.push(...medReminders)
      }

      // 2. Follow-up checkup reminders
      const checkupReminders = generateCheckupReminders(userId, record)
      reminders.checkup_reminders.push(...checkupReminders)

      // 3. Lifestyle reminders based on diagnosis
      const lifestyleReminders = generateLifestyleReminders(userId, record)
      reminders.lifestyle_reminders.push(...lifestyleReminders)

      // 4. Warning alerts for high-risk conditions
      const warningAlerts = generateWarningAlerts(userId, record)
      reminders.warning_alerts.push(...warningAlerts)
    }

    // Schedule notifications
    await scheduleReminders(reminders)

    console.log('✅ Smart reminders created successfully')
    return { success: true, reminders }
  } catch (error: any) {
    console.error('Error analyzing and creating reminders:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Generate medication reminders from treatment info
 */
function generateMedicationReminders(userId: string, record: MedicalRecord): SmartReminder[] {
  const reminders: SmartReminder[] = []
  
  // Check if treatment mentions medication
  const treatment = record.phuong_phap_dieu_tri?.toLowerCase() || ''
  
  if (treatment.includes('thuốc') || treatment.includes('uống') || treatment.includes('tiêm')) {
    // Morning medication reminder
    reminders.push({
      id: `med_morning_${record.id}`,
      user_id: userId,
      title: '💊 Nhắc uống thuốc buổi sáng',
      body: `Đã đến giờ uống thuốc theo đơn của ${record.ten_benh_vien || 'bác sĩ'}`,
      type: 'medication',
      priority: 'high',
      scheduled_time: getNextScheduledTime(8, 0), // 8:00 AM
      repeat_interval: 'daily',
      based_on: {
        record_id: record.id,
        condition: record.chan_doan_ra || record.chan_doan_vao
      },
      created_at: new Date(),
      is_active: true
    })

    // Evening medication reminder
    reminders.push({
      id: `med_evening_${record.id}`,
      user_id: userId,
      title: '💊 Nhắc uống thuốc buổi tối',
      body: `Nhớ uống thuốc theo chỉ định của bác sĩ`,
      type: 'medication',
      priority: 'high',
      scheduled_time: getNextScheduledTime(20, 0), // 8:00 PM
      repeat_interval: 'daily',
      based_on: {
        record_id: record.id,
        condition: record.chan_doan_ra || record.chan_doan_vao
      },
      created_at: new Date(),
      is_active: true
    })
  }
  
  return reminders
}

/**
 * Generate checkup reminders based on diagnosis
 */
function generateCheckupReminders(userId: string, record: MedicalRecord): SmartReminder[] {
  const reminders: SmartReminder[] = []
  
  const diagnosis = (record.chan_doan_ra || record.chan_doan_vao || '').toLowerCase()
  
  // Chronic conditions need regular checkups
  const chronicConditions = ['cao huyết áp', 'đái tháo đường', 'tim mạch', 'thận', 'gan']
  const hasChronicCondition = chronicConditions.some(condition => diagnosis.includes(condition))
  
  if (hasChronicCondition) {
    // Monthly checkup reminder
    reminders.push({
      id: `checkup_monthly_${record.id}`,
      user_id: userId,
      title: '🏥 Nhắc tái khám định kỳ',
      body: `Đã đến lịch tái khám cho bệnh: ${record.chan_doan_ra || record.chan_doan_vao}`,
      type: 'checkup',
      priority: 'medium',
      scheduled_time: getNextScheduledTime(9, 0, 30), // 9:00 AM, 30 days later
      repeat_interval: 'monthly',
      based_on: {
        record_id: record.id,
        condition: record.chan_doan_ra || record.chan_doan_vao
      },
      created_at: new Date(),
      is_active: true
    })
  } else {
    // One-time follow-up reminder (2 weeks)
    reminders.push({
      id: `checkup_followup_${record.id}`,
      user_id: userId,
      title: '🏥 Nhắc tái khám',
      body: `Nên tái khám để kiểm tra tình trạng sau điều trị`,
      type: 'followup',
      priority: 'medium',
      scheduled_time: getNextScheduledTime(9, 0, 14), // 9:00 AM, 14 days later
      based_on: {
        record_id: record.id,
        condition: record.chan_doan_ra || record.chan_doan_vao
      },
      created_at: new Date(),
      is_active: true
    })
  }
  
  return reminders
}

/**
 * Generate lifestyle reminders based on diagnosis
 */
function generateLifestyleReminders(userId: string, record: MedicalRecord): SmartReminder[] {
  const reminders: SmartReminder[] = []
  
  const diagnosis = (record.chan_doan_ra || record.chan_doan_vao || '').toLowerCase()
  
  // Hypertension - blood pressure monitoring
  if (diagnosis.includes('cao huyết áp') || diagnosis.includes('huyết áp')) {
    reminders.push({
      id: `lifestyle_bp_${record.id}`,
      user_id: userId,
      title: '📊 Nhắc đo huyết áp',
      body: 'Đo huyết áp hàng ngày để theo dõi tình trạng sức khỏe',
      type: 'lifestyle',
      priority: 'medium',
      scheduled_time: getNextScheduledTime(7, 0), // 7:00 AM
      repeat_interval: 'daily',
      based_on: {
        record_id: record.id,
        condition: record.chan_doan_ra || record.chan_doan_vao
      },
      created_at: new Date(),
      is_active: true
    })
  }
  
  // Diabetes - blood sugar monitoring
  if (diagnosis.includes('đái tháo đường') || diagnosis.includes('tiểu đường')) {
    reminders.push({
      id: `lifestyle_sugar_${record.id}`,
      user_id: userId,
      title: '🩸 Nhắc đo đường huyết',
      body: 'Kiểm tra đường huyết để quản lý bệnh tiểu đường',
      type: 'lifestyle',
      priority: 'high',
      scheduled_time: getNextScheduledTime(7, 30), // 7:30 AM
      repeat_interval: 'daily',
      based_on: {
        record_id: record.id,
        condition: record.chan_doan_ra || record.chan_doan_vao
      },
      created_at: new Date(),
      is_active: true
    })
  }
  
  // General exercise reminder
  reminders.push({
    id: `lifestyle_exercise_${record.id}`,
    user_id: userId,
    title: '🏃‍♂️ Nhắc tập thể dục',
    body: 'Dành 30 phút tập thể dục nhẹ để cải thiện sức khỏe',
    type: 'lifestyle',
    priority: 'low',
    scheduled_time: getNextScheduledTime(17, 0), // 5:00 PM
    repeat_interval: 'daily',
    based_on: {
      record_id: record.id,
      condition: record.chan_doan_ra || record.chan_doan_vao
    },
    created_at: new Date(),
    is_active: true
  })
  
  return reminders
}

/**
 * Generate warning alerts for high-risk conditions
 */
function generateWarningAlerts(userId: string, record: MedicalRecord): SmartReminder[] {
  const reminders: SmartReminder[] = []
  
  const diagnosis = (record.chan_doan_ra || record.chan_doan_vao || '').toLowerCase()
  const treatment = (record.ket_qua_dieu_tri || '').toLowerCase()
  
  // Check for concerning conditions
  const highRiskConditions = ['tim mạch', 'đột quỵ', 'nhồi máu', 'ung thư', 'suy']
  const hasHighRisk = highRiskConditions.some(condition => diagnosis.includes(condition))
  
  if (hasHighRisk) {
    reminders.push({
      id: `warning_highrisk_${record.id}`,
      user_id: userId,
      title: '⚠️ Cảnh báo sức khỏe',
      body: `Bạn có tiền sử bệnh nghiêm trọng. Hãy theo dõi sát sao và tái khám đúng hẹn.`,
      type: 'warning',
      priority: 'urgent',
      scheduled_time: getNextScheduledTime(9, 0, 7), // 9:00 AM, 7 days later
      repeat_interval: 'weekly',
      based_on: {
        record_id: record.id,
        condition: record.chan_doan_ra || record.chan_doan_vao
      },
      created_at: new Date(),
      is_active: true
    })
  }
  
  // Check for incomplete treatment
  if (treatment.includes('chưa khỏi') || treatment.includes('tiếp tục')) {
    reminders.push({
      id: `warning_incomplete_${record.id}`,
      user_id: userId,
      title: '⚠️ Nhắc tiếp tục điều trị',
      body: 'Bạn cần tiếp tục điều trị. Đừng tự ý ngừng thuốc.',
      type: 'warning',
      priority: 'high',
      scheduled_time: getNextScheduledTime(10, 0, 3), // 10:00 AM, 3 days later
      repeat_interval: 'weekly',
      based_on: {
        record_id: record.id,
        condition: record.chan_doan_ra || record.chan_doan_vao
      },
      created_at: new Date(),
      is_active: true
    })
  }
  
  return reminders
}

/**
 * Schedule all reminders as notifications
 */
async function scheduleReminders(reminders: ReminderAnalysis): Promise<void> {
  try {
    // Cancel all existing notifications first
    await Notifications.cancelAllScheduledNotificationsAsync()
    
    const allReminders = [
      ...reminders.medication_reminders,
      ...reminders.checkup_reminders,
      ...reminders.lifestyle_reminders,
      ...reminders.warning_alerts
    ]
    
    for (const reminder of allReminders) {
      if (!reminder.is_active) continue
      
      let trigger: any
      
      // Calculate seconds until trigger time
      const now = Date.now()
      const scheduledTime = reminder.scheduled_time.getTime()
      const secondsUntilTrigger = Math.max(1, Math.floor((scheduledTime - now) / 1000))
      
      // Create proper trigger based on repeat interval with explicit type
      if (reminder.repeat_interval === 'daily') {
        // Daily repeating notification
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: reminder.scheduled_time.getHours(),
          minute: reminder.scheduled_time.getMinutes(),
          repeats: true
        }
      } else if (reminder.repeat_interval === 'weekly') {
        // Weekly repeating notification
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: reminder.scheduled_time.getDay() + 1, // 1-7 (Sunday = 1)
          hour: reminder.scheduled_time.getHours(),
          minute: reminder.scheduled_time.getMinutes(),
          repeats: true
        }
      } else if (reminder.repeat_interval === 'monthly') {
        // Monthly repeating notification (use calendar trigger)
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          day: reminder.scheduled_time.getDate(),
          hour: reminder.scheduled_time.getHours(),
          minute: reminder.scheduled_time.getMinutes(),
          repeats: true
        }
      } else {
        // One-time notification
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntilTrigger
        }
      }
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.body,
          sound: true,
          priority: reminder.priority === 'urgent' ? 'high' : 'default',
          data: {
            reminder_id: reminder.id,
            type: reminder.type,
            priority: reminder.priority,
            based_on: reminder.based_on,
            // Store time info in data for reliable retrieval
            scheduled_hour: reminder.scheduled_time.getHours(),
            scheduled_minute: reminder.scheduled_time.getMinutes(),
            scheduled_day: reminder.scheduled_time.getDate(),
            repeat_interval: reminder.repeat_interval
          }
        },
        trigger
      })
      
      console.log(`✅ Scheduled reminder: ${reminder.title}`)
    }
    
    console.log(`✅ Scheduled ${allReminders.length} reminders`)
  } catch (error) {
    console.error('Error scheduling reminders:', error)
    throw error
  }
}

/**
 * Get next scheduled time
 */
function getNextScheduledTime(hour: number, minute: number, daysFromNow: number = 0): Date {
  const now = new Date()
  const scheduled = new Date()
  scheduled.setHours(hour, minute, 0, 0)
  scheduled.setDate(scheduled.getDate() + daysFromNow)
  
  // If time has passed today, schedule for tomorrow
  if (daysFromNow === 0 && scheduled < now) {
    scheduled.setDate(scheduled.getDate() + 1)
  }
  
  return scheduled
}

/**
 * Get all active reminders for user
 */
export async function getUserReminders(userId: string): Promise<SmartReminder[]> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync()
    
    const reminders: SmartReminder[] = scheduled.map((notification: any) => {
      const trigger = notification.trigger
      const data = notification.content.data || {}
      
      // Debug log
      console.log('📋 Notification trigger:', JSON.stringify(trigger, null, 2))
      console.log('📦 Notification data:', JSON.stringify(data, null, 2))
      
      let scheduledTime = new Date()
      let repeatInterval: 'daily' | 'weekly' | 'monthly' | undefined = undefined
      
      // Try to get time from stored data first (most reliable)
      if (data.scheduled_hour !== undefined && data.scheduled_minute !== undefined) {
        console.log('✅ Using stored time from data:', data.scheduled_hour, ':', data.scheduled_minute)
        scheduledTime.setHours(data.scheduled_hour, data.scheduled_minute, 0, 0)
        repeatInterval = data.repeat_interval
        
        // Adjust date based on repeat interval
        if (repeatInterval === 'monthly' && data.scheduled_day) {
          scheduledTime.setDate(data.scheduled_day)
          if (scheduledTime < new Date()) {
            scheduledTime.setMonth(scheduledTime.getMonth() + 1)
          }
        } else if (scheduledTime < new Date() && repeatInterval) {
          // If time passed today and it repeats, show next occurrence
          if (repeatInterval === 'daily') {
            scheduledTime.setDate(scheduledTime.getDate() + 1)
          } else if (repeatInterval === 'weekly') {
            scheduledTime.setDate(scheduledTime.getDate() + 7)
          }
        }
      } else {
        // Fallback to parsing trigger (less reliable)
        console.log('⚠️ No stored time data, parsing trigger')
        
        if (trigger) {
          const triggerType = trigger.type || 
            (trigger.repeats && trigger.hour !== undefined ? 'daily' : 
             trigger.seconds !== undefined ? 'timeInterval' : 'unknown')
          
          console.log('🔍 Detected trigger type:', triggerType)
          
          if (triggerType === 'daily' || (trigger.repeats && trigger.hour !== undefined && !trigger.weekday && !trigger.day)) {
            const hour = trigger.hour || 0
            const minute = trigger.minute || 0
            scheduledTime.setHours(hour, minute, 0, 0)
            if (scheduledTime < new Date()) {
              scheduledTime.setDate(scheduledTime.getDate() + 1)
            }
            repeatInterval = 'daily'
          } else if (triggerType === 'weekly' || (trigger.repeats && trigger.weekday !== undefined)) {
            const hour = trigger.hour || 0
            const minute = trigger.minute || 0
            const weekday = trigger.weekday || 1
            scheduledTime.setHours(hour, minute, 0, 0)
            const currentDay = scheduledTime.getDay()
            const targetDay = weekday - 1
            let daysToAdd = (targetDay - currentDay + 7) % 7
            if (daysToAdd === 0 && scheduledTime < new Date()) {
              daysToAdd = 7
            }
            scheduledTime.setDate(scheduledTime.getDate() + daysToAdd)
            repeatInterval = 'weekly'
          } else if (triggerType === 'calendar' || (trigger.repeats && trigger.day !== undefined)) {
            const hour = trigger.hour || 0
            const minute = trigger.minute || 0
            const day = trigger.day || 1
            scheduledTime.setHours(hour, minute, 0, 0)
            scheduledTime.setDate(day)
            if (scheduledTime < new Date()) {
              scheduledTime.setMonth(scheduledTime.getMonth() + 1)
            }
            repeatInterval = 'monthly'
          } else if (triggerType === 'timeInterval' && trigger.seconds) {
            scheduledTime = new Date(Date.now() + trigger.seconds * 1000)
          } else {
            if (trigger.hour !== undefined) {
              scheduledTime.setHours(trigger.hour, trigger.minute || 0, 0, 0)
            }
            if (trigger.repeats) {
              repeatInterval = 'daily'
            }
          }
        }
      }
      
      console.log('✅ Final scheduled time:', scheduledTime.toLocaleString('vi-VN'))
      
      return {
        id: notification.identifier,
        user_id: userId,
        title: notification.content.title || '',
        body: notification.content.body || '',
        type: data.type || 'lifestyle',
        priority: data.priority || 'medium',
        scheduled_time: scheduledTime,
        repeat_interval: repeatInterval,
        based_on: data.based_on || {},
        created_at: new Date(),
        is_active: true
      }
    })
    
    return reminders
  } catch (error) {
    console.error('Error getting user reminders:', error)
    return []
  }
}

/**
 * Cancel a specific reminder
 */
export async function cancelReminder(reminderId: string): Promise<boolean> {
  try {
    await Notifications.cancelScheduledNotificationAsync(reminderId)
    console.log(`✅ Cancelled reminder: ${reminderId}`)
    return true
  } catch (error) {
    console.error('Error cancelling reminder:', error)
    return false
  }
}

/**
 * Cancel all reminders
 */
export async function cancelAllReminders(): Promise<boolean> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync()
    console.log('✅ Cancelled all reminders')
    return true
  } catch (error) {
    console.error('Error cancelling all reminders:', error)
    return false
  }
}
