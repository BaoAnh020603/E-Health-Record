/**
 * Prescription Detail Screen - Hiển thị chi tiết dữ liệu theo option
 * UI chuẩn bệnh viện
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import prescriptionOCRService from '../services/prescriptionOCRService';
import type { Medication, Appointment, Reminder } from '../services/prescriptionOCRService';

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

export default function PrescriptionDetailScreen({ route, navigation }: Props) {
  const { optionId, option, analysis } = route.params;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Use _fullData if available, otherwise use analysis directly
      const dataToSend = (analysis as any)._fullData || analysis;
      const result = await prescriptionOCRService.getDataByOption(optionId, dataToSend);
      setData(result);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải dữ liệu');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (optionId) {
      case 'summary':
        return 'Tóm tắt';
      case 'medications':
        return 'Danh sách thuốc';
      case 'appointments':
        return 'Lịch tái khám';
      case 'reminders_today':
        return 'Nhắc nhở hôm nay';
      case 'reminders_week':
        return 'Nhắc nhở 7 ngày tới';
      case 'calendar':
        return 'Lịch uống thuốc';
      case 'instructions':
        return 'Lời dặn bác sĩ';
      default:
        return 'Chi tiết';
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      );
    }

    if (!data) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyText}>Không có dữ liệu</Text>
        </View>
      );
    }

    switch (optionId) {
      case 'medications':
        return renderMedications(data);
      case 'appointments':
        return renderAppointments(data);
      case 'reminders_today':
      case 'reminders_week':
        return renderReminders(data);
      case 'calendar':
        return renderCalendar(data);
      case 'instructions':
        return renderInstructions(data);
      case 'summary':
        return renderSummary(data);
      default:
        return <Text style={styles.text}>Dữ liệu: {JSON.stringify(data, null, 2)}</Text>;
    }
  };

  const renderMedications = (medications: Medication[]) => {
    // Helper function to format array or string
    const formatArray = (value: any) => {
      if (!value) return 'Không có';
      if (Array.isArray(value)) return value.join(', ');
      return String(value);
    };

    return (
      <View>
        <Text style={styles.countText}>Tổng số: {medications.length} loại thuốc</Text>
        {medications.map((med, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.medicationCard}
            onPress={() => {
              Alert.alert(
                med.name,
                `📋 Chi tiết thuốc:\n\n` +
                `💊 Liều lượng: ${formatArray(med.dosage)}\n\n` +
                `⏰ Tần suất: ${med.frequency || 'Không có'}\n\n` +
                `🕐 Thời gian: ${formatArray(med.timing)}\n\n` +
                `📅 Thời hạn: ${med.duration || 'Không có'}\n\n` +
                `📝 Hướng dẫn:\n${formatArray(med.instructions)}`,
                [{ text: 'Đóng' }]
              );
            }}
            activeOpacity={0.7}
          >
            <View style={styles.medicationHeader}>
              <View style={styles.medicationNumber}>
                <Text style={styles.medicationNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.medicationName}>{med.name}</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
            </View>

            {med.dosage && (
              <View style={styles.medicationRow}>
                <Ionicons name="medical" size={16} color={COLORS.primary} />
                <Text style={styles.medicationLabel}>Liều lượng:</Text>
                <Text style={styles.medicationValue}>{formatArray(med.dosage)}</Text>
              </View>
            )}

            {med.frequency && (
              <View style={styles.medicationRow}>
                <Ionicons name="time" size={16} color={COLORS.secondary} />
                <Text style={styles.medicationLabel}>Tần suất:</Text>
                <Text style={styles.medicationValue}>{med.frequency}</Text>
              </View>
            )}

            {med.timing && (
              <View style={styles.medicationRow}>
                <Ionicons name="sunny" size={16} color={COLORS.warning} />
                <Text style={styles.medicationLabel}>Thời gian:</Text>
                <Text style={styles.medicationValue}>{formatArray(med.timing)}</Text>
              </View>
            )}

            {med.duration && (
              <View style={styles.medicationRow}>
                <Ionicons name="calendar" size={16} color={COLORS.info} />
                <Text style={styles.medicationLabel}>Thời hạn:</Text>
                <Text style={styles.medicationValue}>{med.duration}</Text>
              </View>
            )}

            {med.instructions && (
              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsTitle}>Hướng dẫn:</Text>
                {Array.isArray(med.instructions) ? (
                  med.instructions.map((inst, idx) => (
                    <Text key={idx} style={styles.instructionText}>• {inst}</Text>
                  ))
                ) : (
                  <Text style={styles.instructionText}>• {med.instructions}</Text>
                )}
              </View>
            )}
            
            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>Nhấn để xem chi tiết đầy đủ</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderAppointments = (appointments: Appointment[]) => {
    return (
      <View>
        <Text style={styles.countText}>Tổng số: {appointments.length} lịch khám</Text>
        {appointments.map((apt, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.appointmentCard}
            onPress={() => {
              Alert.alert(
                apt.type,
                `📅 Chi tiết lịch khám:\n\n` +
                `📆 Ngày: ${apt.date || 'Không có'}\n\n` +
                `⏰ Giờ: ${apt.time || 'Không có'}\n\n` +
                `📝 Ghi chú: ${apt.notes || 'Không có'}`,
                [
                  { text: 'Đóng' },
                  { 
                    text: 'Tạo nhắc nhở', 
                    onPress: () => {
                      Alert.alert('Thông báo', 'Tính năng đang phát triển');
                    }
                  }
                ]
              );
            }}
            activeOpacity={0.7}
          >
            <View style={styles.appointmentHeader}>
              <Ionicons name="calendar" size={24} color={COLORS.primary} />
              <Text style={styles.appointmentType}>{apt.type}</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
            </View>

            {apt.date && (
              <View style={styles.appointmentRow}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.secondary} />
                <Text style={styles.appointmentLabel}>Ngày:</Text>
                <Text style={styles.appointmentValue}>{apt.date}</Text>
              </View>
            )}

            {apt.time && (
              <View style={styles.appointmentRow}>
                <Ionicons name="time-outline" size={18} color={COLORS.secondary} />
                <Text style={styles.appointmentLabel}>Giờ:</Text>
                <Text style={styles.appointmentValue}>{apt.time}</Text>
              </View>
            )}

            {apt.notes && (
              <View style={styles.notesBox}>
                <Text style={styles.notesTitle}>Ghi chú:</Text>
                <Text style={styles.notesText}>{apt.notes}</Text>
              </View>
            )}
            
            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>Nhấn để xem chi tiết & tạo nhắc nhở</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderReminders = (reminders: { medications: Reminder[]; appointments: Reminder[] }) => {
    const allReminders = [...reminders.medications, ...reminders.appointments].sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );

    return (
      <View>
        <Text style={styles.countText}>Tổng số: {allReminders.length} nhắc nhở</Text>
        {allReminders.map((reminder, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.reminderCard}
            onPress={() => {
              Alert.alert(
                reminder.title,
                `${reminder.type === 'medication' ? '💊' : '📅'} Chi tiết nhắc nhở:\n\n` +
                `📅 Ngày: ${reminder.date}\n\n` +
                `⏰ Giờ: ${reminder.time}\n\n` +
                `📝 Nội dung: ${reminder.message}` +
                (reminder.medicationName ? `\n\n💊 Thuốc: ${reminder.medicationName}` : '') +
                (reminder.appointmentType ? `\n\n🏥 Loại khám: ${reminder.appointmentType}` : ''),
                [
                  { text: 'Đóng' },
                  { 
                    text: 'Đặt nhắc nhở', 
                    onPress: () => {
                      Alert.alert('Thông báo', 'Đã thêm vào lịch nhắc nhở');
                    }
                  }
                ]
              );
            }}
            activeOpacity={0.7}
          >
            <View style={styles.reminderHeader}>
              <Ionicons
                name={reminder.type === 'medication' ? 'medical' : 'calendar'}
                size={24}
                color={reminder.type === 'medication' ? COLORS.primary : COLORS.secondary}
              />
              <View style={styles.reminderHeaderText}>
                <Text style={styles.reminderTitle}>{reminder.title}</Text>
                <Text style={styles.reminderTime}>{reminder.date} • {reminder.time}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
            </View>
            <Text style={styles.reminderMessage}>{reminder.message}</Text>
            
            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>Nhấn để xem chi tiết & đặt nhắc nhở</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderCalendar = (calendar: any) => {
    const dates = Object.keys(calendar).sort();

    return (
      <View>
        <Text style={styles.countText}>Tổng số: {dates.length} ngày</Text>
        {dates.map((date, index) => {
          const dayData = calendar[date];
          const totalCount = dayData.medications.length + dayData.appointments.length;

          return (
            <View key={index} style={styles.calendarCard}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarDate}>{date}</Text>
                <View style={styles.calendarBadge}>
                  <Text style={styles.calendarBadgeText}>{totalCount} nhắc nhở</Text>
                </View>
              </View>

              {dayData.medications.length > 0 && (
                <View style={styles.calendarSection}>
                  <Text style={styles.calendarSectionTitle}>💊 Uống thuốc:</Text>
                  {dayData.medications.map((med: Reminder, idx: number) => (
                    <Text key={idx} style={styles.calendarItem}>
                      {med.time} - {med.medicationName}
                    </Text>
                  ))}
                </View>
              )}

              {dayData.appointments.length > 0 && (
                <View style={styles.calendarSection}>
                  <Text style={styles.calendarSectionTitle}>📅 Tái khám:</Text>
                  {dayData.appointments.map((apt: Reminder, idx: number) => (
                    <Text key={idx} style={styles.calendarItem}>
                      {apt.time} - {apt.appointmentType}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderInstructions = (instructions: string[]) => {
    return (
      <View>
        <Text style={styles.countText}>Tổng số: {instructions.length} lời dặn</Text>
        {instructions.map((instruction, index) => (
          <View key={index} style={styles.instructionCard}>
            <View style={styles.instructionHeader}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderSummary = (summary: any) => {
    return (
      <View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Tổng quan</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Thuốc:</Text>
            <Text style={styles.summaryValue}>{summary.totalMedications}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Lịch khám:</Text>
            <Text style={styles.summaryValue}>{summary.totalAppointments}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Lời dặn:</Text>
            <Text style={styles.summaryValue}>{summary.totalInstructions}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Nhắc nhở:</Text>
            <Text style={styles.summaryValue}>{summary.totalReminders}</Text>
          </View>
          {summary.dateRange && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Khoảng thời gian:</Text>
              <Text style={styles.summaryValue}>
                {summary.dateRange.start} → {summary.dateRange.end}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
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
        <Text style={styles.headerTitle}>{getTitle()}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text
  },
  content: {
    flex: 1,
    padding: 16
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 16
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 16
  },
  countText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 16
  },
  text: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20
  },
  // Medication styles
  medicationCard: {
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
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  medicationNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  medicationNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1
  },
  medicationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  medicationLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 8,
    marginRight: 4
  },
  medicationValue: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1
  },
  instructionsBox: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginTop: 8
  },
  instructionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6
  },
  instructionText: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
    marginBottom: 2
  },
  // Appointment styles
  appointmentCard: {
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
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  appointmentType: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 12
  },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  appointmentLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 8,
    marginRight: 4,
    width: 60
  },
  appointmentValue: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1
  },
  notesBox: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginTop: 8
  },
  notesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6
  },
  notesText: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18
  },
  // Reminder styles
  reminderCard: {
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
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  reminderHeaderText: {
    flex: 1,
    marginLeft: 12
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4
  },
  reminderTime: {
    fontSize: 13,
    color: COLORS.textLight
  },
  reminderMessage: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20
  },
  // Calendar styles
  calendarCard: {
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
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  calendarDate: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text
  },
  calendarBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  calendarBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary
  },
  calendarSection: {
    marginBottom: 12
  },
  calendarSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6
  },
  calendarItem: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 20,
    paddingLeft: 8
  },
  // Instruction styles
  instructionCard: {
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
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  instructionNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary
  },
  // Summary styles
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  summaryLabel: {
    fontSize: 15,
    color: COLORS.textLight
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text
  },
  tapHint: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center'
  },
  tapHintText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: 'italic'
  }
});
