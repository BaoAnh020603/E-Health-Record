import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  getActiveReminders,
  deleteReminder,
  type MedicationReminder
} from '../../services/medicationReminderService'
import notificationService from '../../services/notificationService'

export default function MedicationRemindersScreen() {
  const [reminders, setReminders] = useState<MedicationReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadData()
    
    // Auto refresh mỗi phút để cập nhật danh sách
    const interval = setInterval(() => {
      loadData()
    }, 60000) // 60 seconds
    
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const remindersResult = await getActiveReminders()

      if (remindersResult.success && remindersResult.reminders) {
        // Lọc chỉ lấy nhắc nhở trong tương lai
        const now = new Date()
        const futureReminders = remindersResult.reminders.filter((reminder: MedicationReminder) => {
          if (!reminder.next_reminder_at) return false
          const reminderTime = new Date(reminder.next_reminder_at)
          return reminderTime > now
        })
        
        setReminders(futureReminders)
      }
    } catch (error) {
      console.error('Load data error:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const handleDelete = (reminder: MedicationReminder) => {
    Alert.alert(
      'Xóa nhắc nhở',
      `Bạn có chắc muốn xóa nhắc nhở cho ${reminder.medication_name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteReminder(reminder.id)
            if (result.success) {
              loadData()
            } else {
              Alert.alert('Lỗi', result.error || 'Không thể xóa')
            }
          }
        }
      ]
    )
  }

  const renderReminder = (reminder: MedicationReminder) => {
    // Format date: DD/MM/YYYY - FIX timezone issue
    const formatDate = (dateString: string | undefined) => {
      if (!dateString) return 'N/A';
      
      // Parse date string và lấy phần date only (YYYY-MM-DD)
      const dateOnly = dateString.split('T')[0]; // "2024-12-30"
      const [year, month, day] = dateOnly.split('-');
      
      return `${day}/${month}/${year}`;
    };

    return (
      <View key={reminder.id} style={styles.reminderCard}>
        <View style={styles.cardContent}>
          <View style={styles.reminderInfo}>
            <Text style={styles.medicationName}>{reminder.medication_name}</Text>
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.timeText}>{reminder.reminder_time}</Text>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.dateText}>
                {formatDate(reminder.next_reminder_at)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(reminder)}
          >
            <Ionicons name="trash-outline" size={22} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Đang tải...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Nhắc nhở uống thuốc</Text>
          <Text style={styles.subtitle}>
            {reminders.length} nhắc nhở đang hoạt động
          </Text>
        </View>

        {reminders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="medical-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có nhắc nhở nào</Text>
            <Text style={styles.emptySubtext}>
            </Text>
          </View>
        ) : (
          reminders.map(renderReminder)
        )}

        <View style={styles.disclaimer}>
          <Ionicons name="information-circle" size={20} color="#FF9800" />
          <Text style={styles.disclaimerText}>
            Nhắc nhở này dựa trên đơn thuốc của bác sĩ. Không tự ý thay đổi liều
            lượng hoặc ngừng thuốc. Hãy tham khảo bác sĩ nếu có thắc mắc.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  reminderCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  separator: {
    fontSize: 14,
    color: '#999',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  disclaimer: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    lineHeight: 20,
  },
})
