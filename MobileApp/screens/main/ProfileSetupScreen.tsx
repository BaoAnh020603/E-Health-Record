import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { updateUserProfile, getCurrentUserProfile } from '../../services/auth'
import { supabase } from '../../lib/supabase'

export default function ProfileSetupScreen({ navigation, route, onComplete }: any) {
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showGenderModal, setShowGenderModal] = useState(false)
  const [showBloodTypeModal, setShowBloodTypeModal] = useState(false)
  
  // Add separate state for date text inputs
  const [dateInputs, setDateInputs] = useState({
    ngay_sinh: '',
    ngay_cap_bhyt: '',
    ngay_het_han_bhyt: ''
  })
  
  const [formData, setFormData] = useState({
    ho_ten: '',
    so_cccd: '',
    ngay_sinh: new Date(),
    gioi_tinh: '',
    dien_thoai: '',
    email: '',
    dia_chi: '',
    nhom_mau: '',
    ma_the_bhyt: '',
    ngay_cap_bhyt: new Date(),
    ngay_het_han_bhyt: new Date(),
    noi_dang_ky_kham_benh: ''
  })

  useEffect(() => {
    // Check if we're editing an existing profile
    const routeName = route?.name
    setIsEditing(routeName === 'EditProfile')
    
    // Only load existing profile data if we're in editing mode
    if (routeName === 'EditProfile') {
      loadExistingProfile()
    } else {
      // For first-time setup after login, start with empty form
      setFormData({
        ho_ten: '',
        so_cccd: '',
        ngay_sinh: new Date(),
        gioi_tinh: '',
        dien_thoai: '',
        email: '',
        dia_chi: '',
        nhom_mau: '',
        ma_the_bhyt: '',
        ngay_cap_bhyt: new Date(),
        ngay_het_han_bhyt: new Date(),
        noi_dang_ky_kham_benh: ''
      })
      
      setDateInputs({
        ngay_sinh: '',
        ngay_cap_bhyt: '',
        ngay_het_han_bhyt: ''
      })
    }
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      if (isEditing) {
        loadExistingProfile()
      }
    }, [isEditing])
  )

  const loadExistingProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Try to get existing profile data
        const existingProfile = await getCurrentUserProfile()
        
        if (existingProfile) {
          // Load existing profile data for editing
          setFormData({
            ho_ten: existingProfile.ho_ten || '',
            so_cccd: existingProfile.so_cccd || '',
            ngay_sinh: existingProfile.ngay_sinh ? new Date(existingProfile.ngay_sinh) : new Date(),
            gioi_tinh: existingProfile.gioi_tinh || '',
            dien_thoai: existingProfile.dien_thoai || '',
            email: existingProfile.email || '',
            dia_chi: existingProfile.dia_chi || '',
            nhom_mau: existingProfile.nhom_mau || '',
            ma_the_bhyt: existingProfile.ma_the_bhyt || '',
            ngay_cap_bhyt: existingProfile.ngay_cap_bhyt ? new Date(existingProfile.ngay_cap_bhyt) : new Date(),
            ngay_het_han_bhyt: existingProfile.ngay_het_han_bhyt ? new Date(existingProfile.ngay_het_han_bhyt) : new Date(),
            noi_dang_ky_kham_benh: existingProfile.noi_dang_ky_kham_benh || ''
          })
          
          // Set date input strings for display
          const birthDateString = existingProfile.ngay_sinh ? formatDateForDisplay(existingProfile.ngay_sinh) : ''
          const capDateString = existingProfile.ngay_cap_bhyt ? formatDateForDisplay(existingProfile.ngay_cap_bhyt) : ''
          const expireDateString = existingProfile.ngay_het_han_bhyt ? formatDateForDisplay(existingProfile.ngay_het_han_bhyt) : ''
          
          setDateInputs({
            ngay_sinh: birthDateString,
            ngay_cap_bhyt: capDateString,
            ngay_het_han_bhyt: expireDateString
          })
        }
      }
    } catch (error: any) {
      console.error('Error loading user data:', error)
    }
  }

  const handleSave = async () => {
    // Validate required fields
    if (!formData.ho_ten.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên')
      return
    }

    if (!formData.so_cccd.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số CCCD')
      return
    }

    if (!formData.gioi_tinh) {
      Alert.alert('Lỗi', 'Vui lòng chọn giới tính')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng')
        return
      }

      // Validate BHYT dates if BHYT card number is provided
      if (formData.ma_the_bhyt.trim()) {
        // Parse dates from text inputs for validation
        const capDate = parseDate(dateInputs.ngay_cap_bhyt)
        const hetHanDate = parseDate(dateInputs.ngay_het_han_bhyt)
        
        if (!capDate) {
          Alert.alert('Lỗi', 'Ngày cấp BHYT không hợp lệ. Vui lòng nhập theo định dạng DD/MM/YYYY')
          return
        }
        
        if (!hetHanDate) {
          Alert.alert('Lỗi', 'Ngày hết hạn BHYT không hợp lệ. Vui lòng nhập theo định dạng DD/MM/YYYY')
          return
        }
        
        if (capDate >= hetHanDate) {
          Alert.alert('Lỗi', 'Ngày cấp BHYT phải trước ngày hết hạn BHYT')
          return
        }
        
        // Update formData with parsed dates
        setFormData(prev => ({
          ...prev,
          ngay_cap_bhyt: capDate,
          ngay_het_han_bhyt: hetHanDate
        }))
      }

      // Validate birth date with multiple attempts
      let birthDate = parseDate(dateInputs.ngay_sinh)
      
      // If parsing failed, try to use the current formData date
      if (!birthDate && formData.ngay_sinh) {
        birthDate = formData.ngay_sinh
      }
      
      // If still no valid date, show error
      if (!birthDate || isNaN(birthDate.getTime())) {
        Alert.alert('Lỗi', 'Ngày sinh không hợp lệ. Vui lòng nhập theo định dạng DD/MM/YYYY')
        return
      }
      
      // Update formData with validated birth date
      const updatedFormData = { ...formData, ngay_sinh: birthDate }
      setFormData(updatedFormData)

      // Prepare update data with proper undefined handling
      const updateData = {
        ho_ten: updatedFormData.ho_ten.trim(),
        so_cccd: updatedFormData.so_cccd.trim(),
        ngay_sinh: updatedFormData.ngay_sinh.toISOString().split('T')[0],
        gioi_tinh: updatedFormData.gioi_tinh,
        dien_thoai: updatedFormData.dien_thoai.trim() || undefined,
        email: updatedFormData.email.trim() || undefined,
        dia_chi: updatedFormData.dia_chi.trim() || undefined,
        nhom_mau: updatedFormData.nhom_mau || undefined,
        // Only include BHYT fields if card number is provided
        ...(updatedFormData.ma_the_bhyt.trim() ? {
          ma_the_bhyt: updatedFormData.ma_the_bhyt.trim(),
          ngay_cap_bhyt: updatedFormData.ngay_cap_bhyt.toISOString().split('T')[0],
          ngay_het_han_bhyt: updatedFormData.ngay_het_han_bhyt.toISOString().split('T')[0],
          noi_dang_ky_kham_benh: updatedFormData.noi_dang_ky_kham_benh.trim() || undefined
        } : {
          ma_the_bhyt: undefined,
          ngay_cap_bhyt: undefined,
          ngay_het_han_bhyt: undefined,
          noi_dang_ky_kham_benh: undefined
        })
      }

      const result = await updateUserProfile(user.id, updateData)

      if (result.success) {
        // Force reload the profile data to ensure UI updates
        await loadExistingProfile()
        
        if (isEditing) {
          // For editing, show success message and go back
          Alert.alert(
            'Thành công',
            'Cập nhật thông tin cá nhân thành công!',
            [
              {
                text: 'Xem mã QR',
                onPress: () => navigation.navigate('QRCodeDisplay', { fromProfileSetup: false })
              },
              {
                text: 'Quay lại',
                style: 'cancel',
                onPress: () => navigation.goBack()
              }
            ]
          )
        } else {
          // For first-time setup, show QR code after successful profile creation
          // Call onComplete callback if provided
          if (onComplete) {
            onComplete()
          }
          
          // Navigate to QR code display screen
          navigation.replace('QRCodeDisplay', { fromProfileSetup: true })
        }
      } else {
        // Handle specific database constraint errors
        let errorMessage = result.error
        
        if (result.error.includes('valid_bhyt_dates')) {
          errorMessage = 'Ngày cấp BHYT phải trước ngày hết hạn BHYT. Vui lòng kiểm tra lại thông tin.'
        } else if (result.error.includes('nhom_mau_check')) {
          errorMessage = 'Nhóm máu không hợp lệ. Vui lòng chọn lại nhóm máu từ danh sách.'
        } else if (result.error.includes('gioi_tinh_check')) {
          errorMessage = 'Giới tính không hợp lệ. Vui lòng chọn lại giới tính.'
        } else if (result.error.includes('unique')) {
          errorMessage = 'Số CCCD đã được sử dụng bởi tài khoản khác.'
        } else if (result.error.includes('relation "users_profile" does not exist')) {
          errorMessage = 'Bảng users_profile chưa được tạo. Vui lòng chạy migration trong Supabase Dashboard.'
        }
        
        Alert.alert('Lỗi', errorMessage)
      }
    } catch (error: any) {
      console.error('Save profile error:', error)
      handleDatabaseError(error, 'lưu thông tin cá nhân')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    if (isEditing) {
      navigation.goBack()
      return
    }

    Alert.alert(
      'Bỏ qua cập nhật thông tin?',
      'Bạn có thể cập nhật thông tin sau trong phần Cá nhân.',
      [
        { text: 'Quay lại', style: 'cancel' },
        {
          text: 'Bỏ qua',
          style: 'default',
          onPress: () => {
            // Call onComplete callback if provided
            if (onComplete) {
              onComplete()
            }
            navigation.replace('MainTabs')
          }
        }
      ]
    )
  }

  const genderOptions = [
    { label: 'Nam', value: 'Nam' },
    { label: 'Nữ', value: 'Nữ' },
    { label: 'Khác', value: 'Khác' }
  ]

  const bloodTypeOptions = [
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' }
  ]

  const getGenderLabel = () => {
    const option = genderOptions.find(opt => opt.value === formData.gioi_tinh)
    return option ? option.label : 'Chọn giới tính'
  }

  const getBloodTypeLabel = () => {
    if (!formData.nhom_mau) return 'Chọn nhóm máu'
    const option = bloodTypeOptions.find(opt => opt.value === formData.nhom_mau)
    return option ? option.label : formData.nhom_mau
  }

  // Helper function to format date as DD/MM/YYYY
  const formatDateForDisplay = (date: Date | string): string => {
    if (!date) return ''
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return ''
    
    // Use UTC methods to avoid timezone issues
    const day = d.getUTCDate().toString().padStart(2, '0')
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0')
    const year = d.getUTCFullYear()
    return `${day}/${month}/${year}`
  }

  // Helper function to parse date from DD/MM/YYYY format
  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null
    
    const parts = dateString.split('/')
    if (parts.length === 3) {
      const day = parseInt(parts[0])
      const month = parseInt(parts[1]) - 1
      const year = parseInt(parts[2])
      
      if (!isNaN(day) && !isNaN(month) && !isNaN(year) && 
          day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900) {
        
        // Create date in UTC to avoid timezone issues
        const parsedDate = new Date(Date.UTC(year, month, day))
        return parsedDate
      }
    }
    
    return null
  }

  // Helper function to format date input with automatic slashes
  const formatDateInput = (text: string): string => {
    // Remove all non-numeric characters
    const numbers = text.replace(/\D/g, '')
    
    // Add slashes automatically
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`
    }
  }

  // Helper function to handle date input changes with auto-formatting
  const handleDateChange = (field: 'ngay_sinh' | 'ngay_cap_bhyt' | 'ngay_het_han_bhyt', text: string) => {
    // Format the input with automatic slashes
    const formattedText = formatDateInput(text)
    
    // Update the text input
    setDateInputs(prev => ({ ...prev, [field]: formattedText }))
    
    // Try to parse the date if it looks complete (8 characters: DD/MM/YYYY)
    if (formattedText.length === 10) {
      const parsedDate = parseDate(formattedText)
      
      if (parsedDate) {
        setFormData(prev => ({ ...prev, [field]: parsedDate }))
      }
    }
  }

  // Enhanced error handling for database operations
  const handleDatabaseError = (error: any, operation: string) => {
    console.error(`Database error during ${operation}:`, error)
    
    if (error.message?.includes('relation "users_profile" does not exist')) {
      Alert.alert(
        'Lỗi cơ sở dữ liệu', 
        'Bảng users_profile chưa được tạo. Vui lòng chạy migration trong Supabase Dashboard:\n\n' +
        'SQL Editor > New Query > Paste nội dung từ file:\n' +
        'Backend/supabase/functions/migrations/008_create_users_profile_table.sql'
      )
    } else if (error.message?.includes('permission denied') || error.message?.includes('RLS')) {
      Alert.alert(
        'Lỗi quyền truy cập',
        'Không có quyền truy cập bảng users_profile. Kiểm tra RLS policies trong Supabase.'
      )
    } else {
      Alert.alert(
        'Lỗi cơ sở dữ liệu',
        `Có lỗi xảy ra khi ${operation}: ${error.message}`
      )
    }
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Ionicons name="person-add" size={40} color="#2196F3" />
        <Text style={styles.title}>
          {isEditing ? 'Chỉnh sửa thông tin cá nhân' : 'Xác nhận thông tin cá nhân'}
        </Text>
        <Text style={styles.subtitle}>
          {isEditing 
            ? 'Cập nhật thông tin của bạn' 
            : 'Vui lòng cập nhật thông tin cá nhân để tiếp tục'
          }
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Thông tin cơ bản */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Họ và tên *</Text>
            <TextInput
              style={styles.input}
              value={formData.ho_ten}
              onChangeText={(text) => setFormData(prev => ({ ...prev, ho_ten: text }))}
              placeholder="Nhập họ và tên đầy đủ"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Số CCCD *</Text>
            <TextInput
              style={styles.input}
              value={formData.so_cccd}
              onChangeText={(text) => setFormData(prev => ({ ...prev, so_cccd: text }))}
              placeholder="Nhập số CCCD (12 số)"
              keyboardType="numeric"
              maxLength={12}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ngày sinh *</Text>
            <TextInput
              style={styles.input}
              value={dateInputs.ngay_sinh}
              onChangeText={(text) => handleDateChange('ngay_sinh', text)}
              placeholder="DD/MM/YYYY (VD: 01/01/1990)"
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Giới tính *</Text>
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={() => setShowGenderModal(true)}
            >
              <Text style={[styles.pickerButtonText, !formData.gioi_tinh && styles.placeholderText]}>
                {getGenderLabel()}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              value={formData.dien_thoai}
              onChangeText={(text) => setFormData(prev => ({ ...prev, dien_thoai: text }))}
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="Nhập địa chỉ email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Địa chỉ</Text>
            <TextInput
              style={styles.input}
              value={formData.dia_chi}
              onChangeText={(text) => setFormData(prev => ({ ...prev, dia_chi: text }))}
              placeholder="Nhập địa chỉ thường trú"
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nhóm máu</Text>
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={() => setShowBloodTypeModal(true)}
            >
              <Text style={[styles.pickerButtonText, !formData.nhom_mau && styles.placeholderText]}>
                {getBloodTypeLabel()}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Thông tin BHYT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin BHYT (Tùy chọn)</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mã thẻ BHYT</Text>
            <TextInput
              style={styles.input}
              value={formData.ma_the_bhyt}
              onChangeText={(text) => setFormData(prev => ({ ...prev, ma_the_bhyt: text }))}
              placeholder="Nhập mã thẻ BHYT"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ngày cấp BHYT</Text>
            <TextInput
              value={dateInputs.ngay_cap_bhyt}
              onChangeText={(text) => handleDateChange('ngay_cap_bhyt', text)}
              placeholder="DD/MM/YYYY (VD: 01/01/2020)"
              style={styles.input}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ngày hết hạn BHYT</Text>
            <TextInput
              value={dateInputs.ngay_het_han_bhyt}
              onChangeText={(text) => handleDateChange('ngay_het_han_bhyt', text)}
              placeholder="DD/MM/YYYY (VD: 01/01/2025)"
              style={styles.input}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nơi đăng ký khám bệnh</Text>
            <TextInput
              style={styles.input}
              value={formData.noi_dang_ky_kham_benh}
              onChangeText={(text) => setFormData(prev => ({ ...prev, noi_dang_ky_kham_benh: text }))}
              placeholder="Nhập tên bệnh viện/phòng khám"
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Đang lưu...' : (isEditing ? 'Lưu thông tin' : 'Xác nhận và tiếp tục')}
            </Text>
          </TouchableOpacity>

          {/* Show skip/cancel button for both editing and first-time setup */}
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>
              {isEditing ? 'Hủy' : 'Bỏ qua'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Gender Selection Modal */}
      <Modal
        visible={showGenderModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGenderModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn giới tính</Text>
              <TouchableOpacity onPress={() => setShowGenderModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.modalOption,
                  formData.gioi_tinh === option.value && styles.modalOptionSelected
                ]}
                onPress={() => {
                  setFormData(prev => ({ ...prev, gioi_tinh: option.value }))
                  setShowGenderModal(false)
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  formData.gioi_tinh === option.value && styles.modalOptionTextSelected
                ]}>
                  {option.label}
                </Text>
                {formData.gioi_tinh === option.value && (
                  <Ionicons name="checkmark" size={24} color="#2196F3" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Blood Type Selection Modal */}
      <Modal
        visible={showBloodTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBloodTypeModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowBloodTypeModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn nhóm máu</Text>
              <TouchableOpacity onPress={() => setShowBloodTypeModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {bloodTypeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalOption,
                    formData.nhom_mau === option.value && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, nhom_mau: option.value }))
                    setShowBloodTypeModal(false)
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    formData.nhom_mau === option.value && styles.modalOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {formData.nhom_mau === option.value && (
                    <Ionicons name="checkmark" size={24} color="#2196F3" />
                  )}
                </TouchableOpacity>
              ))}
              
              {/* Add option to clear selection */}
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  !formData.nhom_mau && styles.modalOptionSelected
                ]}
                onPress={() => {
                  setFormData(prev => ({ ...prev, nhom_mau: '' }))
                  setShowBloodTypeModal(false)
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  !formData.nhom_mau && styles.modalOptionTextSelected
                ]}>
                  Không xác định
                </Text>
                {!formData.nhom_mau && (
                  <Ionicons name="checkmark" size={24} color="#2196F3" />
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fafafa',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fafafa',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '70%',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  modalOptionSelected: {
    backgroundColor: '#E3F2FD',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalOptionTextSelected: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
})