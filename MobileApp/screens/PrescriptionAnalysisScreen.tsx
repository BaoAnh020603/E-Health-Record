/**
 * Prescription Analysis Screen
 * Hiển thị kết quả phân tích với UI chuẩn bệnh viện
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PrescriptionAnalysis, ViewOption } from '../services/prescriptionOCRService';
import prescriptionOCRService from '../services/prescriptionOCRService';

// Màu chuẩn bệnh viện
const COLORS = {
  primary: '#00A86B',
  secondary: '#0066CC',
  white: '#FFFFFF',
  background: '#F5F9F7',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
  info: '#3498DB',
  border: '#E0E0E0',
  cardBg: '#FFFFFF'
};

interface Props {
  route: any;
  navigation: any;
}

export default function PrescriptionAnalysisScreen({ route, navigation }: Props) {
  const { analysis } = route.params as { analysis: PrescriptionAnalysis };
  const [fullData, setFullData] = useState<any>(analysis); // Use analysis as fullData
  const [loading, setLoading] = useState(false);

  const handleViewOption = async (option: ViewOption) => {
    try {
      // Navigate to detail screen based on option
      navigation.navigate('PrescriptionDetail', {
        optionId: option.id,
        option: option,
        analysis: analysis
      });
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể xem chi tiết');
    }
  };

  const handleCreateReminders = async () => {
    try {
      console.log('🔔 Button clicked - handleCreateReminders');
      console.log('📊 Full analysis object:', JSON.stringify(analysis, null, 2));
      
      // Extract medications and appointments from analysis
      const medications = (analysis as any).medications || [];
      const appointments = (analysis as any).appointments || [];
      
      console.log('📊 Extracted data:', { 
        hasMedications: !!medications.length, 
        hasAppointments: !!appointments.length,
        medicationsCount: medications.length,
        appointmentsCount: appointments.length,
        medications: medications,
        appointments: appointments
      });
      
      if (medications.length === 0 && appointments.length === 0) {
        Alert.alert(
          'Không có dữ liệu', 
          'Không tìm thấy thông tin thuốc trong đơn. Vui lòng thử lại hoặc kiểm tra đơn thuốc.'
        );
        return;
      }

      // Hiển thị thông tin thuốc và yêu cầu xác nhận với cảnh báo nghiêm túc
      const medicationList = medications
      .map((med: any, idx: number) => {
        // Xử lý dosage - có thể là string hoặc array
        const dosageStr = med.dosage 
          ? (Array.isArray(med.dosage) ? med.dosage.join(', ') : med.dosage)
          : 'Chưa có thông tin';
        
        // Xử lý timing - có thể là array
        const timingStr = med.timing && med.timing.length > 0
          ? med.timing.join(', ')
          : 'Bạn cần tự điền';
        
        return `${idx + 1}. ${med.name}\n   • Liều lượng: ${dosageStr}\n   • Tần suất: ${med.frequency || 'Bạn cần tự điền'}\n   • Thời gian: ${timingStr}`;
      })
      .join('\n\n');

    console.log('📋 Medication list prepared:', medicationList);

    Alert.alert(
      '💊 XÁC NHẬN TẠO LỊCH NHẮC',
      `THÔNG TIN THUỐC TỪ ĐƠN:\n\n${medicationList}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `⚠️ CAM KẾT QUAN TRỌNG:\n\n` +
      `Trước khi tiếp tục, bạn cần xác nhận:\n\n` +
      `✓ Đây là đơn thuốc do BÁC SĨ kê đơn\n` +
      `✓ KHÔNG tự ý bịa ra để tạo nhắc nhở\n` +
      `✓ Tôi sẽ TỰ ĐIỀU CHỈNH thời gian uống và tần suất cho chính xác\n` +
      `✓ Tôi hiểu rằng việc dùng thuốc sai cách có thể gây hại cho sức khỏe\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Sau khi đồng ý, bạn sẽ được xem và điều chỉnh lịch nhắc trước khi lưu.`,
      [
        {
          text: 'Hủy bỏ',
          style: 'cancel'
        },
        {
          text: 'Tôi cam kết & Tiếp tục',
          style: 'default',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Call API to create reminders
              const result = await prescriptionOCRService.createReminders(
                medications,
                appointments,
                new Date()
              );
              
              setLoading(false);
              
              // Check if any reminders were created
              const totalReminders = (result.medications?.length || 0) + (result.appointments?.length || 0);
              
              console.log('📊 Reminders created:', {
                medications: result.medications?.length || 0,
                appointments: result.appointments?.length || 0,
                total: totalReminders,
                hasDefaultSchedule: result.summary?.medicationsWithDefaultSchedule > 0
              });
              
              if (totalReminders === 0) {
                // Không có reminder nào được tạo - Cần tạo thủ công
                Alert.alert(
                  '⚠️ Cần bổ sung thông tin',
                  'Không thể tạo lịch nhắc tự động do thiếu thông tin thời gian uống và tần suất.\n\n' +
                  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                  '📋 BẠN CẦN TỰ ĐIỀN:\n\n' +
                  '• Thời gian uống (sáng, trưa, tối)\n' +
                  '• Tần suất (mấy lần/ngày)\n' +
                  '• Thời hạn (bao nhiêu ngày)\n\n' +
                  '⚠️ LƯU Ý: Vui lòng điền theo chỉ định của bác sĩ, KHÔNG tự ý thay đổi!\n\n' +
                  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                  'Bạn có muốn tiếp tục tạo lịch nhắc thủ công không?',
                  [
                    {
                      text: 'Để sau',
                      style: 'cancel'
                    },
                    {
                      text: 'Tạo thủ công',
                      style: 'default',
                      onPress: () => {
                        // Create manual reminders with empty schedule
                        const manualReminders = medications.map((med: any, idx: number) => ({
                          id: `manual-${idx}`,
                          type: 'medication',
                          medicationName: med.name,
                          dosage: med.dosage 
                            ? (Array.isArray(med.dosage) ? med.dosage.join(', ') : med.dosage)
                            : '',
                          datetime: new Date().toISOString(),
                          date: new Date().toISOString().split('T')[0],
                          time: '08:00', // Default time
                          title: `Uống ${med.name}`,
                          message: `⚠️ CẢNH BÁO: Lịch nhắc này cần bạn tự điền thông tin!\n\n` +
                                   `Liều lượng: ${med.dosage || 'Chưa có thông tin'}\n\n` +
                                   `Vui lòng điều chỉnh:\n` +
                                   `• Thời gian uống\n` +
                                   `• Tần suất\n` +
                                   `• Thời hạn\n\n` +
                                   `theo chỉ định của bác sĩ.`,
                          enabled: true,
                          needsManualSetup: true // Flag to show warning
                        }));
                        
                        navigation.navigate('ReminderReview', {
                          medications: manualReminders,
                          appointments: [],
                          isManualMode: true
                        });
                      }
                    }
                  ]
                );
                return;
              }
              
              // Có reminders được tạo - Kiểm tra có thuốc dùng lịch mặc định không
              const hasDefaultSchedule = result.summary?.medicationsWithDefaultSchedule > 0;
              
              if (hasDefaultSchedule) {
                // Có thuốc dùng lịch mặc định - Thông báo cho user
                Alert.alert(
                  '⚠️ Lưu ý',
                  `Đã tạo ${totalReminders} lịch nhắc.\n\n` +
                  `${result.summary.medicationsWithDefaultSchedule} thuốc đang dùng lịch MẶC ĐỊNH (3 lần/ngày: 7:00, 12:00, 20:00) do thiếu thông tin thời gian uống.\n\n` +
                  `Vui lòng xem lại và điều chỉnh cho phù hợp với chỉ định của bác sĩ.`,
                  [
                    {
                      text: 'Xem & Điều chỉnh',
                      style: 'default',
                      onPress: () => {
                        navigation.navigate('ReminderReview', {
                          medications: result.medications || [],
                          appointments: result.appointments || [],
                          hasDefaultSchedule: true,
                          medicationsNeedingReview: result.summary?.medicationsNeedingReview || []
                        });
                      }
                    }
                  ]
                );
              } else {
                // Tất cả thuốc đều có đủ thông tin - Chuyển sang màn hình review
                navigation.navigate('ReminderReview', {
                  medications: result.medications || [],
                  appointments: result.appointments || []
                });
              }
            } catch (error: any) {
              setLoading(false);
              Alert.alert('Lỗi', error.message || 'Không thể tạo lịch nhắc');
            }
          }
        }
      ],
      { cancelable: true }
    );
    } catch (error: any) {
      console.error('❌ Error in handleCreateReminders:', error);
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'warning':
        return COLORS.warning;
      case 'info':
        return COLORS.info;
      default:
        return COLORS.textLight;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return COLORS.error;
      case 'medium':
        return COLORS.warning;
      case 'low':
        return COLORS.info;
      default:
        return COLORS.textLight;
    }
  };

  const getDataSizeBadge = (size: string) => {
    switch (size) {
      case 'large':
        return { text: 'Nhiều dữ liệu', color: COLORS.warning };
      case 'medium':
        return { text: 'Trung bình', color: COLORS.info };
      case 'small':
        return { text: 'Ít dữ liệu', color: COLORS.success };
      default:
        return { text: '', color: COLORS.textLight };
    }
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
        <Text style={styles.headerTitle}>Kết quả phân tích</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="share-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
            <Text style={styles.summaryTitle}>Phân tích thành công!</Text>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{analysis.summary.totalMedications}</Text>
              <Text style={styles.summaryLabel}>Loại thuốc</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{analysis.summary.totalAppointments}</Text>
              <Text style={styles.summaryLabel}>Lịch khám</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{analysis.summary.totalReminders}</Text>
              <Text style={styles.summaryLabel}>Nhắc nhở</Text>
            </View>
          </View>
        </View>

        {/* Insights */}
        {analysis.insights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Phân tích thông minh</Text>
            {analysis.insights.map((insight, index) => (
              <View
                key={index}
                style={[
                  styles.insightCard,
                  { borderLeftColor: getLevelColor(insight.level) }
                ]}
              >
                <View style={styles.insightHeader}>
                  <Text style={styles.insightIcon}>{insight.icon}</Text>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                </View>
                <Text style={styles.insightMessage}>{insight.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Warnings */}
        {analysis.warnings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Cảnh báo</Text>
            {analysis.warnings.map((warning, index) => (
              <View key={index} style={styles.warningCard}>
                <View style={styles.warningHeader}>
                  <Text style={styles.warningIcon}>{warning.icon}</Text>
                  <Text style={styles.warningTitle}>{warning.title}</Text>
                </View>
                <Text style={styles.warningMessage}>{warning.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recommendations */}
        {analysis.recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Khuyến nghị</Text>
            {analysis.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationCard}>
                <View style={styles.recommendationHeader}>
                  <Text style={styles.recommendationIcon}>{rec.icon}</Text>
                  <View style={styles.recommendationTitleContainer}>
                    <Text style={styles.recommendationTitle}>{rec.title}</Text>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(rec.priority) + '20' }
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityText,
                          { color: getPriorityColor(rec.priority) }
                        ]}
                      >
                        {rec.priority.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.recommendationMessage}>{rec.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* View Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👁️ Xem chi tiết</Text>
          {analysis.options.viewOptions.map((option, index) => {
            const sizeBadge = getDataSizeBadge(option.dataSize);
            return (
              <TouchableOpacity
                key={index}
                style={styles.optionCard}
                onPress={() => handleViewOption(option)}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <View style={styles.optionContent}>
                  <View style={styles.optionTitleRow}>
                    <Text style={styles.optionTitle}>{option.label}</Text>
                    {option.count !== undefined && (
                      <View style={styles.countBadge}>
                        <Text style={styles.countText}>{option.count}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                  {sizeBadge.text && (
                    <View style={[styles.sizeBadge, { backgroundColor: sizeBadge.color + '20' }]}>
                      <Text style={[styles.sizeText, { color: sizeBadge.color }]}>
                        {sizeBadge.text}
                      </Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleCreateReminders}
            disabled={loading}
          >
            <Ionicons name="notifications" size={20} color={COLORS.white} />
            <Text style={styles.primaryButtonText}>
              {loading ? 'Đang tạo lịch nhắc...' : 'Tạo lịch nhắc uống thuốc'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.actionHint}>
            Nhấn để tạo lịch nhắc nhở uống thuốc theo đơn
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
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
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 12
  },
  validationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    gap: 6
  },
  validationText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  summaryItem: {
    alignItems: 'center'
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.textLight
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12
  },
  insightCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 8
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1
  },
  insightMessage: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20
  },
  warningCard: {
    backgroundColor: '#FFF9E5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE5B4'
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 8
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.warning,
    flex: 1
  },
  warningMessage: {
    fontSize: 14,
    color: '#8B7500',
    lineHeight: 20
  },
  recommendationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  recommendationIcon: {
    fontSize: 20,
    marginRight: 8,
    marginTop: 2
  },
  recommendationTitleContainer: {
    flex: 1
  },
  recommendationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600'
  },
  recommendationMessage: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  optionIcon: {
    fontSize: 28,
    marginRight: 12
  },
  optionContent: {
    flex: 1
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 8
  },
  countBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary
  },
  optionDescription: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 6
  },
  sizeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  sizeText: {
    fontSize: 11,
    fontWeight: '600'
  },
  actionSection: {
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 4,
    zIndex: 999
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 1000
  },
  primaryButtonDisabled: {
    backgroundColor: COLORS.textLight,
    opacity: 0.6
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 8
  },
  actionHint: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 12
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primary
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8
  }
});
