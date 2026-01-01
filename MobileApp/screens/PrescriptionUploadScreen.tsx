/**
 * Prescription Upload Screen
 * UI chuẩn bệnh viện - Màu xanh lá medical, trắng, xanh dương
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import prescriptionOCRService from '../services/prescriptionOCRService';

// Màu chuẩn bệnh viện
const COLORS = {
  primary: '#00A86B',      // Xanh lá medical
  secondary: '#0066CC',    // Xanh dương
  white: '#FFFFFF',
  background: '#F5F9F7',   // Xanh nhạt
  text: '#2C3E50',
  textLight: '#7F8C8D',
  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
  border: '#E0E0E0',
  cardBg: '#FFFFFF'
};

interface Props {
  navigation: any;
}

export default function PrescriptionUploadScreen({ navigation }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');

  const handlePickDocument = async () => {
    try {
      setUploading(true);
      setProgress('Đang chọn file...');

      const result = await prescriptionOCRService.pickDocument();

      if (result.canceled) {
        setUploading(false);
        return;
      }

      if (result.assets && result.assets[0]) {
        const file = result.assets[0];
        await analyzePrescription(file.uri, file.name, file.mimeType || 'application/pdf');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể chọn file. Vui lòng thử lại.');
      setUploading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      setUploading(true);
      setProgress('Đang mở camera...');

      const result = await prescriptionOCRService.pickImage(true);

      if (result.canceled) {
        setUploading(false);
        return;
      }

      if (result.assets && result.assets[0]) {
        const file = result.assets[0];
        await analyzePrescription(file.uri, 'prescription.jpg', 'image/jpeg');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể chụp ảnh. Vui lòng thử lại.');
      setUploading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      setUploading(true);
      setProgress('Đang chọn ảnh...');

      const result = await prescriptionOCRService.pickImage(false);

      if (result.canceled) {
        setUploading(false);
        return;
      }

      if (result.assets && result.assets[0]) {
        const file = result.assets[0];
        await analyzePrescription(file.uri, 'prescription.jpg', 'image/jpeg');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể chọn ảnh. Vui lòng thử lại.');
      setUploading(false);
    }
  };

  const analyzePrescription = async (uri: string, name: string, mimeType: string) => {
    try {
      setProgress('Đang phân tích đơn thuốc...');

      const analysis = await prescriptionOCRService.analyzePrescription(
        uri,
        name,
        mimeType,
        new Date()
      );

      setUploading(false);
      setProgress('');

      // Navigate to analysis result screen
      navigation.navigate('PrescriptionAnalysis', { analysis });
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể phân tích đơn thuốc. Vui lòng thử lại.');
      setUploading(false);
      setProgress('');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phân tích đơn thuốc</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="medical" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.infoTitle}>Hệ thống phân tích thông minh</Text>
          <Text style={styles.infoText}>
            Tự động trích xuất thông tin thuốc, lịch khám và tạo lịch nhắc uống thuốc
          </Text>
          
          {/* Tips for better OCR */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Mẹo chụp ảnh rõ nét:</Text>
            <Text style={styles.tipText}>✓ Đặt đơn thuốc trên mặt phẳng, ánh sáng đủ</Text>
            <Text style={styles.tipText}>✓ Chụp thẳng góc, không bị nghiêng</Text>
            <Text style={styles.tipText}>✓ Đảm bảo chữ rõ ràng, không bị mờ</Text>
            <Text style={styles.tipText}>✓ Chụp toàn bộ đơn thuốc, không bị cắt</Text>
            <Text style={styles.tipText}>✓ Tránh bóng đổ che khuất chữ</Text>
            <Text style={styles.tipText}>✓ Giữ camera ổn định khi chụp</Text>
          </View>
          
          {/* Advanced Processing Badge */}
          <View style={styles.advancedBadge}>
            <Ionicons name="sparkles" size={16} color={COLORS.primary} />
            <Text style={styles.advancedText}>
              Hệ thống tự động xử lý ảnh mờ, nghiêng, ánh sáng kém
            </Text>
          </View>
        </View>

        {/* Upload Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chọn cách tải lên</Text>

          {/* PDF Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={handlePickDocument}
            disabled={uploading}
          >
            <View style={[styles.optionIcon, { backgroundColor: '#FFE5E5' }]}>
              <Ionicons name="document-text" size={32} color="#E74C3C" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Chọn file PDF</Text>
              <Text style={styles.optionDescription}>
                Tải lên đơn thuốc dạng PDF từ thiết bị
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
          </TouchableOpacity>

          {/* Camera Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleTakePhoto}
            disabled={uploading}
          >
            <View style={[styles.optionIcon, { backgroundColor: '#E5F5FF' }]}>
              <Ionicons name="camera" size={32} color={COLORS.secondary} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Chụp ảnh</Text>
              <Text style={styles.optionDescription}>
                Chụp ảnh đơn thuốc trực tiếp
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
          </TouchableOpacity>

          {/* Gallery Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={handlePickImage}
            disabled={uploading}
          >
            <View style={[styles.optionIcon, { backgroundColor: '#E5FFE5' }]}>
              <Ionicons name="images" size={32} color={COLORS.primary} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Chọn từ thư viện</Text>
              <Text style={styles.optionDescription}>
                Chọn ảnh đơn thuốc từ thư viện
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tính năng</Text>

          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.featureText}>Trích xuất tự động</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.featureText}>Phân tích thông minh</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.featureText}>Lịch nhắc tự động</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.featureText}>100% bảo mật</Text>
            </View>
          </View>
        </View>

        {/* Note */}
        <View style={styles.noteCard}>
          <Ionicons name="information-circle" size={20} color={COLORS.secondary} />
          <Text style={styles.noteText}>
            Hỗ trợ file PDF và ảnh (JPG, PNG). Kích thước tối đa 10MB.
          </Text>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {uploading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>{progress}</Text>
            <Text style={styles.loadingSubtext}>Vui lòng đợi...</Text>
          </View>
        </View>
      )}
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
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  infoIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5FFE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center'
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20
  },
  tipsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    width: '100%'
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8
  },
  tipText: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 20,
    marginBottom: 4
  },
  advancedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5FFE5',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '30'
  },
  advancedText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 8,
    flex: 1,
    fontWeight: '500'
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
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  optionContent: {
    flex: 1
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4
  },
  optionDescription: {
    fontSize: 13,
    color: COLORS.textLight
  },
  featureRow: {
    flexDirection: 'row',
    marginBottom: 12
  },
  featureItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8
  },
  noteCard: {
    flexDirection: 'row',
    backgroundColor: '#E5F5FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.secondary,
    marginLeft: 12,
    lineHeight: 18
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 200
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    textAlign: 'center'
  },
  loadingSubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: 'center'
  }
});
