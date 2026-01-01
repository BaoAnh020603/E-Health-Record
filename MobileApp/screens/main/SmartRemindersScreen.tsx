import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Platform
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import * as Notifications from 'expo-notifications'
import { supabase } from '../../lib/supabase'
import { API_BASE_URL } from '../../config'
import { getCurrentUserProfile } from '../../services/auth'
import { listMedicalRecords } from '../../services/medicalRecords'
import { 
  createRemindersFromPrescription,
  getActiveReminders,
  deleteReminder as deleteMedicationReminder,
  toggleReminder,
  type MedicationReminder
} from '../../services/medicationReminderService'
import {
  requestNotificationPermissions,
  getUserReminders,
  cancelReminder,
  cancelAllReminders,
  type SmartReminder
} from '../../services/smartReminders'

export default function SmartRemindersScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [reminders, setReminders] = useState<SmartReminder[]>([])
  const [medicationReminders, setMedicationReminders] = useState<MedicationReminder[]>([])
  const [hasPermission, setHasPermission] = useState(false)
  const [userId, setUserId] = useState('')
  
  // Custom reminder modal
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customTitle, setCustomTitle] = useState('')
  const [customBody, setCustomBody] = useState('')
  const [customTime, setCustomTime] = useState(new Date())
  const [customRepeat, setCustomRepeat] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none')
  const [showTimePicker, setShowTimePicker] = useState(false)
  
  // Suggested reminders from medical records
  const [suggestedReminders, setSuggestedReminders] = useState<SmartReminder[]>([])
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false)
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set())
  
  // Record selection for creating reminders
  const [showRecordSelector, setShowRecordSelector] = useState(false)
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set())
  const [allRecords, setAllRecords] = useState<any[]>([])
  
  // Analysis type selection
  const [showAnalysisTypeModal, setShowAnalysisTypeModal] = useState(false)
  const [analysisType, setAnalysisType] = useState<'basic' | 'advanced'>('basic')
  
  // Preview and edit reminders before saving
  const [showReminderPreview, setShowReminderPreview] = useState(false)
  const [previewReminders, setPreviewReminders] = useState<any[]>([])
  
  // Edit reminder modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingReminder, setEditingReminder] = useState<any>(null)
  const [editDateTime, setEditDateTime] = useState(new Date())
  const [editRepeat, setEditRepeat] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('daily')
  const [showEditDatePicker, setShowEditDatePicker] = useState(false)
  const [showEditTimePicker, setShowEditTimePicker] = useState(false)

  useEffect(() => {
    loadUserData()
    checkPermissions()
  }, [])

  const loadUserData = async () => {
    try {
      const profile = await getCurrentUserProfile()
      if (profile?.id) {
        setUserId(profile.id)
        await loadReminders(profile.id)
        await loadMedicalRecords()
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const loadMedicalRecords = async () => {
    try {
      const recordsResult = await listMedicalRecords({})
      if (recordsResult.success && recordsResult.data) {
        setAllRecords(recordsResult.data)
      }
    } catch (error) {
      console.error('Error loading medical records:', error)
    }
  }

  const checkPermissions = async () => {
    const granted = await requestNotificationPermissions()
    setHasPermission(granted)
  }

  const loadReminders = async (uid: string) => {
    try {
      // Load old-style reminders from Expo Notifications
      const userReminders = await getUserReminders(uid)
      setReminders(userReminders)
      
      // Load medication reminders from database
      const medResult = await getActiveReminders()
      if (medResult.success && medResult.reminders) {
        console.log('✅ Loaded medication reminders:', medResult.reminders.length)
        setMedicationReminders(medResult.reminders)
      }
    } catch (error) {
      console.error('Error loading reminders:', error)
    }
  }

  const handleCreateReminders = async () => {
    if (!hasPermission) {
      Alert.alert('Cần quyền thông báo', 'Vui lòng cấp quyền thông báo')
      return
    }

    // If no records available
    if (allRecords.length === 0) {
      Alert.alert('Thông báo', 'Bạn cần có ít nhất một hồ sơ y tế để tạo nhắc nhở')
      return
    }

    // Show analysis type selection first
    if (!showRecordSelector && selectedRecordIds.size === 0) {
      setShowAnalysisTypeModal(true)
      return
    }

    // If no records selected, show selector
    if (selectedRecordIds.size === 0) {
      setShowRecordSelector(true)
      return
    }

    setLoading(true)
    try {
      // Get selected records
      const selectedRecords = allRecords.filter(r => selectedRecordIds.has(r.id))
      
      // Tạo danh sách reminders để preview (chưa lưu vào database)
      const remindersToPreview: any[] = []
      
      if (analysisType === 'basic') {
        // BASIC: Chỉ lấy đơn thuốc đơn giản
        console.log('📋 Basic analysis: Only prescription data')
        
        for (const record of selectedRecords) {
          if (record.toa_thuoc && record.toa_thuoc.length > 0) {
            for (const med of record.toa_thuoc) {
              // Parse frequency to get suggested times
              const times = parseFrequencyToTimes(med.tan_suat || '')
              
              for (const time of times) {
                remindersToPreview.push({
                  id: `preview_${record.id}_${med.ten_thuoc}_${time}`.replace(/\s/g, '_'),
                  record_id: record.id,
                  medication_name: med.ten_thuoc,
                  dosage: med.lieu_dung,
                  frequency: med.tan_suat || 'Theo chỉ định bác sĩ',
                  instructions: med.cach_dung || 'Theo chỉ định bác sĩ',
                  reminder_time: time,
                  repeat_interval: 'daily',
                  doctor_name: record.bac_si_kham || 'Bác sĩ',
                  hospital: record.ten_benh_vien,
                  diagnosis: record.chan_doan_ra || record.chan_doan_vao,
                  prescription_date: record.ngay_kham,
                  notes: med.ghi_chu,
                  analysis_type: 'basic'
                })
              }
            }
          }
        }
      } else {
        // ADVANCED: Phân tích AI chuyên sâu
        console.log('🧠 Advanced analysis: AI analyzing full medical records')
        
        Alert.alert(
          '🧠 Phân tích chuyên sâu',
          'AI đang phân tích toàn bộ bệnh án, lời nhắc bác sĩ và đề xuất lịch uống thuốc tối ưu.\n\nQuá trình này có thể mất 30-60 giây.',
          [{ text: 'OK' }]
        )
        
        // Call AI analysis API for each record
        for (const record of selectedRecords) {
          try {
            const analysisResult = await analyzeRecordWithAI(record)
            
            if (analysisResult.success && analysisResult.reminders) {
              for (const aiReminder of analysisResult.reminders) {
                remindersToPreview.push({
                  id: `preview_ai_${record.id}_${aiReminder.medication_name}_${aiReminder.time}`.replace(/\s/g, '_'),
                  record_id: record.id,
                  medication_name: aiReminder.medication_name,
                  dosage: aiReminder.dosage,
                  frequency: aiReminder.frequency,
                  instructions: aiReminder.instructions,
                  reminder_time: aiReminder.time,
                  repeat_interval: 'daily',
                  doctor_name: record.bac_si_kham || 'Bác sĩ',
                  hospital: record.ten_benh_vien,
                  diagnosis: record.chan_doan_ra || record.chan_doan_vao,
                  prescription_date: record.ngay_kham,
                  notes: aiReminder.ai_notes,
                  analysis_type: 'advanced',
                  ai_recommendations: aiReminder.recommendations
                })
              }
            } else {
              // AI failed, fallback to basic
              console.warn('⚠️ AI analysis failed, using basic analysis for record:', record.id)
              
              if (record.toa_thuoc && record.toa_thuoc.length > 0) {
                for (const med of record.toa_thuoc) {
                  const times = parseFrequencyToTimes(med.tan_suat || '')
                  
                  for (const time of times) {
                    remindersToPreview.push({
                      id: `preview_${record.id}_${med.ten_thuoc}_${time}`.replace(/\s/g, '_'),
                      record_id: record.id,
                      medication_name: med.ten_thuoc,
                      dosage: med.lieu_dung,
                      frequency: med.tan_suat || 'Theo chỉ định bác sĩ',
                      instructions: med.cach_dung || 'Theo chỉ định bác sĩ',
                      reminder_time: time,
                      repeat_interval: 'daily',
                      doctor_name: record.bac_si_kham || 'Bác sĩ',
                      hospital: record.ten_benh_vien,
                      diagnosis: record.chan_doan_ra || record.chan_doan_vao,
                      prescription_date: record.ngay_kham,
                      notes: med.ghi_chu,
                      analysis_type: 'basic'
                    })
                  }
                }
              }
            }
          } catch (error) {
            console.error('❌ Error processing record:', record.id, error)
          }
        }
        
        // Show warning if AI failed for all records
        if (remindersToPreview.length === 0 || !remindersToPreview.some(r => r.analysis_type === 'advanced')) {
          Alert.alert(
            'Thông báo',
            'Không thể phân tích AI. Đã chuyển sang phân tích cơ bản cho tất cả hồ sơ.',
            [{ text: 'OK' }]
          )
        }
      }
      
      if (remindersToPreview.length > 0) {
        setPreviewReminders(remindersToPreview)
        setShowRecordSelector(false)
        setShowReminderPreview(true)
      } else {
        Alert.alert('Thông báo', 'Không tìm thấy đơn thuốc trong các hồ sơ đã chọn')
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message)
    } finally {
      setLoading(false)
    }
  }

  // Parse frequency to suggested times
  const parseFrequencyToTimes = (frequency: string): string[] => {
    const freq = frequency.toLowerCase()
    
    if (freq.includes('1 lần') || freq.includes('một lần')) {
      return ['08:00']
    } else if (freq.includes('2 lần') || freq.includes('hai lần')) {
      return ['08:00', '20:00']
    } else if (freq.includes('3 lần') || freq.includes('ba lần')) {
      return ['08:00', '13:00', '20:00']
    } else if (freq.includes('4 lần') || freq.includes('bốn lần')) {
      return ['08:00', '12:00', '16:00', '20:00']
    }
    
    return ['08:00', '20:00'] // Default
  }

  // Analyze medical record with AI (advanced analysis)
  const analyzeRecordWithAI = async (record: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Chưa đăng nhập')

      console.log('🧠 Calling AI analysis for record:', record.id)

      const response = await fetch(`${API_BASE_URL}/api/analyze-medical-record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          record: {
            id: record.id,
            ten_benh_vien: record.ten_benh_vien,
            bac_si_kham: record.bac_si_kham,
            ngay_kham: record.ngay_kham,
            chan_doan_vao: record.chan_doan_vao,
            chan_doan_ra: record.chan_doan_ra,
            phuong_phap_dieu_tri: record.phuong_phap_dieu_tri,
            ket_qua_dieu_tri: record.ket_qua_dieu_tri,
            loi_dan_bac_si: record.loi_dan_bac_si,
            toa_thuoc: record.toa_thuoc,
            ghi_chu: record.ghi_chu
          },
          analysis_type: 'advanced'
        }),
      })

      const result = await response.json()
      
      if (!response.ok || !result.success) {
        console.error('❌ AI analysis API error:', result.error)
        throw new Error(result.error || 'AI analysis failed')
      }

      console.log('✅ AI analysis successful:', result.reminders?.length, 'reminders')
      return result

    } catch (error: any) {
      console.error('❌ AI analysis error:', error.message)
      return { success: false, error: error.message }
    }
  }

  // Save reminders after user confirmation
  const handleSaveReminders = async () => {
    setLoading(true)
    try {
      let totalSaved = 0
      
      // Group by record_id to call API once per record
      const remindersByRecord: { [key: string]: any[] } = {}
      
      for (const reminder of previewReminders) {
        if (!remindersByRecord[reminder.record_id]) {
          remindersByRecord[reminder.record_id] = []
        }
        remindersByRecord[reminder.record_id].push(reminder)
      }
      
      // Save each record's reminders
      for (const [recordId, reminders] of Object.entries(remindersByRecord)) {
        const record = allRecords.find(r => r.id === recordId)
        if (!record) continue
        
        // Group reminders by medication
        const medicationMap: { [key: string]: any } = {}
        
        for (const reminder of reminders) {
          if (!medicationMap[reminder.medication_name]) {
            medicationMap[reminder.medication_name] = {
              ten_thuoc: reminder.medication_name,
              lieu_dung: reminder.dosage,
              tan_suat: reminder.frequency || 'Theo chỉ định bác sĩ',
              cach_dung: reminder.instructions || 'Theo chỉ định bác sĩ',
              ghi_chu: reminder.notes,
              thoi_gian_uong: []
            }
          }
          medicationMap[reminder.medication_name].thoi_gian_uong.push(reminder.reminder_time)
        }
        
        const prescriptionData = {
          record_id: recordId,
          bac_si_ke_don: reminders[0].doctor_name,
          benh_vien: reminders[0].hospital,
          ngay_ke_don: reminders[0].prescription_date,
          chan_doan: reminders[0].diagnosis,
          medications: Object.values(medicationMap),
          verified_by_doctor: true,
          user_confirmed: true
        }
        
        const result = await createRemindersFromPrescription(prescriptionData)
        if (result.success) {
          totalSaved += result.reminders?.length || 0
        }
      }
      
      if (totalSaved > 0) {
        Alert.alert(
          '✅ Thành công',
          `Đã lưu ${totalSaved} nhắc nhở uống thuốc\n\n` +
          `⚠️ LƯU Ý QUAN TRỌNG:\n` +
          `• AI chỉ tạo nhắc nhở, KHÔNG thay thế chỉ định bác sĩ\n` +
          `• Tuân thủ đúng liều lượng và cách dùng theo đơn\n` +
          `• Không tự ý thay đổi hoặc ngừng thuốc\n` +
          `• Liên hệ bác sĩ nếu có bất thường`,
          [
            {
              text: 'Đã hiểu',
              onPress: () => {
                setPreviewReminders([])
                setShowReminderPreview(false)
                setSelectedRecordIds(new Set())
                if (userId) loadReminders(userId)
              }
            }
          ]
        )
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message)
    } finally {
      setLoading(false)
    }
  }

  // Edit a reminder time - Open edit modal
  const handleEditReminderTime = (reminder: any) => {
    // Prevent multiple calls
    if (showEditModal) {
      console.log('⚠️ Modal already open, ignoring')
      return
    }
    
    console.log('📝 Editing reminder:', reminder.medication_name)
    
    // Parse current time
    const [hours, minutes] = reminder.reminder_time.split(':').map(Number)
    const dateTime = new Date()
    dateTime.setHours(hours, minutes, 0, 0)
    
    setEditingReminder(reminder)
    setEditDateTime(dateTime)
    setEditRepeat(reminder.repeat_interval || 'daily')
    
    // Close preview modal first, then open edit modal
    setShowReminderPreview(false)
    setTimeout(() => {
      setShowEditModal(true)
      console.log('✅ Edit modal opened')
    }, 300)
  }

  // Save edited reminder
  const handleSaveEditedReminder = () => {
    if (!editingReminder) return
    
    const timeStr = editDateTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
    
    console.log('✅ Updating reminder:', editingReminder.medication_name, 'to', timeStr, editRepeat)
    
    setPreviewReminders(prev => 
      prev.map(r => 
        r.id === editingReminder.id 
          ? { 
              ...r, 
              reminder_time: timeStr,
              repeat_interval: editRepeat,
              scheduled_date: editDateTime.toISOString()
            }
          : r
      )
    )
    
    setShowEditModal(false)
    setEditingReminder(null)
    
    // Reopen preview modal after a short delay
    setTimeout(() => {
      setShowReminderPreview(true)
    }, 300)
  }

  const onEditDateChange = (_: any, selectedDate?: Date) => {
    setShowEditDatePicker(Platform.OS === 'ios')
    if (selectedDate) {
      setEditDateTime(selectedDate)
    }
  }

  const onEditTimeChange = (_: any, selectedTime?: Date) => {
    setShowEditTimePicker(Platform.OS === 'ios')
    if (selectedTime) {
      setEditDateTime(selectedTime)
    }
  }

  // Delete a reminder from preview
  const handleDeletePreviewReminder = (reminderId: string) => {
    setPreviewReminders(prev => prev.filter(r => r.id !== reminderId))
  }

  const toggleRecordSelection = (recordId: string) => {
    const newSelected = new Set(selectedRecordIds)
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId)
    } else {
      newSelected.add(recordId)
    }
    setSelectedRecordIds(newSelected)
  }

  const selectAllRecords = () => {
    setSelectedRecordIds(new Set(allRecords.map(r => r.id)))
  }

  const clearRecordSelection = () => {
    setSelectedRecordIds(new Set())
  }

  const handleConfirmRecordSelection = () => {
    if (selectedRecordIds.size === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một hồ sơ')
      return
    }
    
    // If user selected ADVANCED analysis, ask for confirmation
    if (analysisType === 'advanced') {
      Alert.alert(
        '🧠 Xác nhận Phân tích Chuyên sâu',
        'Bạn có muốn phân tích chuyên sâu bằng AI không?\n\n' +
        '✅ CÓ: AI sẽ phân tích toàn bộ bệnh án, lời dặn bác sĩ và tạo nhắc nhở thông minh (mất 30-60 giây)\n\n' +
        '❌ KHÔNG: Chỉ lấy đơn thuốc cơ bản để tạo nhắc nhở (nhanh hơn)',
        [
          {
            text: '❌ Không, chỉ lấy đơn thuốc',
            style: 'cancel',
            onPress: () => {
              // Switch to basic and show doctor confirmation
              console.log('User chose basic analysis instead of advanced')
              showDoctorConfirmationForBasic()
            }
          },
          {
            text: '✅ Có, phân tích chuyên sâu',
            style: 'default',
            onPress: () => {
              // Proceed with advanced analysis
              showDoctorConfirmation()
            }
          }
        ],
        { cancelable: false }
      )
    } else {
      // Basic analysis - just show doctor confirmation
      showDoctorConfirmation()
    }
  }

  const showDoctorConfirmation = () => {
    Alert.alert(
      '⚠️ Xác nhận đơn thuốc từ bác sĩ',
      'Bạn cam kết rằng:\n\n' +
      '✓ Đơn thuốc này được kê bởi bác sĩ có chuyên môn\n' +
      '✓ Thông tin thuốc đã nhập chính xác theo đơn\n' +
      '✓ AI chỉ tạo nhắc nhở, KHÔNG thay thế ý kiến bác sĩ\n\n' +
      '⚠️ Không tự ý thay đổi liều lượng hoặc ngừng thuốc',
      [
        {
          text: 'Hủy',
          style: 'cancel',
          onPress: () => {
            // Don't close the selector, let user reselect
          }
        },
        {
          text: 'Tôi cam kết',
          style: 'default',
          onPress: () => {
            setShowRecordSelector(false)
            handleCreateReminders()
          }
        }
      ],
      { cancelable: false }
    )
  }

  const showDoctorConfirmationForBasic = () => {
    Alert.alert(
      '⚠️ Xác nhận đơn thuốc từ bác sĩ',
      'Bạn cam kết rằng:\n\n' +
      '✓ Đơn thuốc này được kê bởi bác sĩ có chuyên môn\n' +
      '✓ Thông tin thuốc đã nhập chính xác theo đơn\n' +
      '✓ AI chỉ tạo nhắc nhở, KHÔNG thay thế ý kiến bác sĩ\n\n' +
      '⚠️ Không tự ý thay đổi liều lượng hoặc ngừng thuốc',
      [
        {
          text: 'Hủy',
          style: 'cancel',
          onPress: () => {
            // User cancelled, do nothing
          }
        },
        {
          text: 'Tôi cam kết',
          style: 'default',
          onPress: () => {
            setShowRecordSelector(false)
            handleCreateRemindersWithType('basic')
          }
        }
      ],
      { cancelable: false }
    )
  }

  // Helper function to create reminders with specific type
  const handleCreateRemindersWithType = async (type: 'basic' | 'advanced') => {
    setLoading(true)
    try {
      const selectedRecords = allRecords.filter(r => selectedRecordIds.has(r.id))
      const remindersToPreview: any[] = []
      
      // BASIC: Only get prescription data
      console.log('📋 Basic analysis: Only prescription data')
      
      for (const record of selectedRecords) {
        if (record.toa_thuoc && record.toa_thuoc.length > 0) {
          for (const med of record.toa_thuoc) {
            const times = parseFrequencyToTimes(med.tan_suat || '')
            
            for (const time of times) {
              remindersToPreview.push({
                id: `preview_${record.id}_${med.ten_thuoc}_${time}`.replace(/\s/g, '_'),
                record_id: record.id,
                medication_name: med.ten_thuoc,
                dosage: med.lieu_dung,
                frequency: med.tan_suat || 'Theo chỉ định bác sĩ',
                instructions: med.cach_dung || 'Theo chỉ định bác sĩ',
                reminder_time: time,
                repeat_interval: 'daily',
                doctor_name: record.bac_si_kham || 'Bác sĩ',
                hospital: record.ten_benh_vien,
                diagnosis: record.chan_doan_ra || record.chan_doan_vao,
                prescription_date: record.ngay_kham,
                notes: med.ghi_chu,
                analysis_type: 'basic'
              })
            }
          }
        }
      }
      
      if (remindersToPreview.length > 0) {
        setPreviewReminders(remindersToPreview)
        setShowReminderPreview(true)
      } else {
        Alert.alert('Thông báo', 'Không tìm thấy đơn thuốc trong các hồ sơ đã chọn')
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message)
    } finally {
      setLoading(false)
    }
  }

  const generateRemindersFromRecords = (records: any[]): SmartReminder[] => {
    const suggestions: SmartReminder[] = []
    
    for (const record of records) {
      // Medication reminders
      const treatment = record.phuong_phap_dieu_tri?.toLowerCase() || ''
      if (treatment.includes('thuốc') || treatment.includes('uống') || treatment.includes('tiêm')) {
        const morningTime = new Date()
        morningTime.setHours(8, 0, 0, 0)
        if (morningTime < new Date()) morningTime.setDate(morningTime.getDate() + 1)
        
        suggestions.push({
          id: `med_morning_${record.id}`,
          user_id: userId,
          title: '💊 Nhắc uống thuốc buổi sáng',
          body: `Đã đến giờ uống thuốc theo đơn của ${record.ten_benh_vien || 'bác sĩ'}`,
          type: 'medication',
          priority: 'high',
          scheduled_time: morningTime,
          repeat_interval: 'daily',
          based_on: { record_id: record.id },
          created_at: new Date(),
          is_active: true
        })

        const eveningTime = new Date()
        eveningTime.setHours(20, 0, 0, 0)
        if (eveningTime < new Date()) eveningTime.setDate(eveningTime.getDate() + 1)
        
        suggestions.push({
          id: `med_evening_${record.id}`,
          user_id: userId,
          title: '💊 Nhắc uống thuốc buổi tối',
          body: 'Nhớ uống thuốc theo chỉ định của bác sĩ',
          type: 'medication',
          priority: 'high',
          scheduled_time: eveningTime,
          repeat_interval: 'daily',
          based_on: { record_id: record.id },
          created_at: new Date(),
          is_active: true
        })
      }

      // Checkup reminders
      const diagnosis = (record.chan_doan_ra || record.chan_doan_vao || '').toLowerCase()
      const chronicConditions = ['cao huyết áp', 'đái tháo đường', 'tim mạch', 'thận', 'gan']
      const hasChronicCondition = chronicConditions.some(condition => diagnosis.includes(condition))
      
      if (hasChronicCondition) {
        const checkupTime = new Date()
        checkupTime.setHours(9, 0, 0, 0)
        checkupTime.setDate(checkupTime.getDate() + 30)
        
        suggestions.push({
          id: `checkup_monthly_${record.id}`,
          user_id: userId,
          title: '🏥 Nhắc tái khám định kỳ',
          body: `Đã đến lịch tái khám cho bệnh: ${record.chan_doan_ra || record.chan_doan_vao}`,
          type: 'checkup',
          priority: 'medium',
          scheduled_time: checkupTime,
          repeat_interval: 'monthly',
          based_on: { record_id: record.id },
          created_at: new Date(),
          is_active: true
        })
      }

      // Lifestyle reminders
      const exerciseTime = new Date()
      exerciseTime.setHours(17, 0, 0, 0)
      if (exerciseTime < new Date()) exerciseTime.setDate(exerciseTime.getDate() + 1)
      
      suggestions.push({
        id: `lifestyle_exercise_${record.id}`,
        user_id: userId,
        title: '🏃‍♂️ Nhắc tập thể dục',
        body: 'Dành 30 phút tập thể dục nhẹ để cải thiện sức khỏe',
        type: 'lifestyle',
        priority: 'low',
        scheduled_time: exerciseTime,
        repeat_interval: 'daily',
        based_on: { record_id: record.id },
        created_at: new Date(),
        is_active: true
      })
    }
    
    return suggestions
  }

  const handleConfirmSuggestions = async () => {
    setLoading(true)
    try {
      const selectedReminders = suggestedReminders.filter(r => selectedSuggestions.has(r.id))
      
      for (const reminder of selectedReminders) {
        let trigger: any
        const now = Date.now()
        const scheduledTime = reminder.scheduled_time.getTime()
        const secondsUntilTrigger = Math.max(1, Math.floor((scheduledTime - now) / 1000))
        
        if (reminder.repeat_interval === 'daily') {
          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: reminder.scheduled_time.getHours(),
            minute: reminder.scheduled_time.getMinutes(),
            repeats: true
          }
        } else if (reminder.repeat_interval === 'weekly') {
          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: reminder.scheduled_time.getDay() + 1,
            hour: reminder.scheduled_time.getHours(),
            minute: reminder.scheduled_time.getMinutes(),
            repeats: true
          }
        } else if (reminder.repeat_interval === 'monthly') {
          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            day: reminder.scheduled_time.getDate(),
            hour: reminder.scheduled_time.getHours(),
            minute: reminder.scheduled_time.getMinutes(),
            repeats: true
          }
        } else {
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
            data: {
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
      }
      
      await loadReminders(userId)
      setShowSuggestionsModal(false)
      setSuggestedReminders([])
      setSelectedSuggestions(new Set())
      Alert.alert('Thành công!', `Đã tạo ${selectedReminders.length} nhắc nhở`)
    } catch (error: any) {
      Alert.alert('Lỗi', error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleSuggestion = (id: string) => {
    const newSelected = new Set(selectedSuggestions)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedSuggestions(newSelected)
  }

  const editSuggestion = (reminder: SmartReminder) => {
    setCustomTitle(reminder.title)
    setCustomBody(reminder.body)
    setCustomTime(reminder.scheduled_time)
    setCustomRepeat(reminder.repeat_interval || 'none')
    
    // Remove from suggestions and open custom modal
    setSuggestedReminders(prev => prev.filter(r => r.id !== reminder.id))
    setSelectedSuggestions(prev => {
      const newSet = new Set(prev)
      newSet.delete(reminder.id)
      return newSet
    })
    
    setShowSuggestionsModal(false)
    setShowCustomModal(true)
  }

  const handleOpenCustomModal = () => {
    if (!hasPermission) {
      Alert.alert('Cần quyền thông báo', 'Vui lòng cấp quyền thông báo')
      return
    }
    setCustomTitle('')
    setCustomBody('')
    setCustomTime(new Date())
    setCustomRepeat('none')
    setShowCustomModal(true)
  }

  const handleCreateCustomReminder = async () => {
    if (!customTitle.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề')
      return
    }

    // Check if reminder is medication-related
    const title = customTitle.toLowerCase()
    const body = customBody.toLowerCase()
    const medicationKeywords = ['thuốc', 'uống', 'tiêm', 'dùng', 'liều', 'viên', 'mg', 'ml']
    const isMedicationRelated = medicationKeywords.some(keyword => 
      title.includes(keyword) || body.includes(keyword)
    )

    // Show disclaimer if medication-related
    if (isMedicationRelated) {
      Alert.alert(
        '⚠️ Cảnh báo quan trọng',
        'Nhắc nhở này có vẻ liên quan đến thuốc.\n\n' +
        '⚠️ LƯU Ý:\n' +
        '• Chỉ dùng thuốc theo chỉ định của bác sĩ\n' +
        '• KHÔNG tự ý mua và dùng thuốc\n' +
        '• Liều lượng và cách dùng phải theo đơn bác sĩ\n' +
        '• Liên hệ bác sĩ nếu có bất thường\n\n' +
        'Bạn cam kết tuân thủ các quy định trên?',
        [
          {
            text: 'Hủy',
            style: 'cancel'
          },
          {
            text: 'Tôi cam kết',
            onPress: () => proceedCreateCustomReminder()
          }
        ],
        { cancelable: false }
      )
      return
    }

    // Not medication-related, proceed directly
    proceedCreateCustomReminder()
  }

  const proceedCreateCustomReminder = async () => {
    try {
      setLoading(true)
      
      // Create trigger
      let trigger: any
      const now = Date.now()
      const scheduledTime = customTime.getTime()
      const secondsUntilTrigger = Math.max(1, Math.floor((scheduledTime - now) / 1000))
      
      if (customRepeat === 'daily') {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: customTime.getHours(),
          minute: customTime.getMinutes(),
          repeats: true
        }
      } else if (customRepeat === 'weekly') {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: customTime.getDay() + 1,
          hour: customTime.getHours(),
          minute: customTime.getMinutes(),
          repeats: true
        }
      } else if (customRepeat === 'monthly') {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          day: customTime.getDate(),
          hour: customTime.getHours(),
          minute: customTime.getMinutes(),
          repeats: true
        }
      } else {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntilTrigger
        }
      }
      
      // Schedule notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: customTitle,
          body: customBody || 'Nhắc nhở sức khỏe',
          sound: true,
          data: {
            type: 'lifestyle',
            priority: 'medium',
            based_on: { custom: true },
            // Store time info in data for reliable retrieval
            scheduled_hour: customTime.getHours(),
            scheduled_minute: customTime.getMinutes(),
            scheduled_day: customTime.getDate(),
            repeat_interval: customRepeat !== 'none' ? customRepeat : undefined
          }
        },
        trigger
      })
      
      await loadReminders(userId)
      setShowCustomModal(false)
      
      // If there are still suggestions, show them again
      if (suggestedReminders.length > 0) {
        setShowSuggestionsModal(true)
      } else {
        Alert.alert('Thành công!', 'Đã tạo nhắc nhở tùy chỉnh')
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message)
    } finally {
      setLoading(false)
    }
  }

  const onTimeChange = (_: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios')
    if (selectedDate) {
      setCustomTime(selectedDate)
    }
  }

  const handleDeleteReminder = async (reminder: SmartReminder) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc muốn xóa nhắc nhở này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            await cancelReminder(reminder.id)
            await loadReminders(userId)
            Alert.alert('Đã xóa', 'Nhắc nhở đã được xóa')
          }
        }
      ]
    )
  }

  const handleDeleteMedicationReminder = async (reminderId: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc muốn xóa nhắc nhở uống thuốc này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteMedicationReminder(reminderId)
            if (result.success) {
              await loadReminders(userId)
              Alert.alert('Đã xóa', 'Nhắc nhở đã được xóa')
            } else {
              Alert.alert('Lỗi', result.error || 'Không thể xóa nhắc nhở')
            }
          }
        }
      ]
    )
  }

  const handleDeleteAll = async () => {
    const totalCount = reminders.length + medicationReminders.length
    if (totalCount === 0) {
      Alert.alert('Thông báo', 'Không có nhắc nhở nào để xóa')
      return
    }

    Alert.alert(
      'Xác nhận xóa tất cả',
      `Bạn có chắc muốn xóa TẤT CẢ ${totalCount} nhắc nhở?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: async () => {
            // Delete old-style reminders
            await cancelAllReminders()
            
            // Delete medication reminders
            for (const medReminder of medicationReminders) {
              await deleteMedicationReminder(medReminder.id)
            }
            
            await loadReminders(userId)
            Alert.alert('Đã xóa', 'Đã xóa tất cả nhắc nhở')
          }
        }
      ]
    )
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadUserData()
    setRefreshing(false)
  }

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'medication': return 'medical'
      case 'checkup': return 'calendar'
      case 'lifestyle': return 'fitness'
      case 'warning': return 'warning'
      case 'followup': return 'time'
      default: return 'notifications'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#f44336'
      case 'high': return '#FF9800'
      case 'medium': return '#2196F3'
      case 'low': return '#4CAF50'
      default: return '#999'
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nhắc nhở thông minh</Text>
        <TouchableOpacity onPress={handleDeleteAll} style={styles.deleteAllButton}>
          <Ionicons name="trash-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Permission Status */}
        {!hasPermission && (
          <View style={styles.permissionCard}>
            <Ionicons name="notifications-off" size={40} color="#f44336" />
            <Text style={styles.permissionTitle}>Cần quyền thông báo</Text>
            <Text style={styles.permissionText}>
              Cấp quyền để nhận nhắc nhở sức khỏe
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={checkPermissions}>
              <Text style={styles.permissionButtonText}>Cấp quyền</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Medical Disclaimer Banner */}
        {medicationReminders.length > 0 && (
          <View style={styles.disclaimerBanner}>
            <Ionicons name="warning" size={20} color="#FF9800" />
            <Text style={styles.disclaimerText}>
              AI chỉ tạo nhắc nhở dựa trên đơn bác sĩ. Không tự ý thay đổi liều lượng hoặc ngừng thuốc.
            </Text>
          </View>
        )}

        {/* Create Reminders Action */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleCreateReminders}
            disabled={loading}
          >
            <Ionicons name="add-circle" size={24} color="white" />
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonTitle}>
                {selectedRecordIds.size > 0 
                  ? `Tạo nhắc nhở từ ${selectedRecordIds.size} hồ sơ`
                  : 'Tạo nhắc nhở từ hồ sơ'}
              </Text>
              <Text style={styles.actionButtonSubtitle}>
                Chọn loại phân tích: Cơ bản hoặc Chuyên sâu
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.customButton]}
            onPress={handleOpenCustomModal}
            disabled={loading}
          >
            <Ionicons name="create" size={24} color="white" />
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonTitle}>Tạo nhắc nhở tùy chỉnh</Text>
              <Text style={styles.actionButtonSubtitle}>
                Tự đặt thời gian và nội dung nhắc nhở
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Active Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            📋 Nhắc nhở đang hoạt động ({reminders.length + medicationReminders.length})
          </Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
          ) : (reminders.length === 0 && medicationReminders.length === 0) ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Chưa có nhắc nhở nào</Text>
              <Text style={styles.emptySubtext}>
                Tạo nhắc nhở từ hồ sơ hoặc tự tạo nhắc nhở tùy chỉnh
              </Text>
            </View>
          ) : (
            <>
              {/* Medication Reminders from Database */}
              {medicationReminders.map((medReminder) => (
                <View key={medReminder.id} style={styles.reminderCard}>
                  <View style={styles.reminderHeader}>
                    <View style={styles.reminderIconContainer}>
                      <Ionicons
                        name="medical"
                        size={24}
                        color="#FF9800"
                      />
                    </View>
                    <View style={styles.reminderContent}>
                      <Text style={styles.reminderTitle}>💊 {medReminder.medication_name}</Text>
                      <Text style={styles.reminderBody}>
                        {medReminder.dosage} - {medReminder.frequency}
                      </Text>
                      <Text style={styles.reminderInstructions}>
                        {medReminder.instructions}
                      </Text>
                      <View style={styles.reminderMeta}>
                        <Text style={styles.reminderTime}>
                          ⏰ {medReminder.reminder_time}
                        </Text>
                        <Text style={styles.reminderRepeat}>
                          • Hàng ngày
                        </Text>
                      </View>
                      <Text style={styles.reminderDoctor}>
                        👨‍⚕️ BS. {medReminder.doctor_name}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteMedicationReminder(medReminder.id)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={20} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Old-style Reminders from Expo Notifications */}
              {reminders.map((reminder) => (
                <View key={reminder.id} style={styles.reminderCard}>
                  <View style={styles.reminderHeader}>
                    <View style={styles.reminderIconContainer}>
                      <Ionicons
                        name={getReminderIcon(reminder.type) as any}
                        size={24}
                        color={getPriorityColor(reminder.priority)}
                      />
                    </View>
                    <View style={styles.reminderContent}>
                      <Text style={styles.reminderTitle}>{reminder.title}</Text>
                      <Text style={styles.reminderBody}>{reminder.body}</Text>
                      <View style={styles.reminderMeta}>
                        <Text style={styles.reminderTime}>
                          {reminder.scheduled_time.toLocaleString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit'
                          })}
                        </Text>
                        {reminder.repeat_interval && (
                          <Text style={styles.reminderRepeat}>
                            • {reminder.repeat_interval === 'daily' ? 'Hàng ngày' :
                               reminder.repeat_interval === 'weekly' ? 'Hàng tuần' :
                               'Hàng tháng'}
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteReminder(reminder)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={20} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* Analysis Type Selection Modal */}
      <Modal
        visible={showAnalysisTypeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAnalysisTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn loại phân tích</Text>
              <TouchableOpacity onPress={() => setShowAnalysisTypeModal(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Basic Analysis Option */}
              <TouchableOpacity
                style={[
                  styles.analysisTypeCard,
                  analysisType === 'basic' && styles.analysisTypeCardActive
                ]}
                onPress={() => setAnalysisType('basic')}
              >
                <View style={styles.analysisTypeHeader}>
                  <View style={styles.analysisTypeIconContainer}>
                    <Ionicons 
                      name="document-text" 
                      size={32} 
                      color={analysisType === 'basic' ? '#4CAF50' : '#999'} 
                    />
                  </View>
                  <View style={styles.analysisTypeInfo}>
                    <Text style={[
                      styles.analysisTypeTitle,
                      analysisType === 'basic' && styles.analysisTypeTitleActive
                    ]}>
                      💊 Nhắc nhở Cơ bản
                    </Text>
                    <Text style={styles.analysisTypeSubtitle}>
                      Nhanh chóng và đơn giản
                    </Text>
                  </View>
                  <Ionicons 
                    name={analysisType === 'basic' ? 'radio-button-on' : 'radio-button-off'} 
                    size={24} 
                    color={analysisType === 'basic' ? '#4CAF50' : '#999'} 
                  />
                </View>
                <View style={styles.analysisTypeDescription}>
                  <Text style={styles.analysisTypeDescText}>
                    ✓ Chỉ lấy thông tin đơn thuốc từ hồ sơ{'\n'}
                    ✓ Tạo nhắc nhở uống thuốc theo liều lượng{'\n'}
                    ✓ Không phân tích chuyên sâu{'\n'}
                    ✓ Phù hợp cho đơn thuốc đơn giản
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Advanced Analysis Option */}
              <TouchableOpacity
                style={[
                  styles.analysisTypeCard,
                  analysisType === 'advanced' && styles.analysisTypeCardActive
                ]}
                onPress={() => setAnalysisType('advanced')}
              >
                <View style={styles.analysisTypeHeader}>
                  <View style={styles.analysisTypeIconContainer}>
                    <Ionicons 
                      name="analytics" 
                      size={32} 
                      color={analysisType === 'advanced' ? '#4CAF50' : '#999'} 
                    />
                  </View>
                  <View style={styles.analysisTypeInfo}>
                    <Text style={[
                      styles.analysisTypeTitle,
                      analysisType === 'advanced' && styles.analysisTypeTitleActive
                    ]}>
                      🧠 Nhắc nhở Chuyên sâu
                    </Text>
                    <Text style={styles.analysisTypeSubtitle}>
                      Phân tích AI toàn diện
                    </Text>
                  </View>
                  <Ionicons 
                    name={analysisType === 'advanced' ? 'radio-button-on' : 'radio-button-off'} 
                    size={24} 
                    color={analysisType === 'advanced' ? '#4CAF50' : '#999'} 
                  />
                </View>
                <View style={styles.analysisTypeDescription}>
                  <Text style={styles.analysisTypeDescText}>
                    ✓ Phân tích toàn bộ bệnh án{'\n'}
                    ✓ Kết hợp lời nhắc của bác sĩ{'\n'}
                    ✓ Đề xuất lịch uống thuốc tối ưu{'\n'}
                    ✓ Cảnh báo tương tác thuốc{'\n'}
                    ✓ Phù hợp cho bệnh mãn tính
                  </Text>
                </View>
                <View style={styles.analysisTypeWarning}>
                  <Ionicons name="time" size={16} color="#FF9800" />
                  <Text style={styles.analysisTypeWarningText}>
                    Phân tích có thể mất 30-60 giây
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Disclaimer */}
              <View style={styles.analysisDisclaimer}>
                <Ionicons name="information-circle" size={20} color="#2196F3" />
                <Text style={styles.analysisDisclaimerText}>
                  ⚠️ Cả 2 loại đều chỉ mang tính tham khảo. Luôn tuân thủ chỉ định của bác sĩ.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAnalysisTypeModal(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={() => {
                  setShowAnalysisTypeModal(false)
                  setShowRecordSelector(true)
                }}
              >
                <Ionicons name="arrow-forward" size={20} color="white" />
                <Text style={styles.createButtonText}>Tiếp tục</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Record Selector Modal */}
      <Modal
        visible={showRecordSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRecordSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn hồ sơ để tạo nhắc nhở</Text>
              <TouchableOpacity onPress={() => setShowRecordSelector(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.selectorActions}>
              <TouchableOpacity
                style={styles.selectAllButton}
                onPress={selectAllRecords}
              >
                <Ionicons name="checkmark-done" size={18} color="#4CAF50" />
                <Text style={styles.selectAllText}>Chọn tất cả</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearRecordSelection}
              >
                <Ionicons name="close-circle" size={18} color="#F44336" />
                <Text style={styles.clearText}>Bỏ chọn</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.recordList}
              contentContainerStyle={styles.recordListContent}
            >
              {allRecords.map((record) => (
                <TouchableOpacity
                  key={record.id}
                  style={[
                    styles.recordItem,
                    selectedRecordIds.has(record.id) && styles.recordItemSelected
                  ]}
                  onPress={() => toggleRecordSelection(record.id)}
                >
                  <View style={styles.recordCheckbox}>
                    <Ionicons
                      name={selectedRecordIds.has(record.id) ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={selectedRecordIds.has(record.id) ? '#4CAF50' : '#999'}
                    />
                  </View>
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordHospital}>{record.ten_benh_vien}</Text>
                    <Text style={styles.recordDiagnosis}>
                      {record.chan_doan_ra || record.chan_doan_vao || 'Chưa có chẩn đoán'}
                    </Text>
                    <Text style={styles.recordDate}>
                      {new Date(record.ngay_kham).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Text style={styles.selectedCount}>
                Đã chọn: {selectedRecordIds.size}/{allRecords.length} hồ sơ
              </Text>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.createButton,
                  selectedRecordIds.size === 0 && styles.createButtonDisabled
                ]}
                onPress={handleConfirmRecordSelection}
                disabled={selectedRecordIds.size === 0}
              >
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.createButtonText}>Tạo nhắc nhở</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Reminder Modal */}
      <Modal
        visible={showCustomModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo nhắc nhở tùy chỉnh</Text>
              <TouchableOpacity onPress={() => setShowCustomModal(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Warning Banner */}
              <View style={styles.customReminderWarning}>
                <Ionicons name="warning" size={18} color="#FF9800" />
                <Text style={styles.customReminderWarningText}>
                  Nếu nhắc nhở liên quan đến thuốc, chỉ dùng theo chỉ định bác sĩ
                </Text>
              </View>

              <Text style={styles.inputLabel}>Tiêu đề *</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Uống thuốc, Đo huyết áp..."
                value={customTitle}
                onChangeText={setCustomTitle}
              />

              <Text style={styles.inputLabel}>Nội dung</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Mô tả chi tiết (tùy chọn)"
                value={customBody}
                onChangeText={setCustomBody}
                multiline
                numberOfLines={3}
              />
              <Text style={styles.inputLabel}>Thời gian</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time" size={20} color="#4CAF50" />
                <Text style={styles.timeButtonText}>
                  {customTime.toLocaleString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </TouchableOpacity>

              {showTimePicker && (
                <DateTimePicker
                  value={customTime}
                  mode="datetime"
                  display="default"
                  onChange={onTimeChange}
                  minimumDate={new Date()}
                />
              )}

              <Text style={styles.inputLabel}>Lặp lại</Text>
              <View style={styles.repeatOptions}>
                {[
                  { value: 'none', label: 'Không lặp', icon: 'radio-button-off' },
                  { value: 'daily', label: 'Hàng ngày', icon: 'today' },
                  { value: 'weekly', label: 'Hàng tuần', icon: 'calendar' },
                  { value: 'monthly', label: 'Hàng tháng', icon: 'calendar-outline' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.repeatOption,
                      customRepeat === option.value && styles.repeatOptionActive
                    ]}
                    onPress={() => setCustomRepeat(option.value as any)}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={20}
                      color={customRepeat === option.value ? '#4CAF50' : '#999'}
                    />
                    <Text
                      style={[
                        styles.repeatOptionText,
                        customRepeat === option.value && styles.repeatOptionTextActive
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCustomModal(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateCustomReminder}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.createButtonText}>Tạo</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reminder Preview Modal - User can edit times before saving */}
      <Modal
        visible={showReminderPreview}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReminderPreview(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Xem trước nhắc nhở ({previewReminders.length})
              </Text>
              <TouchableOpacity onPress={() => setShowReminderPreview(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.previewHint}>
              <Ionicons name="information-circle" size={20} color="#2196F3" />
              <Text style={styles.previewHintText}>
                Nhấn vào thời gian để chỉnh sửa. Vuốt sang trái để xóa.
              </Text>
            </View>

            <ScrollView style={styles.modalBody}>
              {previewReminders.map((reminder) => (
                <View key={reminder.id} style={styles.previewReminderCard}>
                  {/* Analysis Type Badge */}
                  {reminder.analysis_type && (
                    <View style={styles.analysisTypeBadge}>
                      <Ionicons 
                        name={reminder.analysis_type === 'advanced' ? 'sparkles' : 'document-text'} 
                        size={14} 
                        color="white" 
                      />
                      <Text style={styles.analysisTypeBadgeText}>
                        {reminder.analysis_type === 'advanced' ? 'Phân tích AI' : 'Cơ bản'}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.previewReminderHeader}>
                    <View style={styles.previewReminderInfo}>
                      <Text style={styles.previewMedicationName}>
                        💊 {reminder.medication_name}
                      </Text>
                      <Text style={styles.previewDosage}>
                        {reminder.dosage} - {reminder.frequency}
                      </Text>
                      <Text style={styles.previewInstructions}>
                        {reminder.instructions}
                      </Text>
                      
                      {/* AI Notes for Advanced Analysis */}
                      {reminder.ai_notes && (
                        <View style={styles.aiNotesContainer}>
                          <Ionicons name="bulb" size={14} color="#FF9800" />
                          <Text style={styles.aiNotesText}>{reminder.ai_notes}</Text>
                        </View>
                      )}
                      
                      {/* AI Recommendations */}
                      {reminder.ai_recommendations && (
                        <View style={styles.aiRecommendationsContainer}>
                          <Ionicons name="information-circle" size={14} color="#2196F3" />
                          <Text style={styles.aiRecommendationsText}>{reminder.ai_recommendations}</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeletePreviewReminder(reminder.id)}
                      style={styles.deletePreviewButton}
                    >
                      <Ionicons name="trash-outline" size={20} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.timeEditButton}
                    onPress={() => handleEditReminderTime(reminder)}
                  >
                    <View style={styles.timeEditInfo}>
                      <View style={styles.timeEditRow}>
                        <Ionicons name="time" size={16} color="#4CAF50" />
                        <Text style={styles.timeEditLabel}>
                          {reminder.reminder_time}
                        </Text>
                      </View>
                      <View style={styles.timeEditRow}>
                        <Ionicons name="repeat" size={16} color="#2196F3" />
                        <Text style={styles.timeEditLabel}>
                          {reminder.repeat_interval === 'daily' ? 'Hàng ngày' :
                           reminder.repeat_interval === 'weekly' ? 'Hàng tuần' :
                           reminder.repeat_interval === 'monthly' ? 'Hàng tháng' :
                           'Không lặp'}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="create-outline" size={20} color="#4CAF50" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowReminderPreview(false)
                  setPreviewReminders([])
                }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleSaveReminders}
                disabled={loading || previewReminders.length === 0}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={styles.createButtonText}>
                      Lưu ({previewReminders.length})
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Reminder Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          console.log('🔙 Closing edit modal')
          setShowEditModal(false)
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editReminderModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa nhắc nhở</Text>
              <TouchableOpacity onPress={() => {
                console.log('❌ Close button pressed')
                setShowEditModal(false)
              }}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.editMedicationName}>
                💊 {editingReminder?.medication_name}
              </Text>
              <Text style={styles.editDosage}>
                {editingReminder?.dosage} - {editingReminder?.frequency}
              </Text>

              {/* Date Picker */}
              <Text style={styles.inputLabel}>Ngày bắt đầu</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => {
                  console.log('📅 Date picker opened')
                  setShowEditDatePicker(true)
                }}
              >
                <Ionicons name="calendar" size={20} color="#4CAF50" />
                <Text style={styles.dateTimeButtonText}>
                  {editDateTime.toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </TouchableOpacity>

              {showEditDatePicker && (
                <DateTimePicker
                  value={editDateTime}
                  mode="date"
                  display="default"
                  onChange={onEditDateChange}
                  minimumDate={new Date()}
                />
              )}

              {/* Time Picker */}
              <Text style={styles.inputLabel}>Thời gian</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => {
                  console.log('⏰ Time picker opened')
                  setShowEditTimePicker(true)
                }}
              >
                <Ionicons name="time" size={20} color="#4CAF50" />
                <Text style={styles.dateTimeButtonText}>
                  {editDateTime.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </TouchableOpacity>

              {showEditTimePicker && (
                <DateTimePicker
                  value={editDateTime}
                  mode="time"
                  display="default"
                  onChange={onEditTimeChange}
                />
              )}

              {/* Repeat Options */}
              <Text style={styles.inputLabel}>Lặp lại</Text>
              <View style={styles.repeatOptions}>
                {[
                  { value: 'none', label: 'Không lặp', icon: 'radio-button-off' },
                  { value: 'daily', label: 'Hàng ngày', icon: 'today' },
                  { value: 'weekly', label: 'Hàng tuần', icon: 'calendar' },
                  { value: 'monthly', label: 'Hàng tháng', icon: 'calendar-outline' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.repeatOption,
                      editRepeat === option.value && styles.repeatOptionActive
                    ]}
                    onPress={() => {
                      console.log('🔁 Repeat changed to:', option.value)
                      setEditRepeat(option.value as any)
                    }}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={20}
                      color={editRepeat === option.value ? '#4CAF50' : '#999'}
                    />
                    <Text
                      style={[
                        styles.repeatOptionText,
                        editRepeat === option.value && styles.repeatOptionTextActive
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  console.log('❌ Cancel pressed')
                  setShowEditModal(false)
                  setTimeout(() => {
                    setShowReminderPreview(true)
                  }, 300)
                }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={() => {
                  console.log('💾 Save pressed')
                  handleSaveEditedReminder()
                }}
              >
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.createButtonText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Suggestions Modal */}
      <Modal
        visible={showSuggestionsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSuggestionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gợi ý nhắc nhở ({suggestedReminders.length})</Text>
              <TouchableOpacity onPress={() => setShowSuggestionsModal(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.suggestionHint}>
                Chọn các nhắc nhở bạn muốn tạo. Bạn có thể chỉnh sửa từng nhắc nhở trước khi xác nhận.
              </Text>

              {suggestedReminders.map((reminder) => (
                <View key={reminder.id} style={styles.suggestionItem}>
                  <TouchableOpacity
                    style={styles.suggestionCheckbox}
                    onPress={() => toggleSuggestion(reminder.id)}
                  >
                    <Ionicons
                      name={selectedSuggestions.has(reminder.id) ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={selectedSuggestions.has(reminder.id) ? '#4CAF50' : '#999'}
                    />
                  </TouchableOpacity>

                  <View style={styles.suggestionInfo}>
                    <View style={styles.suggestionTitleRow}>
                      <Text style={styles.suggestionItemTitle}>{reminder.title}</Text>
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(reminder.priority) }]}>
                        <Text style={styles.priorityBadgeText}>
                          {reminder.priority === 'high' ? 'Cao' : 
                           reminder.priority === 'medium' ? 'TB' : 'Thấp'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.suggestionItemBody}>{reminder.body}</Text>
                    <View style={styles.suggestionItemMeta}>
                      <Ionicons name="time" size={14} color="#999" />
                      <Text style={styles.suggestionItemTime}>
                        {reminder.scheduled_time.toLocaleString('vi-VN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                      {reminder.repeat_interval && (
                        <>
                          <Text style={styles.suggestionItemSeparator}>•</Text>
                          <Text style={styles.suggestionItemRepeat}>
                            {reminder.repeat_interval === 'daily' ? 'Hàng ngày' :
                             reminder.repeat_interval === 'weekly' ? 'Hàng tuần' :
                             'Hàng tháng'}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.editSuggestionButton}
                    onPress={() => editSuggestion(reminder)}
                  >
                    <Ionicons name="create-outline" size={20} color="#2196F3" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowSuggestionsModal(false)
                  setSuggestedReminders([])
                  setSelectedSuggestions(new Set())
                }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleConfirmSuggestions}
                disabled={loading || selectedSuggestions.size === 0}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.createButtonText}>
                    Tạo ({selectedSuggestions.size})
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  deleteAllButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  permissionCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  permissionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  permissionButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    margin: 15,
    marginBottom: 0,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    marginLeft: 10,
    lineHeight: 18,
    fontWeight: '500',
  },
  customReminderWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  customReminderWarningText: {
    flex: 1,
    fontSize: 12,
    color: '#E65100',
    marginLeft: 8,
    lineHeight: 16,
  },
  section: {
    margin: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  customButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonContent: {
    flex: 1,
    marginLeft: 15,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  actionButtonSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 3,
  },
  loader: {
    marginVertical: 30,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 5,
  },
  reminderCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reminderIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  reminderBody: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  reminderInstructions: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  reminderDoctor: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
  },
  reminderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderTime: {
    fontSize: 12,
    color: '#999',
  },
  reminderRepeat: {
    fontSize: 12,
    color: '#999',
    marginLeft: 5,
  },
  deleteButton: {
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  timeButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  repeatOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  repeatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  repeatOptionActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  repeatOptionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  repeatOptionTextActive: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  createButton: {
    backgroundColor: '#4CAF50',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  selectorActions: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  selectAllText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  clearText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '600',
  },
  recordList: {
    flex: 1,
  },
  recordListContent: {
    padding: 15,
    paddingBottom: 30,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  recordItemSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  recordCheckbox: {
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordHospital: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  recordDiagnosis: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  recordDate: {
    fontSize: 12,
    color: '#999',
  },
  selectedCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  suggestionHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  suggestionCheckbox: {
    padding: 4,
    marginRight: 10,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  suggestionItemTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
  },
  suggestionItemBody: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  suggestionItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionItemTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  suggestionItemSeparator: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 6,
  },
  suggestionItemRepeat: {
    fontSize: 12,
    color: '#999',
  },
  editSuggestionButton: {
    padding: 8,
    marginLeft: 8,
  },
  previewHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
  },
  previewHintText: {
    flex: 1,
    fontSize: 13,
    color: '#1976D2',
    marginLeft: 8,
    lineHeight: 18,
  },
  previewReminderCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  previewReminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  previewReminderInfo: {
    flex: 1,
  },
  previewMedicationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  previewDosage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  previewInstructions: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
  },
  deletePreviewButton: {
    padding: 8,
  },
  timeEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'space-between',
  },
  timeEditInfo: {
    flex: 1,
    flexDirection: 'row',
    gap: 15,
  },
  timeEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeEditLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  timeEditButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4CAF50',
    marginHorizontal: 8,
  },
  editReminderModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '75%',
  },
  editMedicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  editDosage: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  // Analysis Type Modal Styles
  analysisTypeCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  analysisTypeCardActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  analysisTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  analysisTypeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  analysisTypeInfo: {
    flex: 1,
  },
  analysisTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  analysisTypeTitleActive: {
    color: '#4CAF50',
  },
  analysisTypeSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  analysisTypeDescription: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  analysisTypeDescText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  analysisTypeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  analysisTypeWarningText: {
    fontSize: 12,
    color: '#E65100',
    marginLeft: 6,
  },
  analysisDisclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  analysisDisclaimerText: {
    flex: 1,
    fontSize: 13,
    color: '#1976D2',
    marginLeft: 8,
    lineHeight: 18,
  },
  // Preview Reminder AI Styles
  analysisTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  analysisTypeBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  aiNotesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  aiNotesText: {
    flex: 1,
    fontSize: 12,
    color: '#E65100',
    marginLeft: 6,
    lineHeight: 16,
  },
  aiRecommendationsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  aiRecommendationsText: {
    flex: 1,
    fontSize: 12,
    color: '#1976D2',
    marginLeft: 6,
    lineHeight: 16,
  },
})
