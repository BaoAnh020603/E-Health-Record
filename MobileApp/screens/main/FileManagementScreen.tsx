import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'

export default function FileManagementScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<any[]>([])
  const [stats, setStats] = useState({
    active: 0,
    pending: 0,
    failed: 0,
    deleted: 0
  })

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    setLoading(true)
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        Alert.alert('Lỗi', 'Bạn cần đăng nhập')
        return
      }

      const { data: filesData, error } = await supabase
        .from('medical_files')
        .select('id, file_name, trang_thai, file_path, record_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setFiles(filesData || [])

      // Calculate stats
      const newStats = {
        active: 0,
        pending: 0,
        failed: 0,
        deleted: 0
      }

      filesData?.forEach(file => {
        newStats[file.trang_thai as keyof typeof newStats] = 
          (newStats[file.trang_thai as keyof typeof newStats] || 0) + 1
      })

      setStats(newStats)

    } catch (error: any) {
      console.error('Load files error:', error)
      Alert.alert('Lỗi', error.message)
    } finally {
      setLoading(false)
    }
  }

  const cleanupPendingFiles = async () => {
    Alert.alert(
      'Xác nhận',
      `Bạn có chắc muốn xóa ${stats.pending + stats.failed} files lỗi?\n\nCác files này chưa được upload thực sự và không thể xem được.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setLoading(true)
            try {
              const { data: { user }, error: userError } = await supabase.auth.getUser()
              if (userError || !user) {
                Alert.alert('Lỗi', 'Bạn cần đăng nhập')
                return
              }

              const { error } = await supabase
                .from('medical_files')
                .delete()
                .eq('user_id', user.id)
                .in('trang_thai', ['pending', 'failed'])

              if (error) throw error

              Alert.alert('Thành công', 'Đã xóa các files lỗi')
              loadFiles()

            } catch (error: any) {
              console.error('Cleanup error:', error)
              Alert.alert('Lỗi', error.message)
            } finally {
              setLoading(false)
            }
          }
        }
      ]
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '✅'
      case 'pending': return '⏳'
      case 'failed': return '❌'
      case 'deleted': return '🗑️'
      default: return '❓'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50'
      case 'pending': return '#FF9800'
      case 'failed': return '#F44336'
      case 'deleted': return '#9E9E9E'
      default: return '#666'
    }
  }

  if (loading && files.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quản lý Files</Text>
        <Text style={styles.subtitle}>Tổng số: {files.length} files</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.active}</Text>
          <Text style={styles.statLabel}>✅ Hoạt động</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>⏳ Đang xử lý</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#F44336' }]}>{stats.failed}</Text>
          <Text style={styles.statLabel}>❌ Lỗi</Text>
        </View>
      </View>

      {(stats.pending > 0 || stats.failed > 0) && (
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={24} color="#FF9800" />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>
              Có {stats.pending + stats.failed} files không thể xem
            </Text>
            <Text style={styles.warningText}>
              Các files này được tạo trước khi cấu hình storage bucket. 
              Bạn nên xóa chúng và upload lại.
            </Text>
            <TouchableOpacity
              style={styles.cleanupButton}
              onPress={cleanupPendingFiles}
              disabled={loading}
            >
              <Text style={styles.cleanupButtonText}>
                {loading ? 'Đang xóa...' : 'Xóa files lỗi'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.filesSection}>
        <Text style={styles.sectionTitle}>Danh sách Files</Text>
        {files.map((file, index) => (
          <View key={file.id} style={styles.fileCard}>
            <View style={styles.fileHeader}>
              <Text style={styles.fileIcon}>{getStatusIcon(file.trang_thai)}</Text>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.file_name}
                </Text>
                <Text style={styles.fileDate}>
                  {new Date(file.created_at).toLocaleDateString('vi-VN')}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(file.trang_thai) }]}>
                <Text style={styles.statusText}>{file.trang_thai}</Text>
              </View>
            </View>
            <Text style={styles.filePath} numberOfLines={1}>
              {file.file_path}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadFiles}
          disabled={loading}
        >
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.refreshButtonText}>Làm mới</Text>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningContent: {
    flex: 1,
    marginLeft: 10,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 5,
  },
  warningText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  cleanupButton: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  cleanupButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  filesSection: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  fileCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fileIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  fileDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  filePath: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
  },
  footer: {
    padding: 15,
    paddingBottom: 30,
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
