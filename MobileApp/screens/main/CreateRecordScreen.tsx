import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  FlatList,
  Modal
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { createMedicalRecord } from '../../services/medicalRecords'
import { uploadMedicalFile, deleteMedicalFile } from '../../services/fileUpload'

export default function CreateRecordScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    ngay_kham: '',
    ten_benh_vien: '',
    ten_khoa: '',
    bac_si_kham: '',
    ly_do_kham: '',
    chan_doan_vao: '',
    chan_doan_ra: '',
    phuong_phap_dieu_tri: '',
    ket_qua_dieu_tri: '',
    so_ngay_dieu_tri: '',
    ghi_chu_bac_si: '',
    loai_kham: 'Ngoại trú' as 'Ngoại trú' | 'Nội trú' | 'Cấp cứu'
  })
  const [loading, setLoading] = useState(false)
  const [prescription, setPrescription] = useState([
    { ten_thuoc: '', lieu_dung: '', so_luong: '', cach_dung: '' }
  ])
  const [attachedFiles, setAttachedFiles] = useState<any[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)

  const addPrescriptionItem = () => {
    setPrescription([...prescription, { ten_thuoc: '', lieu_dung: '', so_luong: '', cach_dung: '' }])
  }

  const removePrescriptionItem = (index: number) => {
    if (prescription.length > 1) {
      setPrescription(prescription.filter((_, i) => i !== index))
    }
  }

  const updatePrescriptionItem = (index: number, field: string, value: string) => {
    const updated = prescription.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    )
    setPrescription(updated)
  }

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh để chọn hình ảnh')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        const fileInfo = {
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
          size: asset.fileSize || 0
        }
        setAttachedFiles(prev => [...prev, fileInfo])
      }
    } catch (error) {
      console.error('Pick image error:', error)
      Alert.alert('Lỗi', 'Không thể chọn hình ảnh')
    }
  }

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập camera để chụp ảnh')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        const fileInfo = {
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
          size: asset.fileSize || 0
        }
        setAttachedFiles(prev => [...prev, fileInfo])
      }
    } catch (error) {
      console.error('Take photo error:', error)
      Alert.alert('Lỗi', 'Không thể chụp ảnh')
    }
  }

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        const fileInfo = {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0
        }
        setAttachedFiles(prev => [...prev, fileInfo])
      }
    } catch (error) {
      console.error('Pick document error:', error)
      Alert.alert('Lỗi', 'Không thể chọn tài liệu')
    }
  }

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const viewImage = (uri: string) => {
    setSelectedImage(uri)
    setShowImageModal(true)
  }

  const getFileIcon = (type: string) => {
    if (type?.includes('image')) return '🖼️'
    if (type?.includes('pdf')) return '📄'
    if (type?.includes('word') || type?.includes('document')) return '📝'
    return '📎'
  }

  const showImagePickerOptions = () => {
    Alert.alert(
      'Thêm hình ảnh',
      'Chọn cách thêm hình ảnh',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Chụp ảnh', onPress: takePhoto },
        { text: 'Chọn từ thư viện', onPress: pickImage }
      ]
    )
  }

  const uploadFilesForRecord = async (recordId: string) => {
    console.log(`📤 Starting upload for ${attachedFiles.length} files...`)
    
    const uploadPromises = attachedFiles.map(async (file, index) => {
      setUploadingFiles(prev => [...prev, file.name])
      try {
        console.log(`📤 Uploading file ${index + 1}/${attachedFiles.length}: ${file.name}`)
        console.log(`   - Type: ${file.type}`)
        console.log(`   - Size: ${file.size} bytes`)
        console.log(`   - URI: ${file.uri.substring(0, 50)}...`)
        
        const result = await uploadMedicalFile(recordId, file)
        
        console.log(`   - Result:`, result)
        
        if (!result.success) {
          console.error(`❌ Upload failed for ${file.name}:`, result.error)
          throw new Error(result.error)
        }
        
        console.log(`✅ Upload successful for ${file.name}`)
        return result.data
      } catch (error) {
        console.error(`❌ Upload error for ${file.name}:`, error)
        throw error
      } finally {
        setUploadingFiles(prev => prev.filter(name => name !== file.name))
      }
    })

    const results = await Promise.all(uploadPromises)
    console.log(`✅ All uploads completed. ${results.length} files uploaded.`)
    return results
  }

  const validateDate = (dateString: string): boolean => {
    // Accept DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD formats
    const formats = [
      /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    ]
    
    return formats.some(format => format.test(dateString.trim()))
  }

  const convertDateToISO = (dateString: string): string => {
    const trimmed = dateString.trim()
    
    // If already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed
    }
    
    // Convert DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD
    const parts = trimmed.split(/[\/\-]/)
    if (parts.length === 3) {
      const [day, month, year] = parts
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    
    return trimmed
  }

  const showExamTypeOptions = () => {
    Alert.alert(
      'Chọn loại khám',
      'Vui lòng chọn loại khám bệnh',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Ngoại trú', onPress: () => updateFormData('loai_kham', 'Ngoại trú') },
        { text: 'Nội trú', onPress: () => updateFormData('loai_kham', 'Nội trú') },
        { text: 'Cấp cứu', onPress: () => updateFormData('loai_kham', 'Cấp cứu') }
      ]
    )
  }

  const handleSave = async () => {
    if (!formData.ngay_kham.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập ngày khám')
      return
    }

    // Validate and convert date format
    if (!validateDate(formData.ngay_kham)) {
      Alert.alert('Lỗi', 'Ngày khám không đúng định dạng. Vui lòng nhập theo định dạng DD/MM/YYYY, DD-MM-YYYY hoặc YYYY-MM-DD')
      return
    }

    const isoDate = convertDateToISO(formData.ngay_kham)
    const date = new Date(isoDate)
    if (isNaN(date.getTime())) {
      Alert.alert('Lỗi', 'Ngày khám không hợp lệ')
      return
    }

    // Check if date is not in the future
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (date > today) {
      Alert.alert('Lỗi', 'Ngày khám không thể là ngày trong tương lai')
      return
    }

    // Prepare prescription data
    const validPrescription = prescription.filter(item => 
      item.ten_thuoc.trim() || item.lieu_dung.trim() || item.so_luong.trim() || item.cach_dung.trim()
    ).map(item => ({
      ten_thuoc: item.ten_thuoc.trim(),
      lieu_dung: item.lieu_dung.trim(),
      so_luong: parseInt(item.so_luong) || 0,
      cach_dung: item.cach_dung.trim()
    }))

    setLoading(true)
    try {
      // First create the medical record
      const result = await createMedicalRecord({
        ...formData,
        ngay_kham: isoDate, // Use converted ISO date
        so_ngay_dieu_tri: formData.so_ngay_dieu_tri ? parseInt(formData.so_ngay_dieu_tri) : undefined,
        toa_thuoc: validPrescription.length > 0 ? validPrescription : undefined
      })

      if (!result.success) {
        Alert.alert('Lỗi', result.error)
        return
      }

      // Upload files if any
      if (attachedFiles.length > 0) {
        try {
          await uploadFilesForRecord(result.data.id)
          Alert.alert(
            'Thành công', 
            `Tạo hồ sơ thành công với ${attachedFiles.length} file đính kèm!\n\nBạn có muốn phân tích hồ sơ này bằng AI không?`, 
            [
              { 
                text: 'Phân tích ngay', 
                onPress: () => {
                  navigation.navigate('IntelligentAnalysis', { recordCreated: true })
                }
              },
              { 
                text: 'Để sau', 
                style: 'cancel',
                onPress: () => navigation.goBack() 
              }
            ]
          )
        } catch (uploadError) {
          console.error('File upload error:', uploadError)
          Alert.alert('Cảnh báo', 'Hồ sơ đã được tạo nhưng một số file không thể tải lên. Bạn có thể thêm file sau.', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ])
        }
      } else {
        Alert.alert(
          'Thành công', 
          'Tạo hồ sơ thành công!\n\nBạn có muốn phân tích hồ sơ này bằng AI không?', 
          [
            { 
              text: 'Phân tích ngay', 
              onPress: () => {
                navigation.navigate('IntelligentAnalysis', { recordCreated: true })
              }
            },
            { 
              text: 'Để sau', 
              style: 'cancel',
              onPress: () => navigation.goBack() 
            }
          ]
        )
      }
    } catch (error) {
      console.error('Save error:', error)
      Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          
          <Text style={styles.label}>Ngày khám *</Text>
          <TextInput
            style={styles.input}
            placeholder="DD/MM/YYYY (ví dụ: 15/01/2024)"
            value={formData.ngay_kham}
            onChangeText={(value) => updateFormData('ngay_kham', value)}
          />

          <Text style={styles.label}>Loại khám</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => showExamTypeOptions()}
          >
            <Text style={styles.pickerButtonText}>{formData.loai_kham}</Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Bệnh viện</Text>
          <TextInput
            style={styles.input}
            placeholder="Tên bệnh viện"
            value={formData.ten_benh_vien}
            onChangeText={(value) => updateFormData('ten_benh_vien', value)}
          />

          <Text style={styles.label}>Khoa</Text>
          <TextInput
            style={styles.input}
            placeholder="Tên khoa"
            value={formData.ten_khoa}
            onChangeText={(value) => updateFormData('ten_khoa', value)}
          />

          <Text style={styles.label}>Bác sĩ khám</Text>
          <TextInput
            style={styles.input}
            placeholder="Tên bác sĩ"
            value={formData.bac_si_kham}
            onChangeText={(value) => updateFormData('bac_si_kham', value)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chẩn đoán</Text>
          
          <Text style={styles.label}>Lý do khám</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Lý do đến khám"
            value={formData.ly_do_kham}
            onChangeText={(value) => updateFormData('ly_do_kham', value)}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Chẩn đoán vào</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Chẩn đoán ban đầu"
            value={formData.chan_doan_vao}
            onChangeText={(value) => updateFormData('chan_doan_vao', value)}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Chẩn đoán ra</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Chẩn đoán cuối cùng"
            value={formData.chan_doan_ra}
            onChangeText={(value) => updateFormData('chan_doan_ra', value)}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Điều trị</Text>
          
          <Text style={styles.label}>Phương pháp điều trị</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Phương pháp điều trị"
            value={formData.phuong_phap_dieu_tri}
            onChangeText={(value) => updateFormData('phuong_phap_dieu_tri', value)}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Kết quả điều trị</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Kết quả điều trị"
            value={formData.ket_qua_dieu_tri}
            onChangeText={(value) => updateFormData('ket_qua_dieu_tri', value)}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Số ngày điều trị</Text>
          <TextInput
            style={styles.input}
            placeholder="Số ngày"
            value={formData.so_ngay_dieu_tri}
            onChangeText={(value) => updateFormData('so_ngay_dieu_tri', value)}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Ghi chú của bác sĩ</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ghi chú thêm"
            value={formData.ghi_chu_bac_si}
            onChangeText={(value) => updateFormData('ghi_chu_bac_si', value)}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>File đính kèm</Text>
          <Text style={styles.sectionDescription}>
            Thêm hình ảnh, kết quả xét nghiệm, đơn thuốc hoặc tài liệu liên quan
          </Text>
          
          <View style={styles.fileButtonsContainer}>
            <TouchableOpacity style={styles.fileButton} onPress={showImagePickerOptions}>
              <Text style={styles.fileButtonIcon}>📷</Text>
              <Text style={styles.fileButtonText}>Thêm hình ảnh</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.fileButton} onPress={pickDocument}>
              <Text style={styles.fileButtonIcon}>📄</Text>
              <Text style={styles.fileButtonText}>Thêm tài liệu</Text>
            </TouchableOpacity>
          </View>

          {attachedFiles.length > 0 && (
            <View style={styles.filesContainer}>
              <Text style={styles.filesTitle}>File đã chọn ({attachedFiles.length})</Text>
              <FlatList
                data={attachedFiles}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <View style={styles.fileItem}>
                    {item.type?.includes('image') ? (
                      <TouchableOpacity onPress={() => viewImage(item.uri)}>
                        <Image source={{ uri: item.uri }} style={styles.filePreview} />
                        <View style={styles.viewImageOverlay}>
                          <Ionicons name="eye" size={16} color="white" />
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.fileIconContainer}>
                        <Text style={styles.fileIcon}>{getFileIcon(item.type)}</Text>
                      </View>
                    )}
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.fileSize}>
                        {item.size ? `${(item.size / 1024).toFixed(1)} KB` : 'Không rõ kích thước'}
                      </Text>
                      {uploadingFiles.includes(item.name) && (
                        <Text style={styles.uploadingText}>Đang tải lên...</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.removeFileButton}
                      onPress={() => removeFile(index)}
                      disabled={uploadingFiles.includes(item.name)}
                    >
                      <Ionicons name="close-circle" size={24} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                )}
                scrollEnabled={false}
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Toa thuốc</Text>
          
          {prescription.map((item, index) => (
            <View key={index} style={styles.prescriptionItem}>
              <View style={styles.prescriptionHeader}>
                <Text style={styles.prescriptionTitle}>Thuốc {index + 1}</Text>
                {prescription.length > 1 && (
                  <TouchableOpacity 
                    onPress={() => removePrescriptionItem(index)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>Xóa</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.label}>Tên thuốc</Text>
              <TextInput
                style={styles.input}
                placeholder="Tên thuốc"
                value={item.ten_thuoc}
                onChangeText={(value) => updatePrescriptionItem(index, 'ten_thuoc', value)}
              />

              <Text style={styles.label}>Liều dùng</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: 500mg"
                value={item.lieu_dung}
                onChangeText={(value) => updatePrescriptionItem(index, 'lieu_dung', value)}
              />

              <Text style={styles.label}>Số lượng</Text>
              <TextInput
                style={styles.input}
                placeholder="Số viên/gói"
                value={item.so_luong}
                onChangeText={(value) => updatePrescriptionItem(index, 'so_luong', value)}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Cách dùng</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ví dụ: Uống sau ăn, ngày 2 lần"
                value={item.cach_dung}
                onChangeText={(value) => updatePrescriptionItem(index, 'cach_dung', value)}
                multiline
                numberOfLines={2}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addPrescriptionItem}>
            <Text style={styles.addButtonText}>+ Thêm thuốc</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Đang lưu...' : 'Lưu hồ sơ'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Image Viewer Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Xem hình ảnh</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowImageModal(false)}
              >
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            {selectedImage && (
              <ScrollView
                style={styles.modalContent}
                contentContainerStyle={styles.modalContentContainer}
                maximumZoomScale={3}
                minimumZoomScale={1}
              >
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              </ScrollView>
            )}
            <View style={styles.modalFooter}>
              <Text style={styles.modalHint}>
                💡 Nhấn và giữ để phóng to/thu nhỏ
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
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
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    marginBottom: 5,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#666',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  prescriptionItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  prescriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  removeButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  fileButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  fileButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  fileButtonIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  fileButtonText: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '500',
  },
  filesContainer: {
    marginTop: 10,
  },
  filesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  viewImageOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  fileIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  fileIcon: {
    fontSize: 32,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
  },
  uploadingText: {
    fontSize: 11,
    color: '#2196F3',
    fontStyle: 'italic',
    marginTop: 2,
  },
  removeFileButton: {
    padding: 4,
  },
  removeFileText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '95%',
    height: '90%',
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  modalFooter: {
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
})