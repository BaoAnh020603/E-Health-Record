import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

export default function WelcomeScreen({ navigation }: any) {
  const handleGetStarted = () => {
    navigation.navigate('Auth')
  }

  const features = [
    {
      icon: 'sparkles',
      title: 'Trợ lý AI Y tế',
      description: 'AI thông minh giải thích thuật ngữ y tế và dự đoán nguy cơ bệnh tật'
    },
    {
      icon: 'medical',
      title: 'Hồ Sơ Y Tế Điện Tử',
      description: 'Quản lý toàn bộ hồ sơ y tế cá nhân một cách an toàn và tiện lợi'
    },
    {
      icon: 'shield-checkmark',
      title: 'Bảo Mật Cao',
      description: 'Thông tin y tế được mã hóa và bảo vệ theo tiêu chuẩn quốc tế'
    },
    {
      icon: 'share',
      title: 'Chia Sẻ Dễ Dàng',
      description: 'Chia sẻ hồ sơ với bác sĩ và bệnh viện một cách nhanh chóng'
    }
  ]

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="medical" size={40} color="white" />
            </View>
            <Text style={styles.logoText}>E-Health Record</Text>
            <Text style={styles.logoSubtext}>Hệ Thống Quản Lý Hồ Sơ Y Tế</Text>
          </View>
          
          <View style={styles.hospitalInfo}>
            <View style={styles.infoCard}>
              <Ionicons name="people" size={16} color="white" />
              <Text style={styles.infoText}>Phục vụ bệnh nhân</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Chào mừng bạn đến với hệ thống quản lý hồ sơ y tế</Text>
          <Text style={styles.welcomeDescription}>
            Quản lý hồ sơ y tế thông minh, an toàn và tiện lợi
          </Text>
        </View>

        {/* AI Features Introduction */}
        <View style={styles.aiIntroSection}>
          <View style={styles.aiIntroCard}>
            <View style={styles.aiIntroHeader}>
              <View style={styles.aiIconLarge}>
                <Ionicons name="sparkles" size={32} color="#4CAF50" />
              </View>
              <Text style={styles.aiIntroTitle}>Trợ lý AI Y tế Thông minh</Text>
              <Text style={styles.aiIntroSubtitle}>
                Giúp bạn hiểu rõ hơn về sức khỏe
              </Text>
            </View>

            <View style={styles.aiFeaturesList}>
              <View style={styles.aiFeatureItem}>
                <View style={styles.aiFeatureIcon}>
                  <Ionicons name="sparkles" size={20} color="#4CAF50" />
                </View>
                <View style={styles.aiFeatureContent}>
                  <Text style={styles.aiFeatureTitle}>Giải thích Y tế phức tạp</Text>
                  <Text style={styles.aiFeatureDescription}>
                    Giải thích thuật ngữ y tế phức tạp thành ngôn ngữ dễ hiểu
                  </Text>
                </View>
              </View>

              <View style={styles.aiFeatureItem}>
                <View style={styles.aiFeatureIcon}>
                  <Ionicons name="analytics" size={20} color="#2196F3" />
                </View>
                <View style={styles.aiFeatureContent}>
                  <Text style={styles.aiFeatureTitle}>Dự đoán & Phòng ngừa</Text>
                  <Text style={styles.aiFeatureDescription}>
                    Phân tích nguy cơ bệnh tật và đưa ra lời khuyên phòng ngừa
                  </Text>
                </View>
              </View>

              <View style={styles.aiFeatureItem}>
                <View style={styles.aiFeatureIcon}>
                  <Ionicons name="bulb" size={20} color="#FFD93D" />
                </View>
                <View style={styles.aiFeatureContent}>
                  <Text style={styles.aiFeatureTitle}>Tư vấn Cá nhân hóa</Text>
                  <Text style={styles.aiFeatureDescription}>
                    Lời khuyên sức khỏe được cá nhân hóa dựa trên hồ sơ của bạn
                  </Text>
                </View>
              </View>

              <View style={styles.aiFeatureItem}>
                <View style={styles.aiFeatureIcon}>
                  <Ionicons name="school" size={20} color="#4CAF50" />
                </View>
                <View style={styles.aiFeatureContent}>
                  <Text style={styles.aiFeatureTitle}>Tra cứu Y tế Tự do</Text>
                  <Text style={styles.aiFeatureDescription}>
                    Giải thích bất kỳ thuật ngữ y tế nào bạn muốn.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        {/* Features Grid */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Tính Năng Nổi Bật</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon as any} size={24} color="#2196F3" />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Lợi Ích Cho Bạn</Text>
          <View style={styles.benefitsList}>
          
            <View style={styles.benefitItem}>
              <Ionicons name="search" size={20} color="#2196F3" />
              <Text style={styles.benefitText}>Tra cứu bất kỳ thuật ngữ y tế nào bạn muốn</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="play-circle" size={20} color="#F44336" />
              <Text style={styles.benefitText}>Video minh họa về bệnh lý</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="analytics" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>Phân tích thông minh toàn bộ lịch sử y tế</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="trending-up" size={20} color="#2196F3" />
              <Text style={styles.benefitText}>Dự đoán diễn biến sức khỏe 3-6 tháng, 1-2 năm, 5-10 năm</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>Tiết kiệm thời gian khám bệnh</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>Giảm thiểu sai sót y khoa</Text>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <View style={styles.ctaCard}>
            <Ionicons name="rocket" size={32} color="#2196F3" />
            <Text style={styles.ctaTitle}>Sẵn sàng sử dụng?</Text>
            <Text style={styles.ctaDescription}>
              Tham gia để sử dụng ứng dụng của chúng tôi. 
              Trải nghiệm AI y tế thông minh!
            </Text>
            
            <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
              <View style={styles.buttonContent}>
                <Ionicons name="sparkles" size={20} color="white" />
                <Text style={styles.primaryButtonText}>Bắt Đầu sử dụng ứng dụng</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 E-Health Record. Được phát triển bởi sinh viên
          </Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Điều khoản</Text>
            </TouchableOpacity>
            <Text style={styles.footerSeparator}>•</Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Bảo mật</Text>
            </TouchableOpacity>
            <Text style={styles.footerSeparator}>•</Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Hỗ trợ</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#0066CC',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  logoSubtext: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginTop: 5,
  },
  hospitalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  infoText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 5,
  },
  content: {
    flex: 1,
  },
  welcomeSection: {
    padding: 20,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  statsSection: {
    padding: 20,
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  benefitsSection: {
    padding: 20,
  },
  benefitsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  benefitText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  ctaSection: {
    padding: 20,
  },
  ctaCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  ctaDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  primaryButton: {
    width: '100%',
    marginBottom: 15,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  secondaryButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 12,
    color: '#2196F3',
  },
  footerSeparator: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 10,
  },
  // AI Introduction Styles
  aiIntroSection: {
    padding: 20,
    marginBottom: 10,
  },
  aiIntroCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#f0f8ff',
  },
  aiIntroHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  aiIconLarge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  aiIntroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  aiIntroSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  aiFeaturesList: {
    marginBottom: 20,
  },
  aiFeatureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
    paddingHorizontal: 5,
  },
  aiFeatureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  aiFeatureContent: {
    flex: 1,
    paddingTop: 2,
  },
  aiFeatureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  aiFeatureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  aiHighlights: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 15,
    backgroundColor: '#f8fff8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8f5e8',
  },
  aiHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  aiHighlightText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 4,
  },
  aiDemoSection: {
    backgroundColor: '#fafbff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  aiDemoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  aiDemoCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  aiDemoInput: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  aiDemoOutput: {
    backgroundColor: '#f8fff8',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  aiDemoLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  aiDemoText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  // New Feature Highlight Styles
  newFeatureHighlight: {
    backgroundColor: '#f0fff4',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  newFeatureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  newFeatureText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  newFeatureContent: {
    flex: 1,
  },
  newFeatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  newFeatureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginLeft: 10,
  },
  newFeatureDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  ministryApproval: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  ministryText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 6,
  },
})