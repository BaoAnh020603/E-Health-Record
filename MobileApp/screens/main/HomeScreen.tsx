import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { getCurrentUserProfile } from '../../services/auth'
import { getMedicalRecordsStats } from '../../services/medicalRecords'
import { getWelcomeData, showWelcomeMessage, getDailyHealthTip, WelcomeData } from '../../services/welcomeService'
import { getActiveReminders } from '../../services/medicationReminderService'
import { UserProfile } from '../../lib/supabase'
import NotificationBadge from '../../components/NotificationBadge'

interface Stats {
  totalRecords: number
  byType: Record<string, number>
  recentRecords: any[]
}

export default function HomeScreen({ navigation }: any) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [welcomeData, setWelcomeData] = useState<WelcomeData | null>(null)
  const [hasShownWelcome, setHasShownWelcome] = useState(false)
  const [activeRemindersCount, setActiveRemindersCount] = useState(0)

  const loadData = async () => {
    try {
      const [profileResult, statsResult, welcomeResult, remindersResult] = await Promise.all([
        getCurrentUserProfile(),
        getMedicalRecordsStats(),
        getWelcomeData(),
        getActiveReminders()
      ])

      setProfile(profileResult)
      setWelcomeData(welcomeResult)
      
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data)
      }

      // Set active reminders count
      if (remindersResult.success && remindersResult.reminders) {
        setActiveRemindersCount(remindersResult.reminders.length)
      }

      // Show welcome message if appropriate and not already shown
      if (welcomeResult.shouldShowWelcome && !hasShownWelcome && profileResult) {
        setTimeout(() => {
          showWelcomeMessage(welcomeResult, profileResult.ho_ten)
          setHasShownWelcome(true)
        }, 1000) // Delay to let the screen load first
      }
    } catch (error) {
      console.error('Load data error:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      loadData()
    }, [])
  )

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN')
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    const userName = profile?.ho_ten ? profile.ho_ten.split(' ')[0] : 'bạn'
    
    let timeGreeting = ''
    let welcomeMessage = ''
    
    if (hour < 12) {
      timeGreeting = 'Chào buổi sáng'
      welcomeMessage = `Chúc ${userName} một ngày tốt lành!`
    } else if (hour < 18) {
      timeGreeting = 'Chào buổi chiều'
      welcomeMessage = `Hy vọng ${userName} đang có một ngày tuyệt vời!`
    } else {
      timeGreeting = 'Chào buổi tối'
      welcomeMessage = `Chúc ${userName} buổi tối thư giãn!`
    }
    
    return { timeGreeting, welcomeMessage, userName }
  }

  const getWelcomeBackMessage = () => {
    const messages = [
      'Chào mừng bạn trở lại!',
      'Rất vui được gặp lại bạn!',
      'Hôm nay bạn có khỏe không?',
      'Hy vọng bạn đang cảm thấy tốt!',
      'Chúc bạn một ngày khỏe mạnh!'
    ]
    
    // Use a simple hash of the current date to get consistent message for the day
    const today = new Date().toDateString()
    const hash = today.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    return messages[Math.abs(hash) % messages.length]
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang tải...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>{getGreeting().timeGreeting}</Text>
          <Text style={styles.userName}>{profile?.ho_ten || 'Người dùng'}</Text>
          <Text style={styles.welcomeMessage}>{getWelcomeBackMessage()}</Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => navigation.navigate('MedicationReminders')}
        >
          <NotificationBadge size="medium" color="#FFFFFF" iconOnly />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Tổng quan</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="document-text" size={32} color="#2196F3" />
              <Text style={styles.statNumber}>{stats?.totalRecords || 0}</Text>
              <Text style={styles.statLabel}>Hồ sơ</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="medical" size={32} color="#4CAF50" />
              <Text style={styles.statNumber}>{stats?.byType?.['Ngoại trú'] || 0}</Text>
              <Text style={styles.statLabel}>Ngoại trú</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="bed" size={32} color="#FF9800" />
              <Text style={styles.statNumber}>{stats?.byType?.['Nội trú'] || 0}</Text>
              <Text style={styles.statLabel}>Nội trú</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="alert-circle" size={32} color="#F44336" />
              <Text style={styles.statNumber}>{stats?.byType?.['Cấp cứu'] || 0}</Text>
              <Text style={styles.statLabel}>Cấp cứu</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('CreateRecord')}
            >
              <Ionicons name="add-circle" size={40} color="#2196F3" />
              <Text style={styles.actionLabel}>Tạo hồ sơ mới</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Records')}
            >
              <Ionicons name="folder-open" size={40} color="#4CAF50" />
              <Text style={styles.actionLabel}>Xem hồ sơ</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('PrescriptionUpload')}
            >
              <Ionicons name="medical" size={40} color="#00A86B" />
              <Text style={styles.actionLabel}>Phân tích đơn thuốc</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('MedicationReminders')}
            >
            
              <Ionicons name="share-social" size={40} color="#FF9800" />
              <Text style={styles.actionLabel}>Chia sẻ</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('QRScanner')}
            >
              <Ionicons name="qr-code-outline" size={40} color="#9C27B0" />
              <Text style={styles.actionLabel}>Quét QR</Text>
            </TouchableOpacity>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  greeting: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
    textAlign: 'center',
  },
  userName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
  },
  welcomeMessage: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  qrButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 25,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  aiHeaderButton: {
    backgroundColor: '#FF6B6B',
    padding: 10,
    borderRadius: 20,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsContainer: {
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  actionsContainer: {
    marginBottom: 30,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionIconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionLabel: {
    fontSize: 14,
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
  recentContainer: {
    marginBottom: 30,
  },
  recentCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recentInfo: {
    flex: 1,
  },
  recentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiQuickButton: {
    backgroundColor: '#fff0f0',
    borderRadius: 15,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ffe0e0',
  },
  recentDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  recentDiagnosis: {
    fontSize: 16,
    color: '#333',
    marginTop: 5,
  },
  recentHospital: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  viewAllButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  viewAllText: {
    color: 'white',
    fontWeight: 'bold',
  },
  profileContainer: {
    marginBottom: 30,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  profileLabel: {
    fontSize: 14,
    color: '#666',
  },
  profileValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  editProfileButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  editProfileText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  // AI Features Styles
  aiContainer: {
    marginBottom: 30,
  },
  aiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  aiCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  aiIconContainer: {
    backgroundColor: '#f8f9ff',
    borderRadius: 25,
    padding: 15,
    marginBottom: 12,
  },
  aiCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  aiCardDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 10,
  },
  aiCardBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  aiCardBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  analysisPromotionCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginTop: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  analysisPromotionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  analysisPromotionText: {
    flex: 1,
  },
  analysisPromotionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  analysisPromotionSubtitle: {
    fontSize: 13,
    color: '#4CAF50',
    lineHeight: 18,
  },
  aiInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    gap: 10,
  },
  aiInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#2196F3',
    lineHeight: 16,
  },
  aiBanner: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD93D',
  },
  aiBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiBannerText: {
    marginLeft: 12,
    flex: 1,
  },
  aiBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  aiBannerSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  // Enhanced Action Card Styles
  aiActionCard: {
    borderWidth: 2,
    borderColor: '#e8f5e8',
    backgroundColor: '#fafffe',
  },
  aiActionSubtext: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  // AI Tips Section
  aiTipsContainer: {
    marginBottom: 30,
  },
  aiTipCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
  },
  aiTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiTipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  aiTipList: {
    paddingLeft: 8,
  },
  aiTipItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 4,
  },
})