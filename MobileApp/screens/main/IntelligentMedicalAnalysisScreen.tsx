import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  TextInput
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { listMedicalRecords } from '../../services/medicalRecords'
import { analyzePatientHistory } from '../../services/intelligentMedicalAnalysis'
import { supabase } from '../../lib/supabase'
import type { MedicalRecord } from '../../lib/supabase'

interface ComprehensiveAnalysis {
  patient_summary: {
    medical_history: string[]
    current_conditions: string[]
    risk_factors: string[]
    hospital_visits: {
      hospital: string
      frequency: number
      last_visit: string
    }[]
  }
  disease_progression: {
    current_status: string
    likely_progression: string[]
    timeline_predictions: {
      timeframe: string
      probability: number
      expected_changes: string[]
    }[]
  }
  proactive_management: {
    immediate_actions: string[]
    lifestyle_modifications: string[]
    monitoring_schedule: string[]
    preventive_measures: string[]
  }
  risk_mitigation: {
    high_priority_risks: string[]
    avoidance_strategies: string[]
    early_warning_signs: string[]
    emergency_protocols: string[]
  }
  personalized_recommendations: {
    based_on_history: string[]
    hospital_specific: string[]
    condition_specific: string[]
    age_appropriate: string[]
  }
  evidence_sources: {
    primary_analysis: string
    medical_guidelines: string[]
    research_citations: string[]
    reliability_score: number
    confidence_level: string
  }
}

