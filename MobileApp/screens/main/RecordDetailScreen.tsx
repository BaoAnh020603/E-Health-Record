import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  FlatList,
  Linking
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { getMedicalRecord } from '../../services/medicalRecords'
import { MedicalRecord } from '../../lib/supabase'
import { simplifyDoctorNotes } from '../../services/aiMedicalAssistant'
import type { SimplifiedMedicalText } from '../../services/aiMedicalAssistant'

export default function RecordDetailScreen({ route, navigation }: any) {
  const { recordId } = route.params || {}
  const [record, setRecord] = useState<MedicalRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [simplifying, setSimplifying] = useState(false)
  const [showSimplified, setShowSimplified] = useState(false)
  const [simplifiedData, setSimplifiedData] = useState<SimplifiedMedicalText | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)

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
      if (result.success) {
        setRecord(result.data)
      } else {
        Alert.alert('Lỗi', result.error)
      }
    } catch (error) {
      console.error('Load record error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN')
  }

  const viewImage = (uri: string) => {
    setSelectedImage(uri)
    setShowImageModal(true)
  }

  const getFileIcon = (type: string) => {
    if (type?.includes('image')) return 'image'
    if (type?.includes('pdf')) return 'document-text'
    if (type?.includes('word') || type?.includes('document')) return 'document'
    return 'attach'
  }

  const handleSimplifyDiagnosis = async () => {
    if (!record) return

    const technicalText = `
Chẩn đoán vào: ${record.chan_doan_vao || 'Không có'}
Chẩn đoán ra: ${record.chan_doan_ra || 'Không có'}
Phương pháp điều trị: ${record.phuong_phap_dieu_tri || 'Không có'}
Kết quả điều trị: ${record.ket_qua_dieu_tri || 'Không có'}
Ghi chú bác sĩ: ${record.ghi_chu_bac_si || 'Không có'}
    `.trim()

    setSimplifying(true)
    try {
      const result = await simplifyDoctorNotes(technicalText, {
        diagnosis: record.chan_doan_ra || undefined,
        symptoms: record.ly_do_kham ? [record.ly_do_kham] : undefined
      })

      if (result.success && result.data) {
        setSimplifiedData(result.data)
        setShowSimplified(true)
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể đơn giản hóa')
      }
    } catch (error) {
      console.error('Simplify error:', error)
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi xử lý')
    } finally {
      setSimplifying(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang tải...</Text>
      </View>
    )
  }

  if (!record) {
    return (
      <View style={styles.errorContainer}>
        <Text>Không tìm thấy hồ sơ</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.recordCode}>
              Hồ sơ bệnh án
            </Text>
            <Text style={styles.recordCodeSecondary}>
            </Text>
            <Text style={styles.recordDate}>{formatDate(record.ngay_kham)}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.aiButton}
              onPress={handleSimplifyDiagnosis}
              disabled={simplifying}
            >
              {simplifying ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="sparkles" size={20} color="white" />
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => navigation.navigate('EditRecord', { recordId: record.id })}
            >
              <Ionicons name="create" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin khám bệnh</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Bệnh viện:</Text>
          <Text style={styles.value}>{record.ten_benh_vien || 'Chưa có'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Khoa:</Text>
          <Text style={styles.value}>{record.ten_khoa || 'Chưa có'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Bác sĩ:</Text>
          <Text style={styles.value}>{record.bac_si_kham || 'Chưa có'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Loại khám:</Text>
          <Text style={styles.value}>{record.loai_kham || 'Chưa có'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chẩn đoán</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Lý do khám:</Text>
          <Text style={styles.value}>{record.ly_do_kham || 'Chưa có'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Chẩn đoán vào:</Text>
          <Text style={styles.value}>{record.chan_doan_vao || 'Chưa có'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Chẩn đoán ra:</Text>
          <Text style={styles.value}>{record.chan_doan_ra || 'Chưa có'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Điều trị</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Phương pháp:</Text>
          <Text style={styles.value}>{record.phuong_phap_dieu_tri || 'Chưa có'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Kết quả:</Text>
          <Text style={styles.value}>{record.ket_qua_dieu_tri || 'Chưa có'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Số ngày điều trị:</Text>
          <Text style={styles.value}>{record.so_ngay_dieu_tri || 'Chưa có'}</Text>
        </View>
      </View>

      {record.ghi_chu_bac_si && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={24} color="#2196F3" />
            <Text style={styles.sectionTitle}>Ghi chú của bác sĩ</Text>
          </View>
          <View style={styles.doctorNoteCard}>
            <Text style={styles.doctorNoteText}>{record.ghi_chu_bac_si}</Text>
          </View>
        </View>
      )}

      {record.toa_thuoc && record.toa_thuoc.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medical" size={24} color="#2196F3" />
            <Text style={styles.sectionTitle}>Đơn thuốc ({record.toa_thuoc.length} loại)</Text>
          </View>
          {record.toa_thuoc.map((medicine: any, index: number) => (
            <View key={index} style={styles.medicineCard}>
              <View style={styles.medicineHeader}>
                <View style={styles.medicineNumberBadge}>
                  <Text style={styles.medicineNumber}>{index + 1}</Text>
                </View>
                <Text style={styles.medicineName}>{medicine.ten_thuoc || 'Không rõ tên'}</Text>
              </View>
              
              <View style={styles.medicineDetails}>
                {medicine.lieu_dung && (
                  <View style={styles.medicineDetailRow}>
                    <Ionicons name="flask" size={16} color="#666" />
                    <Text style={styles.medicineDetailLabel}>Liều dùng:</Text>
                    <Text style={styles.medicineDetailValue}>{medicine.lieu_dung}</Text>
                  </View>
                )}
                
                {medicine.so_luong && (
                  <View style={styles.medicineDetailRow}>
                    <Ionicons name="layers" size={16} color="#666" />
                    <Text style={styles.medicineDetailLabel}>Số lượng:</Text>
                    <Text style={styles.medicineDetailValue}>{medicine.so_luong} {medicine.so_luong > 1 ? 'viên/gói' : 'viên/gói'}</Text>
                  </View>
                )}
                
                {medicine.cach_dung && (
                  <View style={styles.medicineDetailRow}>
                    <Ionicons name="information-circle" size={16} color="#666" />
                    <Text style={styles.medicineDetailLabel}>Cách dùng:</Text>
                    <Text style={styles.medicineDetailValue}>{medicine.cach_dung}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {record.files && record.files.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>File đính kèm ({record.files.length})</Text>
          <FlatList
            data={record.files}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.fileItem}
                onPress={() => {
                  // Check if file has valid public URL
                  if (!item.public_url) {
                    Alert.alert(
                      'Không thể xem file', 
                      'File này chưa được tải lên hoàn toàn hoặc đường dẫn không hợp lệ.\n\n' +
                      `Trạng thái: ${item.trang_thai || 'unknown'}\n` +
                      `Mô tả: ${item.description || 'Không có mô tả'}`,
                      [{ text: 'OK' }]
                    )
                    return
                  }

                  if (item.file_type?.includes('image')) {
                    viewImage(item.public_url)
                  } else if (item.file_type?.includes('pdf')) {
                    // Open PDF in browser
                    if (!item.public_url) {
                      Alert.alert('Lỗi', 'Không tìm thấy đường dẫn file')
                      return
                    }
                    
                    const pdfUrl = item.public_url
                    Alert.alert(
                      'Xem file PDF', 
                      `File: ${item.file_name}\n\nBạn muốn mở file PDF này?`,
                      [
                        { text: 'Hủy', style: 'cancel' },
                        { 
                          text: 'Mở PDF', 
                          onPress: async () => {
                            try {
                              const canOpen = await Linking.canOpenURL(pdfUrl)
                              if (canOpen) {
                                await Linking.openURL(pdfUrl)
                              } else {
                                Alert.alert('Lỗi', 'Không thể mở file PDF')
                              }
                            } catch (error) {
                              Alert.alert('Lỗi', 'Không thể mở file PDF')
                            }
                          }
                        }
                      ]
                    )
                  } else {
                    if (!item.public_url) {
                      Alert.alert('Lỗi', 'Không tìm thấy đường dẫn file')
                      return
                    }
                    
                    const fileUrl = item.public_url
                    Alert.alert(
                      'Xem file', 
                      `File: ${item.file_name}\n\nTính năng xem file Word/Excel đang được phát triển.\n\nBạn có thể tải file về từ URL:\n${fileUrl}`,
                      [
                        { text: 'OK' },
                        { 
                          text: 'Mở trong Browser', 
                          onPress: async () => {
                            try {
                              await Linking.openURL(fileUrl)
                            } catch (error) {
                              Alert.alert('Lỗi', 'Không thể mở file')
                            }
                          }
                        }
                      ]
                    )
                  }
                }}
              >
                {item.file_type?.includes('image') && item.public_url ? (
                  <View style={styles.filePreviewContainer}>
                    <Image 
                      source={{ uri: item.public_url }} 
                      style={styles.filePreview}
                      onError={(error) => {
                        console.error('Image load error:', error.nativeEvent.error)
                        console.log('Failed URL:', item.public_url)
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', item.file_name)
                      }}
                    />
                    <View style={styles.viewImageOverlay}>
                      <Ionicons name="eye" size={16} color="white" />
                    </View>
                  </View>
                ) : (
                  <View style={styles.fileIconContainer}>
                    <Ionicons name={getFileIcon(item.file_type)} size={32} color="#2196F3" />
                  </View>
                )}
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={2}>
                    {item.file_name}
                  </Text>
                  <Text style={styles.fileSize}>
                    {item.file_size ? `${(item.file_size / 1024).toFixed(1)} KB` : 'Không rõ kích thước'}
                  </Text>
                  <Text style={styles.fileType}>{item.loai_file || 'File đính kèm'}</Text>
                  {item.trang_thai !== 'active' && item.trang_thai !== 'deleted' && (
                    <Text style={styles.fileStatusWarning}>
                      ⚠️ {item.trang_thai === 'pending' ? 'Đang xử lý' : 'Lỗi tải lên'}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            )}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* AI Simplified Modal */}
      <Modal
        visible={showSimplified}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowSimplified(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <Ionicons name="sparkles" size={24} color="#2196F3" />
              <Text style={styles.modalTitle}>Giải thích dễ hiểu</Text>
            </View>
            <TouchableOpacity onPress={() => setShowSimplified(false)}>
              <Ionicons name="close" size={28} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {simplifiedData && (
              <>
                <View style={styles.simplifiedCard}>
                  <Text style={styles.simplifiedTitle}>Tóm tắt</Text>
                  <Text style={styles.simplifiedText}>{simplifiedData.simplifiedText}</Text>
                </View>

                <View style={styles.simplifiedCard}>
                  <Text style={styles.simplifiedTitle}>Các điểm chính</Text>
                  {simplifiedData.keyPoints.map((point, index) => (
                    <View key={index} style={styles.keyPoint}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.keyPointText}>{point}</Text>
                    </View>
                  ))}
                </View>

                {simplifiedData.medicalTermsExplained.length > 0 && (
                  <View style={styles.simplifiedCard}>
                    <Text style={styles.simplifiedTitle}>Thuật ngữ y tế</Text>
                    {simplifiedData.medicalTermsExplained.map((term, index) => (
                      <View key={index} style={styles.termCard}>
                        <Text style={styles.termName}>{term.term}</Text>
                        <Text style={styles.termExplanation}>{term.explanation}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.imageModalOverlay}>
          <View style={styles.imageModalContainer}>
            <View style={styles.imageModalHeader}>
              <Text style={styles.imageModalTitle}>Xem hình ảnh</Text>
              <TouchableOpacity
                style={styles.imageModalCloseButton}
                onPress={() => setShowImageModal(false)}
              >
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            {selectedImage && (
              <ScrollView
                style={styles.imageModalContent}
                contentContainerStyle={styles.imageModalContentContainer}
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
            <View style={styles.imageModalFooter}>
              <Text style={styles.imageModalHint}>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    padding: 10,
  },
  recordCode: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  recordCodeSecondary: {
    color: 'white',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  recordDate: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
    marginTop: 5,
  },
  section: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#666',
    width: 120,
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  // Medicine/Prescription styles
  medicineCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  medicineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  medicineNumberBadge: {
    backgroundColor: '#4CAF50',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicineNumber: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  medicineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#263238',
    flex: 1,
  },
  medicineDetails: {
    gap: 8,
  },
  medicineDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  medicineDetailLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    width: 85,
  },
  medicineDetailValue: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    lineHeight: 18,
  },
  // Doctor note styles
  doctorNoteCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  doctorNoteText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  filePreviewContainer: {
    position: 'relative',
  },
  filePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  viewImageOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  fileIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#263238',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    color: '#546E7A',
    marginBottom: 2,
  },
  fileType: {
    fontSize: 11,
    color: '#2196F3',
    fontStyle: 'italic',
  },
  fileStatusWarning: {
    fontSize: 11,
    color: '#FF9800',
    fontStyle: 'italic',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  aiButton: {
    backgroundColor: '#2E7D32', // Medical green for AI features
    borderRadius: 25,
    padding: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Hospital clean background
  },
  modalHeader: {
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#E3F2FD', // Light medical blue
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 15,
  },
  simplifiedCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  simplifiedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 12,
  },
  simplifiedText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  keyPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  keyPointText: {
    flex: 1,
    fontSize: 14,
    color: '#263238', // Professional dark gray
    lineHeight: 20,
  },
  termCard: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E3F2FD', // Light medical blue
  },
  termName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#263238', // Professional dark gray
    marginBottom: 4,
  },
  termExplanation: {
    fontSize: 14,
    color: '#546E7A', // Medical gray
    lineHeight: 20,
  },
  // Image Modal styles
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContainer: {
    width: '95%',
    height: '90%',
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
  },
  imageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  imageModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  imageModalCloseButton: {
    padding: 5,
  },
  imageModalContent: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageModalContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  imageModalFooter: {
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  imageModalHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
})