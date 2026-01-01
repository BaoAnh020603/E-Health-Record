/**
 * Reminder Confirmation Screen
 * Màn hình xác nhận và cam kết trước khi tạo lịch nhắc
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#00A86B',
  white: '#FFFFFF',
  background: '#F5F9F7',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  error: '#E74C3C',
  warning: '#F39C12',
  border: '#E0E0E0',
  cardBg: '#FFFFFF'
};

interface Props {
  route: any;
  navigation: any;
}

export default function ReminderConfirmationScreen({ route, navigation }: Props) {
  const { medications, appointments, onConfirm } = route.params;
  
  const [confirmations, setConfirmations] = useState({
    isPrescribed: false,
    notSelfMedicate: false,
    willAdjust: false,
    understandRisk: false
  });

  const allConfirmed = Object.values(confirmations).every(v => v);

  const handleConfirm = () => {
    if (!allConfirmed) {
      Alert.alert(
        'Chưa đầy đủ',
        'Vui lòng xác nhận tất cả các cam kết trước khi tiếp tục.'
      );
      return;
    }

    // Call the onConfirm callback
    if (onConfirm) {
      onConfirm();
    }
    
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác nhận tạo lịch nhắc</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={32} color={COLORS.error} />
          <Text style={styles.warningTitle}>CAM KẾT QUAN TRỌNG</Text>
          <Text style={styles.warningText}>
            Vui lòng đọc kỹ và xác nhận các cam kết bên dưới trước khi tạo lịch nhắc uống thuốc.
          </Text>
        </View>

        {/* Medication List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💊 Danh sách thuốc ({medications.length})</Text>
          {medications.map((med: any, idx: number) => (
            <View key={idx} style={styles.medicationCard}>
              <View style={styles.medicationHeader}>
                <Text style={styles.medicationNumber}>{idx + 1}</Text>
                <Text style={styles.medicationName}>{med.name}</Text>
              </View>
              <View style={styles.medicationDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="medical" size={16} color={COLORS.textLight} />
                  <Text style={styles.detailText}>
                    Liều lượng: {med.dosage 
                      ? (Array.isArray(med.dosage) ? med.dosage.join(', ') : med.dosage)
                      : 'Chưa có thông tin'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="time" size={16} color={COLORS.textLight} />
                  <Text style={styles.detailText}>
                    Tần suất: {med.frequency || 'Bạn cần tự điền'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="sunny" size={16} color={COLORS.textLight} />
                  <Text style={styles.detailText}>
                    Thời gian: {med.timing?.join(', ') || 'Bạn cần tự điền'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Commitments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✓ Cam kết của bạn</Text>
          
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setConfirmations({ ...confirmations, isPrescribed: !confirmations.isPrescribed })}
          >
            <View style={[styles.checkbox, confirmations.isPrescribed && styles.checkboxChecked]}>
              {confirmations.isPrescribed && (
                <Ionicons name="checkmark" size={18} color={COLORS.white} />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              Đây là đơn thuốc do <Text style={styles.bold}>BÁC SĨ kê đơn</Text>, không phải tự ý mua thuốc
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setConfirmations({ ...confirmations, notSelfMedicate: !confirmations.notSelfMedicate })}
          >
            <View style={[styles.checkbox, confirmations.notSelfMedicate && styles.checkboxChecked]}>
              {confirmations.notSelfMedicate && (
                <Ionicons name="checkmark" size={18} color={COLORS.white} />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              Tôi <Text style={styles.bold}>KHÔNG tự ý bịa ra</Text> để tạo nhắc nhở uống thuốc
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setConfirmations({ ...confirmations, willAdjust: !confirmations.willAdjust })}
          >
            <View style={[styles.checkbox, confirmations.willAdjust && styles.checkboxChecked]}>
              {confirmations.willAdjust && (
                <Ionicons name="checkmark" size={18} color={COLORS.white} />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              Tôi sẽ <Text style={styles.bold}>TỰ ĐIỀU CHỈNH</Text> thời gian uống và tần suất cho chính xác theo chỉ định của bác sĩ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setConfirmations({ ...confirmations, understandRisk: !confirmations.understandRisk })}
          >
            <View style={[styles.checkbox, confirmations.understandRisk && styles.checkboxChecked]}>
              {confirmations.understandRisk && (
                <Ionicons name="checkmark" size={18} color={COLORS.white} />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              Tôi hiểu rằng <Text style={styles.bold}>việc dùng thuốc sai cách</Text> có thể gây hại cho sức khỏe
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Sau khi xác nhận, bạn sẽ được chuyển đến màn hình xem và điều chỉnh lịch nhắc trước khi lưu.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirmButton, !allConfirmed && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={!allConfirmed}
        >
          <Text style={styles.confirmButtonText}>
            {allConfirmed ? 'Tôi cam kết & Tiếp tục' : 'Vui lòng xác nhận tất cả'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: 50
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text
  },
  content: {
    flex: 1,
    padding: 16
  },
  warningBanner: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.warning
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.error,
    marginTop: 12,
    marginBottom: 8
  },
  warningText: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 20
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12
  },
  medicationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  medicationNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: 'bold',
    marginRight: 12
  },
  medicationName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text
  },
  medicationDetails: {
    gap: 8
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textLight
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    marginLeft: 12,
    lineHeight: 22
  },
  bold: {
    fontWeight: 'bold',
    color: COLORS.error
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.primary
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20
  },
  bottomBar: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  confirmButtonDisabled: {
    backgroundColor: COLORS.textLight,
    opacity: 0.5
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600'
  }
});
