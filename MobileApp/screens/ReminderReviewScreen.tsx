/**
 * Reminder Review Screen
 * Cho phép người dùng xem và điều chỉnh lịch nhắc trước khi lưu
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

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
  border: '#E0E0E0'
};

interface Reminder {
  id?: string;
  type: 'medication' | 'appointment';
  title: string;
  message: string;
  datetime: string;
  date: string;
  time: string;
  enabled: boolean;
  medicationName?: string;
  appointmentType?: string;
  repeatFrequency?: 'once' | 'daily' | 'weekly' | 'custom'; // Thêm tần suất lặp lại
  repeatDays?: number; // Số ngày lặp lại (cho custom)
}

interface Props {
  route: any;
  navigation: any;
}

export default function ReminderReviewScreen({ route, navigation }: Props) {
  const { medications = [], appointments = [] } = route.params;
  
  const [medicationReminders, setMedicationReminders] = useState<Reminder[]>(
    medications.map((r: any, index: number) => ({ 
      ...r, 
      id: `med-${index}`, 
      enabled: true,
      repeatFrequency: 'daily', // Mặc định lặp hàng ngày
      repeatDays: 7 // Mặc định 7 ngày
    }))
  );
  
  const [appointmentReminders, setAppointmentReminders] = useState<Reminder[]>(
    appointments.map((r: any, index: number) => ({ 
      ...r, 
      id: `apt-${index}`, 
      enabled: true,
      repeatFrequency: 'once' // Lịch khám chỉ 1 lần
    }))
  );

  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const totalEnabled = 
    medicationReminders.filter(r => r.enabled).length + 
    appointmentReminders.filter(r => r.enabled).length;

  const handleToggleReminder = (id: string, type: 'medication' | 'appointment') => {
    if (type === 'medication') {
      setMedicationReminders(prev =>
        prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
      );
    } else {
      setAppointmentReminders(prev =>
        prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
      );
    }
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder({ ...reminder });
  };

  const handleSaveEdit = () => {
    if (!editingReminder) return;

    if (editingReminder.type === 'medication') {
      setMedicationReminders(prev =>
        prev.map(r => r.id === editingReminder.id ? editingReminder : r)
      );
    } else {
      setAppointmentReminders(prev =>
        prev.map(r => r.id === editingReminder.id ? editingReminder : r)
      );
    }

    setEditingReminder(null);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && editingReminder) {
      // Lấy ngày local (không dùng toISOString để tránh lệch timezone)
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      setEditingReminder({
        ...editingReminder,
        date: dateStr,
        datetime: `${dateStr}T${editingReminder.time}:00`
      });
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime && editingReminder) {
      const hours = String(selectedTime.getHours()).padStart(2, '0');
      const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      
      setEditingReminder({
        ...editingReminder,
        time: timeStr,
        datetime: `${editingReminder.date}T${timeStr}:00`
      });
    }
  };

  const handleSaveAll = async () => {
    const enabledMeds = medicationReminders.filter(r => r.enabled);
    const enabledApts = appointmentReminders.filter(r => r.enabled);

    if (enabledMeds.length === 0 && enabledApts.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 1 lịch nhắc');
      return;
    }

    Alert.alert(
      'Xác nhận',
      `Bạn muốn lưu ${totalEnabled} lịch nhắc?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Lưu',
          onPress: async () => {
            try {
              // Import supabase và notification service
              const { supabase } = await import('../lib/supabase');
              const notificationService = (await import('../services/notificationService')).default;
              
              // Get current user
              const { data: { user }, error: userError } = await supabase.auth.getUser();
              if (userError || !user) {
                throw new Error('Bạn cần đăng nhập để lưu lịch nhắc');
              }

              // Yêu cầu quyền thông báo
              const hasPermission = await notificationService.requestPermissions();
              if (!hasPermission) {
                Alert.alert(
                  'Cần cấp quyền',
                  'Vui lòng cấp quyền thông báo để nhận nhắc nhở uống thuốc',
                  [{ text: 'OK' }]
                );
                return;
              }

              // Đăng ký action buttons
              await notificationService.registerNotificationActions();

              // Prepare reminders data for database
              const remindersToSave = [
                ...enabledMeds.map(r => ({
                  user_id: user.id,
                  medication_name: r.medicationName || r.title,
                  dosage: r.message.includes('Liều dùng:') 
                    ? r.message.split('Liều dùng:')[1].split('\n')[0].trim() 
                    : 'Theo chỉ định',
                  frequency: 'Tự điều chỉnh',
                  instructions: r.message,
                  reminder_time: r.time,
                  next_reminder_at: r.datetime,
                  doctor_name: 'Từ đơn thuốc OCR',
                  verified_by_doctor: true,
                  user_confirmed: true,
                  is_active: true,
                  total_reminders: 0,
                  completed_count: 0,
                  missed_count: 0
                })),
                // Appointments can be added later if needed
              ];

              // Save to database
              const { data: savedReminders, error: saveError } = await supabase
                .from('medication_reminders')
                .insert(remindersToSave)
                .select();

              if (saveError) {
                console.error('Save error:', saveError);
                throw new Error('Không thể lưu lịch nhắc vào database');
              }

              console.log('✅ Saved reminders:', savedReminders?.length);

              // Schedule notifications cho từng reminder
              let scheduledCount = 0;
              for (const reminder of enabledMeds) {
                try {
                  // Parse datetime
                  const triggerDate = new Date(reminder.datetime);
                  
                  // Chỉ schedule nếu là thời gian tương lai
                  if (triggerDate > new Date()) {
                    const notificationId = await notificationService.scheduleMedicationNotification(
                      {
                        medicationName: reminder.medicationName || reminder.title,
                        dosage: reminder.message.includes('Liều dùng:') 
                          ? reminder.message.split('Liều dùng:')[1].split('\n')[0].trim() 
                          : 'Theo chỉ định',
                        time: reminder.time,
                        instructions: reminder.message
                      },
                      triggerDate
                    );
                    
                    if (notificationId) {
                      scheduledCount++;
                      console.log(`✅ Scheduled notification for ${reminder.medicationName} at ${triggerDate.toLocaleString()}`);
                    }
                  } else {
                    console.log(`⚠️  Skipped past reminder: ${reminder.medicationName} at ${triggerDate.toLocaleString()}`);
                  }
                } catch (error) {
                  console.error(`❌ Error scheduling notification for ${reminder.medicationName}:`, error);
                }
              }

              console.log(`✅ Total notifications scheduled: ${scheduledCount}/${enabledMeds.length}`);

              Alert.alert(
                'Thành công',
                `Đã lưu ${totalEnabled} lịch nhắc và tạo ${scheduledCount} thông báo`,
                [
                  {
                    text: 'Xem lịch nhắc',
                    onPress: () => navigation.navigate('MedicationReminders')
                  },
                  {
                    text: 'Về trang chủ',
                    onPress: () => navigation.navigate('Home')
                  }
                ]
              );
            } catch (error: any) {
              console.error('❌ Save error:', error);
              Alert.alert('Lỗi', error.message || 'Không thể lưu lịch nhắc');
            }
          }
        }
      ]
    );
  };

  const renderReminderCard = (reminder: Reminder) => {
    const isEnabled = reminder.enabled;
    
    return (
      <View
        key={reminder.id}
        style={[
          styles.reminderCard,
          !isEnabled && styles.reminderCardDisabled
        ]}
      >
        <View style={styles.reminderHeader}>
          <View style={styles.reminderIcon}>
            <Ionicons
              name={reminder.type === 'medication' ? 'medical' : 'calendar'}
              size={24}
              color={isEnabled ? (reminder.type === 'medication' ? COLORS.primary : COLORS.secondary) : COLORS.textLight}
            />
          </View>
          <View style={styles.reminderContent}>
            <Text style={[styles.reminderTitle, !isEnabled && styles.textDisabled]}>
              {reminder.title}
            </Text>
            <Text style={[styles.reminderTime, !isEnabled && styles.textDisabled]}>
              {reminder.date} • {reminder.time}
            </Text>
            <Text style={[styles.reminderMessage, !isEnabled && styles.textDisabled]} numberOfLines={2}>
              {reminder.message}
            </Text>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={() => handleToggleReminder(reminder.id!, reminder.type)}
            trackColor={{ false: COLORS.border, true: COLORS.primary + '40' }}
            thumbColor={isEnabled ? COLORS.primary : COLORS.textLight}
          />
        </View>

        {isEnabled && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditReminder(reminder)}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.secondary} />
            <Text style={styles.editButtonText}>Chỉnh sửa</Text>
          </TouchableOpacity>
        )}
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
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xem & điều chỉnh lịch nhắc</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="notifications" size={24} color={COLORS.primary} />
            <Text style={styles.summaryText}>
              Đã chọn <Text style={styles.summaryBold}>{totalEnabled}</Text> lịch nhắc
            </Text>
          </View>
          <Text style={styles.summaryHint}>
            Bật/tắt hoặc chỉnh sửa từng lịch nhắc bên dưới
          </Text>
        </View>

        {/* Medication Reminders */}
        {medicationReminders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              💊 Lịch uống thuốc ({medicationReminders.filter(r => r.enabled).length}/{medicationReminders.length})
            </Text>
            {medicationReminders.map(renderReminderCard)}
          </View>
        )}

        {/* Appointment Reminders */}
        {appointmentReminders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              📅 Lịch tái khám ({appointmentReminders.filter(r => r.enabled).length}/{appointmentReminders.length})
            </Text>
            {appointmentReminders.map(renderReminderCard)}
          </View>
        )}

        {/* Empty State */}
        {medicationReminders.length === 0 && appointmentReminders.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyText}>Không có lịch nhắc nào</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      {(medicationReminders.length > 0 || appointmentReminders.length > 0) && (
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, totalEnabled === 0 && styles.saveButtonDisabled]}
            onPress={handleSaveAll}
            disabled={totalEnabled === 0}
          >
            <Ionicons name="checkmark" size={20} color={COLORS.white} />
            <Text style={styles.saveButtonText}>Lưu {totalEnabled} lịch nhắc</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Edit Modal */}
      <Modal
        visible={editingReminder !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingReminder(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa lịch nhắc</Text>
              <TouchableOpacity onPress={() => setEditingReminder(null)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {editingReminder && (
              <ScrollView>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Tiêu đề</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editingReminder.title}
                    onChangeText={(text) =>
                      setEditingReminder({ ...editingReminder, title: text })
                    }
                    placeholder="Nhập tiêu đề"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Nội dung</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea]}
                    value={editingReminder.message}
                    onChangeText={(text) =>
                      setEditingReminder({ ...editingReminder, message: text })
                    }
                    placeholder="Nhập nội dung"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formGroupHalf}>
                    <Text style={styles.formLabel}>Ngày</Text>
                    <TouchableOpacity
                      style={styles.formInput}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={styles.formInputText}>{editingReminder.date}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formGroupHalf}>
                    <Text style={styles.formLabel}>Giờ</Text>
                    <TouchableOpacity
                      style={styles.formInput}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Text style={styles.formInputText}>{editingReminder.time}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Tần suất lặp lại */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Tần suất lặp lại</Text>
                  <View style={styles.repeatOptions}>
                    <TouchableOpacity
                      style={[
                        styles.repeatOption,
                        editingReminder.repeatFrequency === 'once' && styles.repeatOptionActive
                      ]}
                      onPress={() => setEditingReminder({ ...editingReminder, repeatFrequency: 'once' })}
                    >
                      <Text style={[
                        styles.repeatOptionText,
                        editingReminder.repeatFrequency === 'once' && styles.repeatOptionTextActive
                      ]}>
                        1 lần
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.repeatOption,
                        editingReminder.repeatFrequency === 'daily' && styles.repeatOptionActive
                      ]}
                      onPress={() => setEditingReminder({ ...editingReminder, repeatFrequency: 'daily', repeatDays: 7 })}
                    >
                      <Text style={[
                        styles.repeatOptionText,
                        editingReminder.repeatFrequency === 'daily' && styles.repeatOptionTextActive
                      ]}>
                        Hàng ngày
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.repeatOption,
                        editingReminder.repeatFrequency === 'weekly' && styles.repeatOptionActive
                      ]}
                      onPress={() => setEditingReminder({ ...editingReminder, repeatFrequency: 'weekly' })}
                    >
                      <Text style={[
                        styles.repeatOptionText,
                        editingReminder.repeatFrequency === 'weekly' && styles.repeatOptionTextActive
                      ]}>
                        Hàng tuần
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Số ngày lặp lại (nếu chọn hàng ngày) */}
                {editingReminder.repeatFrequency === 'daily' && (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Số ngày lặp lại</Text>
                    <View style={styles.daysSelector}>
                      {[3, 5, 7, 10, 14, 30].map((days) => (
                        <TouchableOpacity
                          key={days}
                          style={[
                            styles.dayOption,
                            editingReminder.repeatDays === days && styles.dayOptionActive
                          ]}
                          onPress={() => setEditingReminder({ ...editingReminder, repeatDays: days })}
                        >
                          <Text style={[
                            styles.dayOptionText,
                            editingReminder.repeatDays === days && styles.dayOptionTextActive
                          ]}>
                            {days} ngày
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setEditingReminder(null)}
                  >
                    <Text style={styles.modalCancelButtonText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSaveButton}
                    onPress={handleSaveEdit}
                  >
                    <Text style={styles.modalSaveButtonText}>Lưu</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            {showDatePicker && editingReminder && (
              <DateTimePicker
                value={new Date(editingReminder.date)}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}

            {showTimePicker && editingReminder && (
              <DateTimePicker
                value={new Date(`2000-01-01T${editingReminder.time}:00`)}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}
          </View>
        </View>
      </Modal>
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
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  summaryText: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 12
  },
  summaryBold: {
    fontWeight: '700',
    color: COLORS.primary,
    fontSize: 18
  },
  summaryHint: {
    fontSize: 13,
    color: COLORS.textLight,
    marginLeft: 36
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
  reminderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  reminderCardDisabled: {
    opacity: 0.5
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  reminderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  reminderContent: {
    flex: 1,
    marginRight: 12
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4
  },
  reminderTime: {
    fontSize: 13,
    color: COLORS.secondary,
    marginBottom: 4
  },
  reminderMessage: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18
  },
  textDisabled: {
    color: COLORS.textLight
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  editButtonText: {
    fontSize: 14,
    color: COLORS.secondary,
    marginLeft: 6,
    fontWeight: '500'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 16
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center'
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.textLight
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 8
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text
  },
  formGroup: {
    marginBottom: 16
  },
  formGroupHalf: {
    flex: 1
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8
  },
  formInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.white
  },
  formInputText: {
    fontSize: 15,
    color: COLORS.text
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center'
  },
  modalCancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center'
  },
  modalSaveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white
  },
  repeatOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8
  },
  repeatOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.white
  },
  repeatOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  repeatOptionText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500'
  },
  repeatOptionTextActive: {
    color: COLORS.white
  },
  daysSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8
  },
  dayOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white
  },
  dayOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  dayOptionText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500'
  },
  dayOptionTextActive: {
    color: COLORS.white
  }
});
