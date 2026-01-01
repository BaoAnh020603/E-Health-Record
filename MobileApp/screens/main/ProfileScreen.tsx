import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { getCurrentUserProfile, signOut } from '../../services/auth'
import { UserProfile } from '../../lib/supabase'

export default function ProfileScreen({ navigation }: any) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      loadProfile()
    }, [])
  )

  const loadProfile = async () => {
    try {
      const result = await getCurrentUserProfile()
      
      if (!result) {
        // Could redirect to profile setup here if needed
      }
      
      setProfile(result)
    } catch (error: any) {
      console.error('ProfileScreen: Load profile error:', error)
      
      // Handle specific database errors
      if (error.message?.includes('users_profile')) {
        Alert.alert(
          'Lỗi cơ sở dữ liệu',
          'Bảng users_profile chưa được tạo. Vui lòng chạy migration trong Supabase Dashboard:\n\n' +
          'SQL Editor > New Query > Paste nội dung từ file:\n' +
          'Backend/supabase/functions/migrations/008_create_users_profile_table.sql',
          [
            { text: 'OK' }
          ]
        )
      } else {
        Alert.alert(
          'Lỗi',
          'Không thể tải thông tin cá nhân. Vui lòng thử lại sau.',
          [
            { text: 'Thử lại', onPress: loadProfile },
            { text: 'Hủy', style: 'cancel' }
          ]
        )
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadProfile()
  }

  const handleSignOut = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            const result = await signOut()
            if (!result.success) {
              Alert.alert('Lỗi', 'Không thể đăng xuất')
            }
          }
        }
      ]
    )
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa cập nhật'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Ngày không hợp lệ'
    
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang tải...</Text>
      </View>
    )
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={50} color="white" />
        </View>
        <Text style={styles.name}>{profile?.ho_ten || 'Người dùng'}</Text>
        <Text style={styles.role}>Bệnh nhân</Text>
        
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="create-outline" size={16} color="white" />
          <Text style={styles.editButtonText}>Chỉnh sửa</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="card" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Số CCCD</Text>
              <Text style={styles.infoValue}>{profile?.so_cccd || 'Chưa cập nhật'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Ngày sinh</Text>
              <Text style={styles.infoValue}>
                {formatDate(profile?.ngay_sinh)} 
                {/* Debug: {profile?.ngay_sinh} */}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="people" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Giới tính</Text>
              <Text style={styles.infoValue}>{profile?.gioi_tinh || 'Chưa cập nhật'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Số điện thoại</Text>
              <Text style={styles.infoValue}>{profile?.dien_thoai || 'Chưa cập nhật'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profile?.email || 'Chưa cập nhật'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Địa chỉ</Text>
              <Text style={styles.infoValue}>{profile?.dia_chi || 'Chưa cập nhật'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="water" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nhóm máu</Text>
              <Text style={styles.infoValue}>{profile?.nhom_mau || 'Chưa cập nhật'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin BHYT</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Mã thẻ BHYT</Text>
              <Text style={styles.infoValue}>{profile?.ma_the_bhyt || 'Chưa cập nhật'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Ngày cấp</Text>
              <Text style={styles.infoValue}>{formatDate(profile?.ngay_cap_bhyt)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Ngày hết hạn</Text>
              <Text style={styles.infoValue}>{formatDate(profile?.ngay_het_han_bhyt)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nơi đăng ký khám bệnh</Text>
              <Text style={styles.infoValue}>{profile?.noi_dang_ky_kham_benh || 'Chưa cập nhật'}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#F44336" />
          <Text style={styles.signOutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
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
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 50,
    paddingBottom: 30,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  name: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  role: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
    marginTop: 5,
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoContent: {
    flex: 1,
    marginLeft: 15,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  signOutText: {
    fontSize: 16,
    color: '#F44336',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
})