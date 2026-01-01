import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { getMedicalRecord, updateMedicalRecord } from '../../services/medicalRecords'
import { uploadMedicalFile, deleteMedicalFile } from '../../services/fileUpload'
import { generateShareToken } from '../../services/qrService'

export default function EditRecordScreen({ navigation, route }: any) {
  const { recordId } = route.params || {}
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [record, setRecord] = useState<any>(null)
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
  const [prescription, setPrescription] = useState([
    { ten_thuoc: '', lieu_dung: '', so_luong: '', cach_dung: '' }
  ])
  const [files, setFiles] = useState<any[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([])

  useEffect(() => {
    // Validate recordId before attempting to load
    if (!recordId) {
      Alert.alert(
        'Lỗi',
        'Không tìm thấy ID hồ sơ. Vui lòng thử lại.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      )
      return
    }
    loadRecord()
  }, [recordId])

  const loadRecord = async () => {
    try {
      const result = await getMedicalRecord(recordId)
      if (result.success && result.data) {
        const recordData = result.data
        setRecord(recordData)
        
        // Populate form data
        setFormData({
          ngay_kham: formatDateForInput(recordData.ngay_kham),
          ten_benh_vien: recordData.ten_benh_vien || '',
          ten_khoa: recordData.ten_khoa || '',
          bac_si_kham: recordData.bac_si_kham || '',
          ly_do_kham: recordData.ly_do_kham || '',
          chan_doan_vao: recordData.chan_doan_vao || '',
          chan_doan_ra: recordData.chan_doan_ra || '',
          phuong_phap_dieu_tri: recordData.phuong_phap_dieu_tri || '',
          ket_qua_dieu_tri: recordData.ket_qua_dieu_tri || '',
          so_ngay_dieu_tri: recordData.so_ngay_dieu_tri?.toString() || '',
          ghi_chu_bac_si: recordData.ghi_chu_bac_si || '',
          loai_kham: recordData.loai_kham || 'Ngoại trú'
        })

        // Populate prescription data
        if (recordData.toa_thuoc && Array.isArray(recordData.toa_thuoc) && recordData.toa_thuoc.length > 0) {
          setPrescription(recordData.toa_thuoc.map((item: any) => ({
            ten_thuoc: item.ten_thuoc || '',
            lieu_dung: item.lieu_dung || '',
            so_luong: item.so_luong?.toString() || '',
            cach_dung: item.cach_dung || ''
          })))
        }

        // Set files
        setFiles(recordData.files || [])
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể tải hồ sơ')
        navigation.goBack()
      }
    } catch (error) {
      console.error('Load record error:', error)
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tải hồ sơ')
      navigation.goBack()
    } finally {
      setLoading(false)
    }
  }

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const validateDate = (dateString: string): boolean => {
    const formats = [
      /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    ]
    return formats.some(format => format.test(dateString.trim()))
  }

  const convertDateToISO = (dateString: string): string => {
    const trimmed = dateString.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed
    }
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

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0]
        await uploadFile(file)
      }
    } catch (error) {
      console.error('Document picker error:', error)
      Alert.alert('Lỗi', 'Không thể chọn file')
    }
  }

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const image = result.assets[0]
        await uploadFile({
          uri: image.uri,
          name: `image_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: image.fileSize || 0
        })
      }
    } catch (error) {
      console.error('Image picker error:', error)
      Alert.alert('Lỗi', 'Không thể chọn ảnh')
    }
  }

  const uploadFile = async (file: any) => {
    const fileId = Date.now().toString()
    setUploadingFiles(prev => [...prev, fileId])

    try {
      const result = await uploadMedicalFile(recordId, file)
      if (result.success) {
        setFiles(prev => [...prev, result.data])
        Alert.alert('Thành công', 'Tải file lên thành công')
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể tải file lên')
      }
    } catch (error) {
      console.error('Upload error:', error)
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tải file lên')
    } finally {
      setUploadingFiles(prev => prev.filter(id => id !== fileId))
    }
  }

  const deleteFile = async (fileId: string) => {
    Alert.alert(
      'Xóa file',
      'Bạn có chắc chắn muốn xóa file này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteMedicalFile(fileId)
              if (result.success) {
                setFiles(prev => prev.filter(f => f.id !== fileId))
                Alert.alert('Thành công', 'Đã xóa file')
              } else {
                Alert.alert('Lỗi', result.error || 'Không thể xóa file')
              }
            } catch (error) {
              console.error('Delete file error:', error)
              Alert.alert('Lỗi', 'Có lỗi xảy ra khi xóa file')
            }
          }
        }
      ]
    )
  }

  const handleSave = async () => {
    if (!formData.ngay_kham.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập ngày khám')
      return
    }

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

    const validPrescription = prescription.filter(item => 
      item.ten_thuoc.trim() || item.lieu_dung.trim() || item.so_luong.trim() || item.cach_dung.trim()
    ).map(item => ({
      ten_thuoc: item.ten_thuoc.trim(),
      lieu_dung: item.lieu_dung.trim(),
      so_luong: parseInt(item.so_luong) || 0,
      cach_dung: item.cach_dung.trim()
    }))

    setSaving(true)
    try {
      const result = await updateMedicalRecord(recordId, {
        ...formData,
        ngay_kham: isoDate,
        so_ngay_dieu_tri: formData.so_ngay_dieu_tri ? parseInt(formData.so_ngay_dieu_tri) : undefined,
        toa_thuoc: validPrescription.length > 0 ? validPrescription : undefined
      })

      if (result.success) {
        // Generate QR code with updated record
        Alert.alert(
          'Cập nhật thành công',
          'Hồ sơ đã được cập nhật. Bạn có muốn tạo mã QR cho hồ sơ này?',
          [
            { text: 'Không', onPress: () => navigation.goBack() },
            { 
              text: 'Tạo QR', 
              onPress: async () => {
                try {
                  const qrResult = await generateShareToken({
                    includeRecentRecordsOnly: false,
                    recordIds: [recordId],
                    expiresInHours: 24,
                    maxAccessCount: 5
                  })
                  
                  if (qrResult.success) {
                    navigation.navigate('QRCodeDisplay', { 
                      fromEdit: true,
                      recordId: recordId 
                    })
                  } else {
                    Alert.alert('Lỗi', 'Không thể tạo mã QR: ' + qrResult.error)
                    navigation.goBack()
                  }
                } catch (error) {
                  console.error('QR generation error:', error)
                  Alert.alert('Lỗi', 'Có lỗi xảy ra khi tạo mã QR')
                  navigation.goBack()
                }
              }
            }
          ]
        )
      } else {
        Alert.alert('Lỗi', result.error)
      }
    } catch (error) {
      console.error('Save error:', error)
      Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setSaving(false)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('image')) return 'image'
    if (fileType?.includes('pdf')) return 'document-text'
    return 'document'
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
      </View>
    )
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>File đính kèm</Text>
          
          <View style={styles.uploadButtons}>
            <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
              <Ionicons name="document-attach" size={20} color="white" />
              <Text style={styles.uploadButtonText}>Chọn file</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              <Ionicons name="camera" size={20} color="white" />
              <Text style={styles.uploadButtonText}>Chọn ảnh</Text>
            </TouchableOpacity>
          </View>

          {uploadingFiles.length > 0 && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color="#2196F3" />
              <Text style={styles.uploadingText}>Đang tải lên...</Text>
            </View>
          )}

          {files.length > 0 && (
            <View style={styles.filesContainer}>
              <Text style={styles.filesTitle}>Files đã tải lên:</Text>
              {files.map((file, index) => (
                <View key={index} style={styles.fileItem}>
                  <Ionicons 
                    name={getFileIcon(file.file_type)} 
                    size={24} 
                    color="#2196F3" 
                  />
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName}>{file.file_name}</Text>
                    <Text style={styles.fileSize}>
                      {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : 'N/A'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => deleteFile(file.id)}
                    style={styles.deleteFileButton}
                  >
                    <Ionicons name="trash" size={20} color="#dc3545" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Đang lưu...' : 'Cập nhật hồ sơ'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  uploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  uploadingText: {
    marginLeft: 10,
    color: '#666',
  },
  filesContainer: {
    marginTop: 15,
  },
  filesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  deleteFileButton: {
    padding: 8,
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
})