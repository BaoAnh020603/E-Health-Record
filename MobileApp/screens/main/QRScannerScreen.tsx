import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export default function QRScannerScreen({ navigation }: any) {
  const handleManualEntry = () => {
    Alert.prompt(
      'Nhập mã chia sẻ',
      'Vui lòng nhập mã chia sẻ để xem hồ sơ y tế',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xác nhận', 
          onPress: (token: any) => {
            if (token) {
              // Handle token validation here
              Alert.alert('Thông báo', `Mã đã nhập: ${token}`)
            }
          }
        }
      ],
      'plain-text'
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="qr-code-outline" size={100} color="#2196F3" />
        <Text style={styles.title}>Quét mã QR</Text>
        <Text style={styles.subtitle}>
          Tính năng quét QR sẽ được bổ sung trong phiên bản tiếp theo
        </Text>
        
        <TouchableOpacity 
          style={styles.manualButton}
          onPress={handleManualEntry}
        >
          <Ionicons name="create-outline" size={20} color="white" />
          <Text style={styles.manualButtonText}>Nhập mã thủ công</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  manualButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  manualButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButtonText: {
    color: '#2196F3',
    fontSize: 16,
  },
})