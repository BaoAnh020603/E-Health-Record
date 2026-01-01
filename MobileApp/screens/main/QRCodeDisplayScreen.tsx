import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  ActivityIndicator
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { Ionicons } from '@expo/vector-icons'
import QRCode from 'react-native-qrcode-svg'
import { generateShareToken, revokeShareToken } from '../../services/qrService'

export default function QRCodeDisplayScreen({ navigation, route }: any) {
  const [loading, setLoading] = useState(false)
  const [qrData, setQrData] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const { fromProfileSetup, fromEdit, recordId } = route?.params || {}

  useEffect(() => {
    if (fromProfileSetup || fromEdit) {
      // Auto-generate QR code when coming from profile setup or edit
      handleGenerateQR()
    }
  }, [fromProfileSetup, fromEdit])

  const handleGenerateQR = async () => {
    setLoading(true)
    try {
      let result
      if (fromEdit && recordId) {
        // Generate QR for specific record
        result = await generateShareToken({
          recordIds: [recordId],
          expiresInHours: 24,
          maxAccessCount: 5
        })
      } else {
        // Generate QR for recent records
        result = await generateShareToken({
          includeRecentRecordsOnly: true,
          maxRecords: 3,
          expiresInHours: 24,
          maxAccessCount: 5
        })
      }

      if (result.success && result.qrData && result.token) {
        setQrData(result.qrData)
        setToken(result.token)
        
        const expires = new Date()
        expires.setHours(expires.getHours() + 24)
        setExpiresAt(expires)

        Alert.alert(
          'Thành công',
          fromEdit 
            ? 'Mã QR cho hồ sơ đã được tạo thành công!\n\n• Chứa thông tin hồ sơ vừa cập nhật\n• Hiệu lực 24 giờ, tối đa 5 lần truy cập'
            : 'Mã QR đã được tạo thành công!\n\n• Chỉ bao gồm thông tin y tế cần thiết\n• 3 hồ sơ khám gần nhất\n• Hiệu lực 24 giờ, tối đa 5 lần truy cập'
        )
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể tạo mã QR')
      }
    } catch (error) {
      console.error('Generate QR error:', error)
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tạo mã QR')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (!qrData) return

    try {
      await Share.share({
        message: `Hồ sơ y tế của tôi: ${qrData}\n\nQuét mã QR hoặc truy cập link để xem thông tin.`,
        title: 'Chia sẻ hồ sơ y tế'
      })
    } catch (error) {
      console.error('Share error:', error)
    }
  }

  const handleRevoke = () => {
    if (!token) return

    Alert.alert(
      'Thu hồi mã QR',
      'Bạn có chắc chắn muốn thu hồi mã QR này? Mã sẽ không thể sử dụng được nữa.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Thu hồi',
          style: 'destructive',
          onPress: async () => {
            const result = await revokeShareToken(token)
            if (result.success) {
              Alert.alert('Thành công', 'Đã thu hồi mã QR')
              setQrData(null)
              setToken(null)
              setExpiresAt(null)
            } else {
              Alert.alert('Lỗi', result.error || 'Không thể thu hồi mã QR')
            }
          }
        }
      ]
    )
  }

  const handleContinue = () => {
    if (fromProfileSetup) {
      navigation.replace('MainTabs')
    } else if (fromEdit) {
      navigation.navigate('MainTabs')
    } else {
      navigation.goBack()
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="qr-code" size={40} color="#2196F3" />
        <Text style={styles.title}>Mã QR Hồ Sơ Y Tế</Text>
        <Text style={styles.subtitle}>
          Chia sẻ hồ sơ y tế của bạn với bác sĩ và bệnh viện
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Đang tạo mã QR...</Text>
        </View>
      ) : qrData ? (
        <View style={styles.qrContainer}>
          {/* QR Code Display */}
          <View style={styles.qrCodeWrapper}>
            <View style={styles.qrCodeContainer}>
              {qrData ? (
                <QRCode
                  value={qrData}
                  size={200}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                />
              ) : (
                <View style={styles.qrCodePlaceholder}>
                  <Ionicons name="qr-code" size={100} color="#2196F3" />
                  <Text style={styles.qrCodeText}>Đang tạo mã QR...</Text>
                </View>
              )}
            </View>
            
            {/* Share URL */}
            <View style={styles.urlContainer}>
              <Text style={styles.urlLabel}>Link chia sẻ:</Text>
              <TouchableOpacity 
                style={styles.urlBox}
                onPress={async () => {
                  await Clipboard.setStringAsync(qrData)
                  Alert.alert('Đã sao chép', 'Link đã được sao chép vào clipboard')
                }}
              >
                <Text style={styles.urlText} numberOfLines={2}>
                  {qrData}
                </Text>
                <Ionicons name="copy" size={20} color="#2196F3" />
              </TouchableOpacity>
            </View>
          </View>

          {/* QR Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Hết hạn</Text>
                <Text style={styles.infoValue}>
                  {expiresAt ? formatDate(expiresAt) : 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="eye" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Giới hạn truy cập</Text>
                <Text style={styles.infoValue}>5 lần (Bảo mật cao)</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="document-text" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nội dung chia sẻ</Text>
                <Text style={styles.infoValue}>Thông tin cần thiết + 3 hồ sơ gần nhất</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Bảo mật</Text>
                <Text style={styles.infoValue}>Thông tin nhạy cảm đã được ẩn</Text>
              </View>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>Thông tin được chia sẻ</Text>
            
            <View style={styles.sharedInfoSection}>
              <Text style={styles.sharedInfoTitle}>✅ Thông tin cần thiết:</Text>
              <Text style={styles.sharedInfoItem}>• Họ tên, ngày sinh, giới tính</Text>
              <Text style={styles.sharedInfoItem}>• Nhóm máu (quan trọng cho cấp cứu)</Text>
              <Text style={styles.sharedInfoItem}>• Thông tin BHYT (đã mã hóa)</Text>
              <Text style={styles.sharedInfoItem}>• 3 hồ sơ khám bệnh gần nhất</Text>
            </View>

            <View style={styles.sharedInfoSection}>
              <Text style={styles.sharedInfoTitle}>🔒 Thông tin được bảo vệ:</Text>
              <Text style={styles.sharedInfoItem}>• Số CCCD</Text>
              <Text style={styles.sharedInfoItem}>• Số điện thoại</Text>
              <Text style={styles.sharedInfoItem}>• Email cá nhân</Text>
              <Text style={styles.sharedInfoItem}>• Địa chỉ nhà riêng</Text>
              <Text style={styles.sharedInfoItem}>• Ghi chú riêng tư của bác sĩ</Text>
            </View>

            <View style={styles.usageInstructions}>
              <Text style={styles.instructionsTitle}>Hướng dẫn sử dụng</Text>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>1</Text>
                <Text style={styles.instructionText}>
                  Chỉ chia sẻ với bác sĩ hoặc nhân viên y tế đáng tin cậy
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>2</Text>
                <Text style={styles.instructionText}>
                  Mã QR chỉ hiển thị thông tin y tế cần thiết, bảo vệ quyền riêng tư
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>3</Text>
                <Text style={styles.instructionText}>
                  Mã có hiệu lực 24 giờ và tối đa 5 lần truy cập để đảm bảo an toàn
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-social" size={20} color="white" />
              <Text style={styles.shareButtonText}>Chia sẻ</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.revokeButton} onPress={handleRevoke}>
              <Ionicons name="close-circle" size={20} color="#F44336" />
              <Text style={styles.revokeButtonText}>Thu hồi</Text>
            </TouchableOpacity>
          </View>

          {(fromProfileSetup || fromEdit) && (
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>
                {fromEdit ? 'Quay về trang chủ' : 'Tiếp tục sử dụng ứng dụng'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="qr-code-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>Chưa có mã QR</Text>
          <Text style={styles.emptyDescription}>
            Tạo mã QR an toàn để chia sẻ thông tin y tế cần thiết với bác sĩ.
            {'\n\n'}Chỉ bao gồm thông tin quan trọng, bảo vệ quyền riêng tư của bạn.
          </Text>

          <TouchableOpacity style={styles.generateButton} onPress={handleGenerateQR}>
            <Ionicons name="add-circle" size={20} color="white" />
            <Text style={styles.generateButtonText}>Tạo mã QR mới</Text>
          </TouchableOpacity>

          {!fromProfileSetup && (
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>Quay lại</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  qrContainer: {
    padding: 20,
  },
  qrCodeWrapper: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  qrCodeContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrCodePlaceholder: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  qrCodeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 10,
  },
  urlContainer: {
    width: '100%',
    marginTop: 20,
  },
  urlLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  urlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  urlText: {
    flex: 1,
    fontSize: 12,
    color: '#2196F3',
    marginRight: 10,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  instructionsCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 15,
  },
  sharedInfoSection: {
    marginBottom: 15,
  },
  sharedInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  sharedInfoItem: {
    fontSize: 13,
    color: '#333',
    marginLeft: 10,
    marginBottom: 3,
  },
  usageInstructions: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#BBDEFB',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: 'bold',
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  revokeButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 8,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  revokeButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  continueButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
    lineHeight: 24,
  },
  generateButton: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    marginBottom: 15,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  backButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  backButtonText: {
    color: '#2196F3',
    fontSize: 16,
  },
})