/**
 * Notification Badge Component
 * Icon thông báo nhỏ hiển thị số lượng lịch nhắc uống thuốc
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

interface NotificationBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
  color?: string;
  iconOnly?: boolean;
}

export default function NotificationBadge({ 
  size = 'medium', 
  showCount = true,
  color = '#00A86B',
  iconOnly = false
}: NotificationBadgeProps) {
  const [reminderCount, setReminderCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminderCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchReminderCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchReminderCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setReminderCount(0);
        setLoading(false);
        return;
      }

      // Get today's active reminders
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('medication_reminders')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gte('next_reminder_at', `${today}T00:00:00`)
        .lte('next_reminder_at', `${today}T23:59:59`);

      if (error) throw error;
      
      setReminderCount(data?.length || 0);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reminder count:', error);
      setReminderCount(0);
      setLoading(false);
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          icon: 16,
          badge: styles.badgeSmall,
          text: styles.textSmall
        };
      case 'large':
        return {
          container: styles.containerLarge,
          icon: 28,
          badge: styles.badgeLarge,
          text: styles.textLarge
        };
      default:
        return {
          container: styles.containerMedium,
          icon: 20,
          badge: styles.badgeMedium,
          text: styles.textMedium
        };
    }
  };

  const sizeStyles = getSizeStyles();

  if (loading) {
    return null;
  }

  if (iconOnly) {
    return (
      <View style={[styles.iconOnlyContainer, sizeStyles.container]}>
        <Ionicons name="notifications" size={sizeStyles.icon} color={color} />
        {reminderCount > 0 && showCount && (
          <View style={[styles.badge, sizeStyles.badge, { backgroundColor: '#E74C3C' }]}>
            <Text style={[styles.badgeText, sizeStyles.text]}>
              {reminderCount > 99 ? '99+' : reminderCount}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, sizeStyles.container]}>
      <Ionicons name="notifications" size={sizeStyles.icon} color={color} />
      {reminderCount > 0 && showCount && (
        <View style={[styles.badge, sizeStyles.badge, { backgroundColor: '#E74C3C' }]}>
          <Text style={[styles.badgeText, sizeStyles.text]}>
            {reminderCount > 99 ? '99+' : reminderCount}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconOnlyContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  containerSmall: {
    width: 24,
    height: 24
  },
  containerMedium: {
    width: 32,
    height: 32
  },
  containerLarge: {
    width: 40,
    height: 40
  },
  badge: {
    position: 'absolute',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF'
  },
  badgeSmall: {
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4
  },
  badgeMedium: {
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5
  },
  badgeLarge: {
    top: -6,
    right: -10,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  textSmall: {
    fontSize: 9
  },
  textMedium: {
    fontSize: 10
  },
  textLarge: {
    fontSize: 12
  }
});