export default function IntelligentMedicalAnalysisScreen({ navigation }: any) {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<ComprehensiveAnalysis | null>(null)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [userName, setUserName] = useState('')
  const [additionalSymptoms, setAdditionalSymptoms] = useState('')
  const [showSymptomsInput, setShowSymptomsInput] = useState(false)
  
  // Record selection
  const [showRecordSelector, setShowRecordSelector] = useState(false)
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadUserAndRecords()
    // Reset selection when component mounts
    setSelectedRecordIds(new Set())
  }, [])

  // Reload data when screen comes into focus (e.g., after creating a new record)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 IntelligentMedicalAnalysisScreen focused, reloading records...')
      loadMedicalRecords()
      
      // Show a brief success message if coming from record creation
      const unsubscribe = navigation.addListener('focus', () => {
        // Check if we have a success parameter
        const params = navigation.getState()?.routes?.find((r: any) => r.name === 'IntelligentAnalysis')?.params as any
        if (params?.recordCreated) {
          // Clear the parameter to avoid showing the message again
          navigation.setParams({ recordCreated: undefined })
        }
      })
      
      return unsubscribe
    }, [navigation])
  )

  const loadUserAndRecords = async () => {
    try {
      // Load user info
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.ho_ten) {
        setUserName(user.user_metadata.ho_ten)
      }

      // Load medical records with loading indicator
      await loadMedicalRecords(true)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const loadMedicalRecords = async (showLoadingIndicator = false) => {
    try {
      if (showLoadingIndicator) {
        setLoading(true)
      }
      
      const result = await listMedicalRecords({
        page: 1,
        limit: 100, // Get more records for comprehensive analysis
        sort_by: 'ngay_kham',
        sort_order: 'desc'
      })

      if (result.success) {
        setRecords(result.data)
        console.log(`✅ Loaded ${result.data.length} medical records`)
      } else {
        Alert.alert('Lỗi', 'Không thể tải danh sách hồ sơ')
      }
    } catch (error) {
      console.error('Error loading records:', error)
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tải hồ sơ')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadMedicalRecords()
  }

  const handleComprehensiveAnalysis = async () => {
    if (records.length === 0) {
      Alert.alert('Thông báo', 'Bạn cần có ít nhất một hồ sơ y tế để thực hiện phân tích')
      return
    }

    console.log('📊 Selected records count:', selectedRecordIds.size)
    
    // If no records selected, show selector
    if (selectedRecordIds.size === 0) {
      console.log('🔘 Opening record selector modal')
      setShowRecordSelector(true)
      return
    }

    console.log('🔍 Starting comprehensive medical analysis...')
    setAnalyzing(true)

    try {
      // Get selected records
      const selectedRecords = records.filter(r => selectedRecordIds.has(r.id))
      console.log(`📋 Analyzing ${selectedRecords.length} selected records`)

      // Analyze selected patient records
      const analysisResult = await analyzePatientHistory({
        records: selectedRecords,
        additionalSymptoms: additionalSymptoms.trim() || undefined,
        analysisType: 'comprehensive'
      })

      if (analysisResult.success && analysisResult.data) {
        setAnalysis(analysisResult.data)
        setShowAnalysisModal(true)
        setAdditionalSymptoms('') // Clear input after successful analysis
      } else {
        Alert.alert('Lỗi', analysisResult.error || 'Không thể phân tích hồ sơ y tế')
      }
    } catch (error) {
      console.error('Comprehensive analysis error:', error)
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi phân tích hồ sơ')
    } finally {
      setAnalyzing(false)
    }
  }

  const toggleRecordSelection = (recordId: string) => {
    const newSelected = new Set(selectedRecordIds)
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId)
    } else {
      newSelected.add(recordId)
    }
    setSelectedRecordIds(newSelected)
  }

  const selectAllRecords = () => {
    setSelectedRecordIds(new Set(records.map(r => r.id)))
  }

  const clearSelection = () => {
    setSelectedRecordIds(new Set())
  }

  const handleConfirmSelection = () => {
    if (selectedRecordIds.size === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một hồ sơ để phân tích')
      return
    }
    
    // Check if any selected record has prescriptions
    const selectedRecords = records.filter(r => selectedRecordIds.has(r.id))
    const hasPrescriptions = selectedRecords.some(r => r.toa_thuoc && r.toa_thuoc.length > 0)
    
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getHospitalSummary = () => {
    const hospitalCounts: { [key: string]: number } = {}
    records.forEach(record => {
      if (record.ten_benh_vien) {
        hospitalCounts[record.ten_benh_vien] = (hospitalCounts[record.ten_benh_vien] || 0) + 1
      }
    })
    return Object.entries(hospitalCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
  }

  const getConditionSummary = () => {
    const conditions = new Set<string>()
    records.forEach(record => {
      if (record.chan_doan_ra) conditions.add(record.chan_doan_ra)
      if (record.chan_doan_vao) conditions.add(record.chan_doan_vao)
    })
    return Array.from(conditions).slice(0, 5)
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Đang tải hồ sơ y tế...</Text>
      </View>
    )
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Ionicons name="analytics" size={40} color="#4CAF50" />
        <Text style={styles.headerTitle}>Phân tích Hồ sơ</Text>
        <Text style={styles.headerSubtitle}>
          Phân tích và tham khảo thông tin từ lịch sử hồ sơ - KHÔNG phải công cụ chẩn đoán
        </Text>
        
        {/* Reference Notice Badge */}
        <View style={styles.approvalBadge}>
          <Ionicons name="information-circle" size={16} color="#F44336" />
          <Text style={styles.approvalText}>
            Chỉ mang tính chất THAM KHẢO - Không thay thế ý kiến bác sĩ
          </Text>
        </View>

        {/* Smart Reminders Button */}
        <TouchableOpacity
          style={styles.remindersButton}
          onPress={() => navigation.navigate('SmartReminders')}
        >
          <Ionicons name="notifications" size={20} color="white" />
          <Text style={styles.remindersButtonText}>Nhắc nhở thông minh</Text>
        </TouchableOpacity>
      </View>

      {records.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Chưa có hồ sơ y tế</Text>
          <Text style={styles.emptySubtitle}>
            Tạo hồ sơ y tế để sử dụng tính năng phân tích thông minh
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateRecord')}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.createButtonText}>Tạo hồ sơ mới</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.analysisSection}>
          {/* Medical History Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="medical" size={24} color="#2196F3" />
              <Text style={styles.summaryTitle}>Tóm tắt lịch sử y tế</Text>
            </View>
            
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{records.length}</Text>
                <Text style={styles.statLabel}>Lần khám</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{getHospitalSummary().length}</Text>
                <Text style={styles.statLabel}>Bệnh viện</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{getConditionSummary().length}</Text>
                <Text style={styles.statLabel}>Chẩn đoán</Text>
              </View>
            </View>

            {/* Recent Hospitals */}
            <View style={styles.hospitalList}>
              <Text style={styles.listTitle}>Bệnh viện thường đến:</Text>
              {getHospitalSummary().map(([hospital, count], index) => (
                <View key={index} style={styles.hospitalItem}>
                  <Ionicons name="business" size={16} color="#666" />
                  <Text style={styles.hospitalName}>{hospital}</Text>
                  <Text style={styles.hospitalCount}>({count} lần)</Text>
                </View>
              ))}
            </View>

            {/* Recent Conditions */}
            <View style={styles.conditionList}>
              <Text style={styles.listTitle}>Chẩn đoán gần đây:</Text>
              {getConditionSummary().map((condition, index) => (
                <View key={index} style={styles.conditionItem}>
                  <Ionicons name="medical-outline" size={16} color="#666" />
                  <Text style={styles.conditionText}>{condition}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Additional Symptoms Input */}
          <View style={styles.symptomsCard}>
            <TouchableOpacity 
              style={styles.symptomsToggle}
              onPress={() => setShowSymptomsInput(!showSymptomsInput)}
            >
              <Ionicons name="add-circle" size={20} color="#FF9800" />
              <Text style={styles.symptomsToggleText}>
                Thêm triệu chứng hiện tại (tùy chọn)
              </Text>
              <Ionicons 
                name={showSymptomsInput ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
            
            {showSymptomsInput && (
              <View style={styles.symptomsInput}>
                <Text style={styles.symptomsLabel}>
                  Mô tả các triệu chứng mới hoặc thay đổi gần đây:
                </Text>
                <TextInput
                  style={styles.symptomsTextInput}
                  placeholder="Ví dụ: Đau đầu thường xuyên, mệt mỏi, khó ngủ..."
                  value={additionalSymptoms}
                  onChangeText={setAdditionalSymptoms}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <Text style={styles.symptomsHint}>
                  💡 Thông tin này sẽ giúp AI phân tích chính xác hơn
                </Text>
              </View>
            )}
          </View>

          {/* Analysis Button */}
          <TouchableOpacity
            style={[styles.analyzeButton, analyzing && styles.analyzeButtonDisabled]}
            onPress={handleComprehensiveAnalysis}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.analyzeButtonText}>Đang phân tích...</Text>
              </>
            ) : (
              <>
                <Ionicons name="analytics" size={24} color="white" />
                <Text style={styles.analyzeButtonText}>
                  {selectedRecordIds.size > 0 
                    ? `Phân tích ${selectedRecordIds.size} hồ sơ đã chọn`
                    : 'Chọn hồ sơ để phân tích'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.analysisInfo}>
            <Ionicons name="information-circle" size={16} color="#666" />
            <Text style={styles.analysisInfoText}>
              AI sẽ phân tích hồ sơ y tế mà người dùng chọn, dự đoán diễn biến và đưa ra khuyến nghị cá nhân hóa
            </Text>
          </View>
        </View>
      )}

      {/* Record Selector Modal */}
      <Modal
        visible={showRecordSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRecordSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.selectorModal}>
            <View style={styles.selectorHeader}>
              <Text style={styles.selectorTitle}>Chọn hồ sơ để phân tích</Text>
              <TouchableOpacity onPress={() => setShowRecordSelector(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.selectorActions}>
              <TouchableOpacity
                style={styles.selectAllButton}
                onPress={selectAllRecords}
              >
                <Ionicons name="checkmark-done" size={18} color="#4CAF50" />
                <Text style={styles.selectAllText}>Chọn tất cả</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearSelection}
              >
                <Ionicons name="close-circle" size={18} color="#F44336" />
                <Text style={styles.clearText}>Bỏ chọn</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.recordList}
              contentContainerStyle={styles.recordListContent}
            >
              {records.map((record) => (
                <TouchableOpacity
                  key={record.id}
                  style={[
                    styles.recordItem,
                    selectedRecordIds.has(record.id) && styles.recordItemSelected
                  ]}
                  onPress={() => toggleRecordSelection(record.id)}
                >
                  <View style={styles.recordCheckbox}>
                    <Ionicons
                      name={selectedRecordIds.has(record.id) ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={selectedRecordIds.has(record.id) ? '#4CAF50' : '#999'}
                    />
                  </View>
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordHospital}>{record.ten_benh_vien}</Text>
                    <Text style={styles.recordDiagnosis}>
                      {record.chan_doan_ra || record.chan_doan_vao || 'Chưa có chẩn đoán'}
                    </Text>
                    <Text style={styles.recordDate}>
                      {new Date(record.ngay_kham).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.selectorFooter}>
              <Text style={styles.selectedCount}>
                Đã chọn: {selectedRecordIds.size}/{records.length} hồ sơ
              </Text>
              <TouchableOpacity
                style={[
                 
                ]}
                onPress={handleConfirmSelection}
                disabled={selectedRecordIds.size === 0}
              >
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Comprehensive Analysis Results Modal */}
      <Modal
        visible={showAnalysisModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAnalysisModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.analysisModal}>
            <View style={styles.analysisHeader}>
              <Ionicons name="analytics" size={32} color="#4CAF50" />
              <Text style={styles.analysisTitle}>Phân tích hồ sơ</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowAnalysisModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.analysisContent}>
              {analysis && (
                <>
                  {/* Disclaimer - Đặt đầu tiên */}
                  <View style={styles.disclaimerBox}>
                    <Ionicons name="warning" size={24} color="#F44336" />
                    <Text style={styles.disclaimerBoxText}>
                      🚫 CẢNH BÁO QUAN TRỌNG:{'\n\n'}
                      Đây chỉ là công cụ PHÂN TÍCH và THAM KHẢO thông tin.{'\n\n'}
                         BẮT BUỘC phải đến bác sĩ/phòng khám chuyên khoa để được khám, chẩn đoán và điều trị.
                    </Text>
                  </View>

                  {/* Patient Summary */}
                  <View style={styles.modalAnalysisSection}>
                    <Text style={styles.sectionHeader}>👤 Tóm tắt bệnh nhân</Text>
                    <View style={styles.summaryContent}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryItemTitle}>Lịch sử bệnh:</Text>
                        {(analysis.patient_summary?.medical_history || []).map((item, index) => (
                          <Text key={index} style={styles.summaryItemText}>• {item}</Text>
                        ))}
                      </View>
                      
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryItemTitle}>Tình trạng hiện tại:</Text>
                        {(analysis.patient_summary?.current_conditions || []).map((item, index) => (
                          <Text key={index} style={styles.summaryItemText}>• {item}</Text>
                        ))}
                      </View>

                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryItemTitle}>Yếu tố nguy cơ:</Text>
                        {(analysis.patient_summary?.risk_factors || []).map((item, index) => (
                          <Text key={index} style={styles.riskFactorText}>⚠️ {item}</Text>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Disease Progression Prediction */}
                  <View style={styles.modalAnalysisSection}>
                    <Text style={styles.sectionHeader}>📈 Dự đoán diễn biến bệnh</Text>
                    <View style={styles.progressionContent}>
                      <Text style={styles.currentStatus}>
                        Tình trạng hiện tại: {analysis.disease_progression?.current_status || 'Đang đánh giá'}
                      </Text>
                      
                      <Text style={styles.progressionTitle}>Diễn biến có thể xảy ra:</Text>
                      {(analysis.disease_progression?.likely_progression || []).map((item, index) => (
                        <Text key={index} style={styles.progressionItem}>📊 {item}</Text>
                      ))}

                      <Text style={styles.timelineTitle}>Dự đoán theo thời gian:</Text>
                      {(analysis.disease_progression?.timeline_predictions || []).map((timeline, index) => (
                        <View key={index} style={styles.timelineItem}>
                          <View style={styles.timelineHeader}>
                            <Text style={styles.timelineFrame}>{timeline.timeframe}</Text>
                            <Text style={styles.timelineProbability}>{timeline.probability}%</Text>
                          </View>
                          {timeline.expected_changes.map((change, idx) => (
                            <Text key={idx} style={styles.timelineChange}>• {change}</Text>
                          ))}
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Proactive Management */}
                  <View style={styles.modalAnalysisSection}>
                    <Text style={styles.sectionHeader}>🎯 Quản lý chủ động</Text>
                    <View style={styles.managementContent}>
                      <View style={styles.managementItem}>
                        <Text style={styles.managementTitle}>Hành động ngay:</Text>
                        {(analysis.proactive_management?.immediate_actions || []).map((action, index) => (
                          <Text key={index} style={styles.immediateAction}>🚀 {action}</Text>
                        ))}
                      </View>

                      <View style={styles.managementItem}>
                        <Text style={styles.managementTitle}>Thay đổi lối sống:</Text>
                        {(analysis.proactive_management?.lifestyle_modifications || []).map((mod, index) => (
                          <Text key={index} style={styles.lifestyleMod}>🏃‍♂️ {mod}</Text>
                        ))}
                      </View>

                      <View style={styles.managementItem}>
                        <Text style={styles.managementTitle}>Lịch theo dõi:</Text>
                        {(analysis.proactive_management?.monitoring_schedule || []).map((schedule, index) => (
                          <Text key={index} style={styles.monitoringItem}>📅 {schedule}</Text>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Risk Mitigation */}
                  <View style={styles.modalAnalysisSection}>
                    <Text style={styles.sectionHeader}>⚠️ Giảm thiểu rủi ro</Text>
                    <View style={styles.riskContent}>
                      <View style={styles.riskItem}>
                        <Text style={styles.riskTitle}>Rủi ro ưu tiên cao:</Text>
                        {(analysis.risk_mitigation?.high_priority_risks || []).map((risk, index) => (
                          <Text key={index} style={styles.highRisk}>🔴 {risk}</Text>
                        ))}
                      </View>

                      <View style={styles.riskItem}>
                        <Text style={styles.riskTitle}>Cách tránh:</Text>
                        {(analysis.risk_mitigation?.avoidance_strategies || []).map((strategy, index) => (
                          <Text key={index} style={styles.avoidanceStrategy}>🛡️ {strategy}</Text>
                        ))}
                      </View>

                      <View style={styles.riskItem}>
                        <Text style={styles.riskTitle}>Dấu hiệu cảnh báo sớm:</Text>
                        {(analysis.risk_mitigation?.early_warning_signs || []).map((sign, index) => (
                          <Text key={index} style={styles.warningSign}>⚡ {sign}</Text>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Personalized Recommendations */}
                  <View style={styles.modalAnalysisSection}>
                    <Text style={styles.sectionHeader}>💡 Khuyến nghị cá nhân</Text>
                    <View style={styles.recommendationsContent}>
                      <View style={styles.recommendationCategory}>
                        <Text style={styles.categoryTitle}>Dựa trên lịch sử:</Text>
                        {(analysis.personalized_recommendations?.based_on_history || []).map((rec, index) => (
                          <Text key={index} style={styles.recommendationItem}>📚 {rec}</Text>
                        ))}
                      </View>

                      <View style={styles.recommendationCategory}>
                        <Text style={styles.categoryTitle}>Theo bệnh viện đã đến:</Text>
                        {(analysis.personalized_recommendations?.hospital_specific || []).map((rec, index) => (
                          <Text key={index} style={styles.recommendationItem}>🏥 {rec}</Text>
                        ))}
                      </View>

                      <View style={styles.recommendationCategory}>
                        <Text style={styles.categoryTitle}>Theo tình trạng bệnh:</Text>
                        {(analysis.personalized_recommendations?.condition_specific || []).map((rec, index) => (
                          <Text key={index} style={styles.recommendationItem}>🩺 {rec}</Text>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Evidence Sources */}
                  <View style={styles.modalAnalysisSection}>
                    <Text style={styles.sectionHeader}>📚 Nguồn tham khảo</Text>
                    <View style={styles.sourcesContent}>
                      <Text style={styles.sourcesTitle}>Hướng dẫn y tế:</Text>
                      {(analysis.evidence_sources?.medical_guidelines || []).map((guideline, index) => (
                        <Text key={index} style={styles.sourceItem}>📖 {guideline}</Text>
                      ))}
                      
                      <Text style={styles.sourcesTitle}>Nghiên cứu khoa học:</Text>
                      {(analysis.evidence_sources?.research_citations || []).map((citation, index) => (
                        <Text key={index} style={styles.sourceItem}>🔬 {citation}</Text>
                      ))}
                      
                     
                       
                      
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  approvalBadge: {
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
  approvalText: {
    fontSize: 12,
    color: '#C62828',
    fontWeight: 'bold',
    flex: 1,
  },
  remindersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  remindersButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  analysisSection: {
    padding: 15,
  },
  quickActionBanner: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  addRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  addRecordText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  hospitalList: {
    marginBottom: 15,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  hospitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  hospitalName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  hospitalCount: {
    fontSize: 12,
    color: '#666',
  },
  conditionList: {
    marginBottom: 10,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  conditionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  symptomsCard: {
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
  symptomsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  symptomsToggleText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  symptomsInput: {
    marginTop: 15,
  },
  symptomsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  symptomsTextInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fafafa',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  symptomsHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  analyzeButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    gap: 10,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  analysisInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  analysisInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#2196F3',
    lineHeight: 18,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  analysisModal: {
    backgroundColor: 'white',
    borderRadius: 15,
    width: '100%',
    maxHeight: '90%',
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginLeft: 10,
  },
  modalCloseButton: {
    padding: 5,
  },
  analysisContent: {
    padding: 20,
  },
  evidenceSection: {
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  evidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  evidenceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    flex: 1,
    marginLeft: 8,
  },
  reliabilityScore: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reliabilityScoreText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  confidenceLevel: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 8,
  },
  primarySource: {
    fontSize: 13,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
  modalAnalysisSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryContent: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
  },
  summaryItem: {
    marginBottom: 12,
  },
  summaryItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  summaryItemText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
    lineHeight: 18,
  },
  riskFactorText: {
    fontSize: 14,
    color: '#F44336',
    marginBottom: 3,
    lineHeight: 18,
  },
  progressionContent: {
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 8,
  },
  currentStatus: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 12,
  },
  progressionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  progressionItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  timelineItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timelineFrame: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  timelineProbability: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  timelineChange: {
    fontSize: 13,
    color: '#333',
    marginBottom: 2,
    lineHeight: 16,
  },
  managementContent: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
  },
  managementItem: {
    marginBottom: 15,
  },
  managementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 6,
  },
  immediateAction: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
    lineHeight: 18,
  },
  lifestyleMod: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
    lineHeight: 18,
  },
  monitoringItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
    lineHeight: 18,
  },
  riskContent: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
  },
  riskItem: {
    marginBottom: 12,
  },
  riskTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 6,
  },
  highRisk: {
    fontSize: 14,
    color: '#F44336',
    marginBottom: 3,
    lineHeight: 18,
  },
  avoidanceStrategy: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
    lineHeight: 18,
  },
  warningSign: {
    fontSize: 14,
    color: '#F44336',
    marginBottom: 3,
    lineHeight: 18,
  },
  recommendationsContent: {
    backgroundColor: '#f3e5f5',
    padding: 15,
    borderRadius: 8,
  },
  recommendationCategory: {
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9C27B0',
    marginBottom: 6,
  },
  recommendationItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
    lineHeight: 18,
  },
  sourcesContent: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
  },
  sourcesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
  },
  sourceItem: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  reliabilityFooter: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  reliabilityText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  disclaimerSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff8e1',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    gap: 10,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    color: '#FF9800',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFEBEE',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 4,
    borderColor: '#D32F2F',
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  disclaimerBoxText: {
    fontSize: 15,
    color: '#B71C1C',
    marginLeft: 12,
    flex: 1,
    lineHeight: 24,
    fontWeight: 'bold',
  },
  selectorModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
    width: '100%',
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  selectorActions: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  selectAllText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  clearText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '600',
  },
  recordList: {
    flex: 1,
  },
  recordListContent: {
    padding: 15,
    paddingBottom: 30,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  recordItemSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  recordCheckbox: {
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordHospital: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  recordDiagnosis: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  recordDate: {
    fontSize: 12,
    color: '#999',
  },
  selectorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  selectedCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
})