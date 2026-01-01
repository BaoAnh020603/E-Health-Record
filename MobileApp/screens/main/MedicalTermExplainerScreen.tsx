import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Dimensions,
  Linking
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { explainMedicalTerm } from '../../services/medicalTermExplainer'
import { supabase } from '../../lib/supabase'

// Removed unused width constant

interface MedicalExplanation {
  term: string
  simple_explanation: string
  detailed_explanation: string
  key_points: string[]
  when_to_worry: string[]
  related_terms: string[]
  video_suggestions: {
    title: string
    description: string
    duration: string
    video_url?: string
    source: string
    reliability_score: number
  }[]
  medication_instructions?: {
    how_to_take: string[]
    timing: string
    precautions: string[]
    side_effects: string[]
    interactions: string[]
    storage: string[]
  }
  reliability_score: number
  sources: Array<{
    name: string
    url: string
  } | string>
}

export default function MedicalTermExplainerScreen() {
  const [searchTerm, setSearchTerm] = useState('')
  const [explanation, setExplanation] = useState<MedicalExplanation | null>(null)
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    loadUserInfo()
  }, [])

  const loadUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.ho_ten) {
        setUserName(user.user_metadata.ho_ten)
      }
    } catch (error) {
      console.error('Error loading user info:', error)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập thuật ngữ y tế cần giải thích')
      return
    }

    setLoading(true)

    try {
      console.log('🔍 Explaining medical term:', searchTerm)

      const result = await explainMedicalTerm({
        term: searchTerm.trim(),
        includeVideos: true,
        includeMedicationInstructions: true
      })

      if (result.success && result.data) {
        setExplanation(result.data)
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể giải thích thuật ngữ y tế')
      }
    } catch (error) {
      console.error('Medical term explanation error:', error)
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi giải thích thuật ngữ')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchVideo = (searchQuery: string) => {
    // Open YouTube search for the term
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery + ' y tế giáo dục')}`
    Linking.openURL(youtubeSearchUrl).catch(() => {
      Alert.alert('Lỗi', 'Không thể mở trình duyệt. Vui lòng thử lại sau.')
    })
  }

  const handleSourcePress = (source: any) => {
    const url = typeof source === 'string' ? null : source.url
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Lỗi', 'Không thể mở trang web. Vui lòng thử lại sau.')
      })
    } else {
      Alert.alert('Thông tin', 'URL nguồn tham khảo chưa được cung cấp.')
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="book" size={40} color="#2196F3" />
          <Text style={styles.headerTitle}>Tra cứu Thuật ngữ Y khoa</Text>
          <Text style={styles.headerSubtitle}>
            Tìm hiểu ý nghĩa các thuật ngữ y tế
          </Text>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Nhập thuật ngữ y khoa cần tra cứu..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              onSubmitEditing={handleSearch}
            />
          </View>
          <TouchableOpacity
            style={[styles.searchButton, loading && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="search" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
        
        <Text style={styles.searchHint}>
          💡 Nhập thuật ngữ y khoa để tra cứu ý nghĩa
        </Text>
      </View>

      {explanation && (
        <View style={styles.explanationSection}>
          <View style={styles.explanationHeader}>
            <Ionicons name="book-outline" size={24} color="#2196F3" />
            <Text style={styles.explanationTitle}>Tra cứu: {explanation.term}</Text>
            <View style={styles.reliabilityBadge}>
              <Text style={styles.reliabilityText}>{explanation.reliability_score}%</Text>
            </View>
          </View>

          <View style={styles.disclaimerBox}>
            <Ionicons name="information-circle-outline" size={16} color="#666" />
            <Text style={styles.disclaimerText}>
              Thông tin chỉ mang tính tham khảo. Vui lòng tham khảo bác sĩ để được chẩn đoán và điều trị chính xác.
            </Text>
          </View>

          <View style={styles.explanationCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#2196F3" />
              <Text style={styles.cardTitle}>Tra cứu đơn giản</Text>
            </View>
            <Text style={styles.simpleExplanation}>{explanation.simple_explanation}</Text>
          </View>

          <View style={styles.explanationCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text" size={20} color="#FF9800" />
              <Text style={styles.cardTitle}>Tra cứu chi tiết</Text>
            </View>
            <Text style={styles.detailedExplanation}>{explanation.detailed_explanation}</Text>
          </View>

          <View style={styles.explanationCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="list" size={20} color="#4CAF50" />
              <Text style={styles.cardTitle}>Điểm quan trọng</Text>
            </View>
            {explanation.key_points.map((point, index) => (
              <View key={index} style={styles.pointItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.pointText}>{point}</Text>
              </View>
            ))}
          </View>

          <View style={styles.explanationCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="warning" size={20} color="#F44336" />
              <Text style={styles.cardTitle}>Khi nào cần lo lắng</Text>
            </View>
            {explanation.when_to_worry.map((warning, index) => (
              <View key={index} style={styles.warningItem}>
                <Ionicons name="alert-circle" size={16} color="#F44336" />
                <Text style={styles.warningText}>{warning}</Text>
              </View>
            ))}
          </View>

          {explanation.medication_instructions && (
            <View style={styles.explanationCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="medical" size={20} color="#9C27B0" />
                <Text style={styles.cardTitle}>Hướng dẫn sử dụng thuốc (Theo chuẩn y khoa)</Text>
              </View>
              
              <View style={styles.medicationNotice}>
                <Ionicons name="information-circle" size={16} color="#9C27B0" />
                <Text style={styles.medicationNoticeText}>
                  Thông tin dưới đây tuân thủ thuật ngữ y khoa chuẩn. Luôn tham khảo bác sĩ trước khi sử dụng.
                </Text>
              </View>

              <View style={styles.medicationSection}>
                <Text style={styles.medicationSubtitle}>Cách sử dụng thuốc:</Text>
                {explanation.medication_instructions.how_to_take.map((instruction, index) => (
                  <View key={index} style={styles.instructionItem}>
                    <Ionicons name="medical-outline" size={14} color="#9C27B0" />
                    <Text style={styles.instructionText}>{instruction}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.medicationSection}>
                <Text style={styles.medicationSubtitle}>Thời gian dùng thuốc:</Text>
                <Text style={styles.timingText}>{explanation.medication_instructions.timing}</Text>
              </View>

              <View style={styles.medicationSection}>
                <Text style={styles.medicationSubtitle}>Chống chỉ định & Thận trọng:</Text>
                {explanation.medication_instructions.precautions.map((precaution, index) => (
                  <View key={index} style={styles.precautionItem}>
                    <Ionicons name="shield-checkmark-outline" size={14} color="#FF9800" />
                    <Text style={styles.precautionText}>{precaution}</Text>
                  </View>
                ))}
              </View>

              {explanation.medication_instructions.side_effects && explanation.medication_instructions.side_effects.length > 0 && (
                <View style={styles.medicationSection}>
                  <Text style={styles.medicationSubtitle}>Tác dụng phụ:</Text>
                  {explanation.medication_instructions.side_effects.map((effect, index) => (
                    <View key={index} style={styles.sideEffectItem}>
                      <Ionicons name="alert-circle-outline" size={14} color="#F44336" />
                      <Text style={styles.sideEffectText}>{effect}</Text>
                    </View>
                  ))}
                </View>
              )}

              {explanation.medication_instructions.interactions && explanation.medication_instructions.interactions.length > 0 && (
                <View style={styles.medicationSection}>
                  <Text style={styles.medicationSubtitle}>Tương tác thuốc:</Text>
                  {explanation.medication_instructions.interactions.map((interaction, index) => (
                    <View key={index} style={styles.interactionItem}>
                      <Ionicons name="swap-horizontal" size={14} color="#FF9800" />
                      <Text style={styles.interactionText}>{interaction}</Text>
                    </View>
                  ))}
                </View>
              )}

              {explanation.medication_instructions.storage && explanation.medication_instructions.storage.length > 0 && (
                <View style={styles.medicationSection}>
                  <Text style={styles.medicationSubtitle}>Bảo quản:</Text>
                  {explanation.medication_instructions.storage.map((storage, index) => (
                    <View key={index} style={styles.storageItem}>
                      <Ionicons name="cube-outline" size={14} color="#666" />
                      <Text style={styles.storageText}>{storage}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Video Search Suggestion */}
          <View style={styles.explanationCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="search" size={20} color="#F44336" />
              <Text style={styles.cardTitle}>Tìm video giáo dục</Text>
            </View>
            <Text style={styles.videoSearchNote}>
              💡 Bạn có thể tự tìm kiếm video giáo dục về "{explanation.term}" trên YouTube hoặc các nền tảng khác
            </Text>
            <TouchableOpacity
              style={styles.searchVideoButton}
              onPress={() => handleSearchVideo(explanation.term)}
            >
              <Ionicons name="logo-youtube" size={24} color="white" />
              <Text style={styles.searchVideoText}>Tìm trên YouTube</Text>
              <Ionicons name="open-outline" size={18} color="white" />
            </TouchableOpacity>
            <Text style={styles.videoSearchTip}>
              🔍 Gợi ý từ khóa tìm kiếm:{'\n'}
              • "{explanation.term} là gì"{'\n'}
              • "{explanation.term} giải thích"{'\n'}
              • "{explanation.term} y tế"{'\n'}
              • "Bác sĩ giải thích {explanation.term}"
            </Text>
            <View style={styles.videoWarning}>
              <Ionicons name="warning" size={16} color="#FF9800" />
              <Text style={styles.videoWarningText}>
                Lưu ý: Chọn video từ nguồn uy tín (bệnh viện, bác sĩ chuyên khoa, kênh y tế chính thống)
              </Text>
            </View>
          </View>

          <View style={styles.explanationCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="link" size={20} color="#666" />
              <Text style={styles.cardTitle}>Thuật ngữ liên quan</Text>
            </View>
            <View style={styles.relatedTerms}>
              {explanation.related_terms.map((term, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.relatedChip}
                  onPress={() => {
                    setSearchTerm(term)
                  }}
                >
                  <Text style={styles.relatedChipText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.explanationCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="library" size={20} color="#666" />
              <Text style={styles.cardTitle}>Nguồn tham khảo</Text>
            </View>
            {explanation.sources.map((source, index) => {
              const sourceName = typeof source === 'string' ? source : source.name
              const hasUrl = typeof source !== 'string' && source.url
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.sourceItem, hasUrl && styles.sourceItemClickable]}
                  onPress={() => handleSourcePress(source)}
                  disabled={!hasUrl}
                >
                  <Ionicons 
                    name={hasUrl ? "link" : "document"} 
                    size={14} 
                    color={hasUrl ? "#2196F3" : "#666"} 
                  />
                  <Text style={[styles.sourceText, hasUrl && styles.sourceTextClickable]}>
                    {sourceName}
                  </Text>
                  {hasUrl && (
                    <Ionicons name="open-outline" size={14} color="#2196F3" />
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    alignItems: 'center',
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
  llmBadge: {
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
  llmText: {
    fontSize: 12,
    color: '#C62828',
    fontWeight: 'bold',
  },
  searchSection: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#ccc',
  },
  searchHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  explanationSection: {
    padding: 20,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginLeft: 10,
  },
  reliabilityBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reliabilityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  explanationCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#e0e0e0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  simpleExplanation: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#999',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  detailedExplanation: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pointText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 6,
  },
  warningText: {
    fontSize: 14,
    color: '#F44336',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  medicationSection: {
    marginBottom: 12,
  },
  medicationNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3E5F5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#9C27B0',
  },
  medicationNoticeText: {
    fontSize: 12,
    color: '#9C27B0',
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
    fontWeight: '600',
  },
  medicationSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9C27B0',
    marginBottom: 6,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 6,
    flex: 1,
  },
  timingText: {
    fontSize: 14,
    color: '#333',
    backgroundColor: '#F3E5F5',
    padding: 8,
    borderRadius: 6,
  },
  precautionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  precautionText: {
    fontSize: 14,
    color: '#FF9800',
    marginLeft: 6,
    flex: 1,
  },
  sideEffectItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    backgroundColor: '#FFEBEE',
    padding: 6,
    borderRadius: 4,
  },
  sideEffectText: {
    fontSize: 13,
    color: '#F44336',
    marginLeft: 6,
    flex: 1,
  },
  interactionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    backgroundColor: '#FFF3E0',
    padding: 6,
    borderRadius: 4,
  },
  interactionText: {
    fontSize: 13,
    color: '#FF9800',
    marginLeft: 6,
    flex: 1,
  },
  storageItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  storageText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  videoCard: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  videoCardClickable: {
    backgroundColor: '#FFF5F5',
    borderColor: '#F44336',
    borderWidth: 2,
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  videoThumbnail: {
    width: 80,
    height: 80,
    backgroundColor: '#F44336',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  videoThumbnailText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  videoDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    lineHeight: 16,
  },
  videoMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  videoMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  videoDuration: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '600',
  },
  videoReliability: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  videoSourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  videoSource: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
  watchNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
    marginTop: 4,
  },
  watchNowText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  videoSectionNote: {
    fontSize: 13,
    color: '#F44336',
    fontStyle: 'italic',
    marginBottom: 12,
    textAlign: 'center',
    backgroundColor: '#FFF5F5',
    padding: 10,
    borderRadius: 6,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  videoSearchNote: {
    fontSize: 13,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  searchVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF0000',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  searchVideoText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  videoSearchTip: {
    fontSize: 12,
    color: '#666',
    lineHeight: 20,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  videoWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE082',
    gap: 8,
  },
  videoWarningText: {
    flex: 1,
    fontSize: 12,
    color: '#F57C00',
    lineHeight: 18,
  },
  relatedTerms: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relatedChip: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  relatedChipText: {
    fontSize: 12,
    color: '#333',
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingVertical: 4,
  },
  sourceItemClickable: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  sourceText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
  sourceTextClickable: {
    color: '#2196F3',
    fontWeight: '500',
  },
  reliabilityFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  reliabilityFooterText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'center',
  },
  infoSection: {
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#2196F3',
    lineHeight: 18,
  },
})