import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  createRemindersFromPrescription,
  type PrescriptionData
} from '../services/medicationReminderService'
import type { MedicalRecord } from '../lib/supabase'

interface Props {
  record: MedicalRecord
  onSuccess?: () => void
}

export default function CreateMedicationReminders({ record, onSuccess }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [userConfirmed, setUserConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check if record has prescription
  if (!record.toa_thuoc || record.toa_thuoc.length === 0) {
    return null
  }

  const handleCreateReminders = async () => {
    if (!userConfirmed) {
      Alert.alert(
        'Xác nhận cần thiết',
        'Bạn cần cam kết rằng đơn thuốc này là theo chỉ định của bác sĩ'
      )
      return
    }

    setLoading(true)

    try {
      // Prepare prescription data
      const prescriptionData: PrescriptionData = {
        record_id: record.id,
        bac_si_ke_don: record.bac_si_kham || 'Bác sĩ',
        benh_vien: record.ten_benh_vien,
        ngay_ke_don: record.ngay_kham,
        chan_doan: record.chan_doan_ra || record.chan_doan_vao,
        medications: record.toa_thuoc.map((med: any) => ({
          ten_thuoc: med.ten_thuoc,
          lieu_dung: med.lieu_dung,
          tan_suat: med.tan_suat || '2 lần/ngày',
          cach_dung: med.cach_dung,
          ghi_chu: med.ghi_chu,
          thoi_gian_uong: med.thoi_gian_uong
        })),
        verified_by_doctor: true, // Đơn thuốc từ hồ sơ bệnh án đã được xác minh
        user_confirmed: userConfirmed
      }

      const result = await createRemindersFromPrescription(prescriptionData)

      if (result.success) {
        Alert.alert(
          'Thành công',
          `Đã tạo ${result.reminders?.length || 0} nhắc nhở uống thuốc`,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowModal(false)
                setUserConfirmed(false)
                onSuccess?.()
              }
            }
          ]
        )
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể tạo nhắc nhở')
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Đã xảy ra lỗi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="notifications-outline" size={20} color="#fff" />
        <Text style={styles.createButtonText}>
          Tạo nhắc nhở uống thuốc
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tạo nhắc nhở uống thuốc</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={24} color="#2196F3" />
                <Text style={styles.infoText}>
                  AI sẽ phân tích đơn thuốc và tạo lịch nhắc nhở thông minh cho bạn
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Thông tin đơn thuốc</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Bác sĩ:</Text>
                  <Text style={styles.value}>{record.bac_si_kham || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Bệnh viện:</Text>
                  <Text style={styles.value}>{record.ten_benh_vien || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Ngày khám:</Text>
                  <Text style={styles.value}>
                    {new Date(record.ngay_kham).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Chẩn đoán:</Text>
                  <Text style={styles.value}>
                    {record.chan_doan_ra || record.chan_doan_vao || 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Danh sách thuốc ({record.toa_thuoc.length})
                </Text>
                {record.toa_thuoc.map((med: any, index: number) => (
                  <View key={index} style={styles.medicineItem}>
                    <Text style={styles.medicineName}>
                      {index + 1}. {med.ten_thuoc}
                    </Text>
                    <Text style={styles.medicineDetail}>
                      Liều dùng: {med.lieu_dung}
                    </Text>
                    {med.tan_suat && (
                      <Text style={styles.medicineDetail}>
                        Tần suất: {med.tan_suat}
                      </Text>
                    )}
                  </View>
                ))}
              </View>

              <View style={styles.warningBox}>
                <Ionicons name="warning" size={24} color="#FF9800" />
                <Text style={styles.warningText}>
                  AI chỉ tạo nhắc nhở, KHÔNG thay đổi chỉ định của bác sĩ. 
                  Liều lượng và cách dùng sẽ được giữ nguyên theo đơn.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.confirmationBox}
                onPress={() => setUserConfirmed(!userConfirmed)}
              >
                <View style={styles.checkbox}>
                  {userConfirmed && (
                    <Ionicons name="checkmark" size={18} color="#4CAF50" />
                  )}
                </View>
                <Text style={styles.confirmationText}>
                  Tôi cam kết rằng đơn thuốc này là theo chỉ định của bác sĩ và 
                  tôi hiểu rằng AI chỉ tạo nhắc nhở, không thay thế ý kiến bác sĩ.
                </Text>
              </TouchableOpacity>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setShowModal(false)
                    setUserConfirmed(false)
                  }}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.confirmButton,
                    (!userConfirmed || loading) && styles.disabledButton
                  ]}
                  onPress={handleCreateReminders}
                  disabled={!userConfirmed || loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>
                      Tạo nhắc nhở
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    margin: 16,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  medicineItem: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  medicineName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  medicineDetail: {
    fontSize: 13,
    color: '#666',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    lineHeight: 20,
  },
  confirmationBox: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 20,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
})
