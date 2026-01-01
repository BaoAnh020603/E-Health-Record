/**
 * Notification Service
 * Quản lý thông báo uống thuốc
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Cấu hình notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface MedicationNotification {
  medicationName: string;
  dosage: string;
  time: string;
  instructions?: string;
}

class NotificationService {
  /**
   * Yêu cầu quyền thông báo
   */
  async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
      }

      // Cấu hình notification channel cho Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('medication', {
          name: 'Nhắc nhở uống thuốc',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#00A86B',
          sound: 'default',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Tạo thông báo uống thuốc ngay lập tức (test)
   */
  async sendImmediateNotification(medication: MedicationNotification) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 Đến giờ uống thuốc',
          body: `${medication.medicationName} - ${medication.dosage}`,
          data: {
            type: 'medication',
            medication: medication,
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'medication',
        },
        trigger: null, // Gửi ngay lập tức
      });

      console.log('✅ Notification sent:', medication.medicationName);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Lên lịch thông báo uống thuốc
   */
  async scheduleMedicationNotification(
    medication: MedicationNotification,
    triggerDate: Date
  ) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('No notification permission');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 Đến giờ uống thuốc',
          body: `${medication.medicationName} - ${medication.dosage}`,
          data: {
            type: 'medication',
            medication: medication,
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'medication',
          badge: 1,
        },
        trigger: {
          date: triggerDate,
          channelId: 'medication',
        },
      });

      console.log('✅ Notification scheduled:', {
        id: notificationId,
        medication: medication.medicationName,
        time: triggerDate.toLocaleString(),
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Lên lịch nhiều thông báo
   */
  async scheduleMedicationReminders(
    medicationName: string,
    dosage: string,
    times: string[], // ['08:00', '12:00', '20:00']
    startDate: Date,
    durationDays: number = 7
  ) {
    try {
      const notificationIds: string[] = [];

      for (let day = 0; day < durationDays; day++) {
        for (const time of times) {
          const [hours, minutes] = time.split(':').map(Number);
          const triggerDate = new Date(startDate);
          triggerDate.setDate(triggerDate.getDate() + day);
          triggerDate.setHours(hours, minutes, 0, 0);

          // Chỉ lên lịch cho tương lai
          if (triggerDate > new Date()) {
            const id = await this.scheduleMedicationNotification(
              {
                medicationName,
                dosage,
                time,
              },
              triggerDate
            );

            if (id) {
              notificationIds.push(id);
            }
          }
        }
      }

      console.log(`✅ Scheduled ${notificationIds.length} notifications for ${medicationName}`);
      return notificationIds;
    } catch (error) {
      console.error('Error scheduling reminders:', error);
      return [];
    }
  }

  /**
   * Hủy thông báo
   */
  async cancelNotification(notificationId: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('✅ Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  /**
   * Hủy tất cả thông báo
   */
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  /**
   * Lấy danh sách thông báo đã lên lịch
   */
  async getScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`📋 ${notifications.length} scheduled notifications`);
      return notifications;
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Đăng ký action buttons cho notification
   */
  async registerNotificationActions() {
    try {
      await Notifications.setNotificationCategoryAsync('medication', [
        {
          identifier: 'taken',
          buttonTitle: '✓ Đã uống',
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: 'skip',
          buttonTitle: '✕ Bỏ qua',
          options: {
            opensAppToForeground: false,
          },
        },
        {
          identifier: 'snooze',
          buttonTitle: '⏰ Nhắc sau 15 phút',
          options: {
            opensAppToForeground: false,
          },
        },
      ]);

      console.log('✅ Notification actions registered');
    } catch (error) {
      console.error('Error registering notification actions:', error);
    }
  }

  /**
   * Xử lý response từ notification
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export default new NotificationService();
