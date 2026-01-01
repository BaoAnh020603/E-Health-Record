import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { simplifyDoctorNotes } from '../../services/aiMedicalAssistant'
import { getCurrentUserProfile } from '../../services/auth'
import type { SimplifiedMedicalText } from '../../services/aiMedicalAssistant'

export default function AIMedicalAssistantScreen({ navigation }: any) {
  const [technicalText, setTechnicalText] = useState('')
  const [simplifiedResult, setSimplifiedResult] = useState<SimplifiedMedicalText | null>(null)
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const profile = await getCurrentUserProfile()
      if (profile && profile.ho_ten) {
        setUserName(profile.ho_ten)
      }
    } catch (error) {
      console.log('Could not load user profile:', error)
    }
  }

  const handleSimplify = async () => {
    if (!technicalText.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập văn bản y tế cần đơn giản hóa')
      return
    }

    setLoading(true)
    try {
      const result = await simplifyDoctorNotes(technicalText)
      
      if (result.success && result.data) {
        setSimplifiedResult(result.data)
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể đơn giản hóa văn bản')
      }
    } catch (error) {
      console.error('Simplify error:', error)
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi xử lý')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setTechnicalText('')
    setSimplifiedResult(null)
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="book" size={40} color="#2196F3" />
        <Text style={styles.headerTitle}>Tra cứu Ghi chú Y khoa</Text>
        <Text style={styles.headerSubtitle}>
          Tra cứu ý nghĩa ghi chú y khoa - KHÔNG phải công cụ điều trị
        </Text>
        <View style={styles.warningBadge}>
          <Ionicons name="warning" size={16} color="#F44336" />
          <Text style={styles.warningText}>
            Chỉ tra cứu - Không hướng dẫn điều trị
          </Text>
        </View>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>Ghi chú y khoa từ bác sĩ</Text>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={6}
          placeholder="Nhập ghi chú của bác sĩ hoặc thuật ngữ y khoa cần tra cứu..."
          value={technicalText}
          onChangeText={setTechnicalText}
          textAlignVertical="top"
        />
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClear}
          >
            <Ionicons name="trash-outline" size={20} color="#666" />
            <Text style={styles.clearButtonText}>Xóa</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.simplifyButton]}
            onPress={handleSimplify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="search" size={20} color="white" />
                <Text style={styles.simplifyButtonText}>Tra cứu</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {simplifiedResult && (
        <View style={styles.resultSection}>
          <View style={styles.resultHeader}>
            <Ionicons name="book-outline" size={24} color="#2196F3" />
            <Text style={styles.resultTitle}>Kết quả tra cứu</Text>
          </View>

          <View style={styles.disclaimerBox}>
            <View style={styles.disclaimerIconContainer}>
              <Ionicons name="warning" size={32} color="#F44336" />
            </View>
            <View style={styles.disclaimerContent}>
              <Text style={styles.disclaimerTitle}>⚠️ CẢNH BÁO QUAN TRỌNG</Text>
              <Text style={styles.disclaimerText}>
                Đây CHỈ là ý kiến THAM KHẢO về ghi chú y khoa.{'\n\n'}
                App TUYỆT ĐỐI KHÔNG:{'\n'}
                • Chẩn đoán bệnh{'\n'}
                • Hướng dẫn điều trị{'\n'}
                • Đưa ra bài thuốc (Tây y, Đông y, cổ truyền){'\n'}
                • Hướng dẫn uống, tiêm, bôi bất kỳ thuốc/chất nào vào cơ thể{'\n\n'}
                ⚕️ VUI LÒNG THĂM KHÁM các bác sĩ tại phòng khám chuyên khoa để được khám, chẩn đoán và điều trị chính xác.{'\n\n'}
                App chỉ cung cấp công cụ tra cứu, KHÔNG quyết định hành vi cuối cùng của bạn.
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tra cứu dễ hiểu</Text>
            <Text style={styles.simplifiedText}>{simplifiedResult.simplifiedText}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Các điểm chính</Text>
            {simplifiedResult.keyPoints.map((point, index) => (
              <View key={index} style={styles.bulletPoint}>
                <Ionicons name="ellipse" size={8} color="#2196F3" />
                <Text style={styles.bulletText}>{point}</Text>
              </View>
            ))}
          </View>

          {simplifiedResult.medicalTermsExplained.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Thuật ngữ y tế</Text>
              {simplifiedResult.medicalTermsExplained.map((term, index) => (
                <View key={index} style={styles.termItem}>
                  <Text style={styles.termName}>{term.term}</Text>
                  <Text style={styles.termExplanation}>{term.explanation}</Text>
                </View>
              ))}
            </View>
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
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  inputSection: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
    backgroundColor: '#fafafa',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  clearButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  simplifyButton: {
    backgroundColor: '#2196F3',
  },
  simplifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultSection: {
    margin: 15,
    marginTop: 0,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 12,
  },
  simplifiedText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  disclaimerBox: {
    backgroundColor: '#FFEBEE',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 5,
    borderColor: '#D32F2F',
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 15,
  },
  disclaimerIconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  disclaimerContent: {
    alignItems: 'center',
  },
  disclaimerTitle: {
    fontSize: 18,
    color: '#B71C1C',
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  disclaimerText: {
    fontSize: 15,
    color: '#B71C1C',
    lineHeight: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  warningText: {
    fontSize: 12,
    color: '#C62828',
    fontWeight: 'bold',
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
    paddingLeft: 5,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  termItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  termName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  termExplanation: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    margin: 15,
    marginTop: 0,
  },
  predictionButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
    gap: 10,
  },
  predictionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
