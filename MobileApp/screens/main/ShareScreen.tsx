import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { getMyShareTokens, revokeShareToken, formatTimeRemaining } from '../../services/shareToken'
import { ShareToken } from '../../lib/supabase'

export default function ShareScreen({ navigation }: any) {
  const [tokens, setTokens] = useState<ShareToken[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTokens()
  }, [])

  const loadTokens = async () => {
    try {
      const result = await getMyShareTokens()
      if (result.success) {
        setTokens(result.data)
      }
    } catch (error) {
      console.error('Load tokens error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeToken = (tokenId: string) => {
    Alert.alert(
      'Thu hồi quyền chia sẻ',
      'Bạn có chắc chắn muốn thu hồi quyền chia sẻ này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Thu hồi',
          style: 'destructive',
          onPress: async () => {
            const result = await revokeShareToken(tokenId)
            if (result.success) {
              loadTokens()
            } else {
              Alert.alert('Lỗi', result.error)
            }
          }
        }
      ]
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN')
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chia sẻ hồ sơ</Text>
        <TouchableOpacity style={styles.createButton}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#2196F3" />
          <Text style={styles.infoText}>
            Tạo mã chia sẻ để cho phép bác sĩ hoặc người thân xem hồ sơ y tế của bạn một cách an toàn.
          </Text>
        </View>

        {tokens.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="share-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có mã chia sẻ nào</Text>
            <TouchableOpacity style={styles.createFirstButton}>
              <Text style={styles.createFirstText}>Tạo mã chia sẻ đầu tiên</Text>
            </TouchableOpacity>
          </View>
        ) : (
          tokens.map((token) => (
            <View key={token.id} style={styles.tokenCard}>
              <View style={styles.tokenHeader}>
                <View style={styles.tokenInfo}>
                  <Text style={styles.tokenCode}>#{token.token.slice(-8)}</Text>
                  <Text style={styles.tokenDate}>
                    Tạo: {formatDate(token.created_at)}
                  </Text>
                </View>
                <View style={styles.tokenStatus}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: token.is_active ? '#4CAF50' : '#F44336' }
                  ]}>
                    <Text style={styles.statusText}>
                      {token.is_active ? 'Hoạt động' : 'Đã hủy'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.tokenContent}>
                <Text style={styles.tokenRecords}>
                  {token.record_ids?.length || 0} hồ sơ được chia sẻ
                </Text>
                {token.shared_with_name && (
                  <Text style={styles.sharedWith}>
                    Chia sẻ với: {token.shared_with_name}
                  </Text>
                )}
                <Text style={styles.tokenExpiry}>
                  {formatTimeRemaining(token.expires_at)}
                </Text>
              </View>

              <View style={styles.tokenFooter}>
                <View style={styles.accessInfo}>
                  <Text style={styles.accessCount}>
                    Đã truy cập: {token.access_count}/{token.max_access_count}
                  </Text>
                </View>
                <View style={styles.tokenActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="qr-code" size={20} color="#2196F3" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="share" size={20} color="#4CAF50" />
                  </TouchableOpacity>
                  {token.is_active && (
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleRevokeToken(token.id)}
                    >
                      <Ionicons name="close-circle" size={20} color="#F44336" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    marginBottom: 20,
  },
  createFirstButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstText: {
    color: 'white',
    fontWeight: 'bold',
  },
  tokenCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  tokenDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  tokenStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tokenContent: {
    marginBottom: 15,
  },
  tokenRecords: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  sharedWith: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  tokenExpiry: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '500',
  },
  tokenFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  accessInfo: {
    flex: 1,
  },
  accessCount: {
    fontSize: 12,
    color: '#666',
  },
  tokenActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 5,
  },
})