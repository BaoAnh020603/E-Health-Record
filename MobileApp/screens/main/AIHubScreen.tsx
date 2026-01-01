import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

const { width } = Dimensions.get('window')

interface AIFeature {
  id: string
  title: string
  subtitle: string
  icon: keyof typeof Ionicons.glyphMap
  gradient: [string, string]
  screen?: string
}

const AI_FEATURES: AIFeature[] = [
  {
    id: 'assistant-hub',
    title: 'Tra cứu Y khoa',
    subtitle: 'Tra cứu và giải thích thuật ngữ y tế',
    icon: 'school',
    gradient: ['#4CAF50', '#388E3C'],
    screen: 'MedicalTermExplainer'
  },
  {
    id: 'analysis-hub',
    title: 'Phân tích Hồ sơ & Nhắc nhở',
    subtitle: 'Phân tích chi tiết hồ sơ y tế và tạo nhắc nhở',
    icon: 'analytics',
    gradient: ['#66BB6A', '#43A047'],
    screen: 'IntelligentAnalysis'
  },
  {
    id: 'prediction',
    title: 'Dự đoán & Phòng ngừa',
    subtitle: 'Dự đoán nguy cơ bệnh tật',
    icon: 'trending-up',
    gradient: ['#81C784', '#4CAF50'],
    screen: 'DiseasePrediction'
  }
]

export default function AIHubScreen({ navigation }: any) {
  const handleFeaturePress = (feature: AIFeature) => {
    if (feature.screen) {
      navigation.navigate(feature.screen)
    }
  }

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#4CAF50', '#2E7D32']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Ionicons name="sparkles" size={40} color="white" />
          <Text style={styles.headerTitle}>AI Trợ lý Y tế</Text>
          <Text style={styles.headerSubtitle}>
            Chọn chức năng AI bạn muốn sử dụng
          </Text>
        </View>
      </LinearGradient>

      {/* AI Features Grid */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {AI_FEATURES.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={styles.featureCard}
              onPress={() => handleFeaturePress(feature)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={feature.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featureGradient}
              >
                <View style={styles.featureIconContainer}>
                  <Ionicons name={feature.icon} size={32} color="white" />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
                <View style={styles.featureArrow}>
                  <Ionicons 
                    name="arrow-forward" 
                    size={20} 
                    color="rgba(255,255,255,0.8)" 
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons name="information-circle" size={20} color="#FF9800" />
          <Text style={styles.disclaimerText}>
            AI chỉ mang tính chất tham khảo. Luôn tham khảo ý kiến bác sĩ chuyên khoa.
          </Text>
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
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
  },
  featureCard: {
    width: (width - 60) / 2,
    marginBottom: 5,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  featureGradient: {
    padding: 20,
    minHeight: 220,
    justifyContent: 'space-between',
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    lineHeight: 20,
  },
  featureSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 16,
    marginBottom: 8,
  },
  featureArrow: {
    alignSelf: 'flex-end',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    marginLeft: 10,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  submenuModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingBottom: 40,
    maxHeight: '50%',
  },
  submenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  submenuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  submenuContent: {
    padding: 20,
  },
  submenuHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  submenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  submenuIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  submenuTextContainer: {
    flex: 1,
  },
  submenuItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  submenuItemSubtitle: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
})
