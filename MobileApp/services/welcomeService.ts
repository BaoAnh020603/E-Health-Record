// services/welcomeService.ts
// Service for managing user welcome messages and login greetings

import { Alert } from 'react-native'

const LAST_LOGIN_KEY = 'lastLoginDate'
const FIRST_LOGIN_KEY = 'isFirstLogin'
const LOGIN_COUNT_KEY = 'loginCount'

export interface WelcomeData {
  isFirstLogin: boolean
  isReturningUser: boolean
  daysSinceLastLogin: number
  loginCount: number
  shouldShowWelcome: boolean
}

// Simple in-memory storage for demo purposes
// In production, you'd want to use AsyncStorage or SecureStore
let welcomeStorage: { [key: string]: string } = {}

/**
 * Check if user should see welcome message and get welcome data
 */
export async function getWelcomeData(): Promise<WelcomeData> {
  try {
    const now = new Date()
    
    const lastLoginStr = welcomeStorage['lastLoginDate']
    const isFirstLoginStr = welcomeStorage['isFirstLogin']
    const loginCountStr = welcomeStorage['loginCount']
    
    const isFirstLogin = isFirstLoginStr === undefined || isFirstLoginStr === 'true'
    const loginCount = parseInt(loginCountStr || '0')
    const lastLogin = lastLoginStr ? new Date(lastLoginStr) : null
    
    let daysSinceLastLogin = 0
    let isReturningUser = false
    let shouldShowWelcome = false
    
    if (lastLogin) {
      const timeDiff = now.getTime() - lastLogin.getTime()
      daysSinceLastLogin = Math.floor(timeDiff / (1000 * 3600 * 24))
      isReturningUser = daysSinceLastLogin > 0
      shouldShowWelcome = daysSinceLastLogin >= 1 // Show welcome if been away for 1+ days
    }
    
    // Update storage
    welcomeStorage['lastLoginDate'] = now.toISOString()
    welcomeStorage['isFirstLogin'] = 'false'
    welcomeStorage['loginCount'] = (loginCount + 1).toString()
    
    return {
      isFirstLogin,
      isReturningUser,
      daysSinceLastLogin,
      loginCount: loginCount + 1,
      shouldShowWelcome: isFirstLogin || shouldShowWelcome
    }
  } catch (error) {
    console.error('Welcome data error:', error)
    return {
      isFirstLogin: false,
      isReturningUser: false,
      daysSinceLastLogin: 0,
      loginCount: 1,
      shouldShowWelcome: false
    }
  }
}

/**
 * Show appropriate welcome message based on user status
 */
export function showWelcomeMessage(welcomeData: WelcomeData, userName?: string) {
  const name = userName ? userName.split(' ')[0] : 'bạn'
  
  if (welcomeData.isFirstLogin) {
    Alert.alert(
      '🎉 Chào mừng đến với E-Health Record!',
      `Xin chào ${name}!\n\nChúc mừng bạn đã tham gia cộng đồng quản lý sức khỏe thông minh. Ứng dụng sẽ giúp bạn:\n\n• Lưu trữ hồ sơ y tế an toàn\n• Nhận tư vấn từ AI y tế\n• Theo dõi sức khỏe dễ dàng\n• Chia sẻ thông tin với bác sĩ\n\nHãy bắt đầu bằng cách tạo hồ sơ cá nhân!`,
      [{ text: 'Bắt đầu ngay!', style: 'default' }]
    )
  } else if (welcomeData.isReturningUser && welcomeData.daysSinceLastLogin >= 7) {
    Alert.alert(
      '👋 Chào mừng trở lại!',
      `Rất vui được gặp lại ${name}!\n\nBạn đã không sử dụng ứng dụng ${welcomeData.daysSinceLastLogin} ngày rồi. Có gì mới không?\n\n• Kiểm tra hồ sơ y tế mới nhất\n• Tham khảo AI về sức khỏe\n• Cập nhật thông tin cá nhân`,
      [{ text: 'Khám phá ngay!', style: 'default' }]
    )
  } else if (welcomeData.isReturningUser && welcomeData.daysSinceLastLogin >= 1) {
    // Subtle welcome for daily users
    const messages = [
      `Chào ${name}! Hy vọng bạn đang khỏe mạnh.`,
      `Xin chào ${name}! Hôm nay cảm thấy thế nào?`,
      `Chào mừng trở lại, ${name}!`,
      `${name} ơi, chúc bạn một ngày tốt lành!`
    ]
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)]
    
    // Show as a brief toast-like alert
    setTimeout(() => {
      Alert.alert('😊', randomMessage, [{ text: 'Cảm ơn!', style: 'default' }])
    }, 1000)
  }
}

/**
 * Get personalized greeting based on time and user data
 */
export function getPersonalizedGreeting(userName?: string, welcomeData?: WelcomeData): string {
  const hour = new Date().getHours()
  const name = userName ? userName.split(' ')[0] : 'bạn'
  
  let baseGreeting = ''
  if (hour < 12) {
    baseGreeting = `Chào buổi sáng, ${name}!`
  } else if (hour < 18) {
    baseGreeting = `Chào buổi chiều, ${name}!`
  } else {
    baseGreeting = `Chào buổi tối, ${name}!`
  }
  
  if (welcomeData?.isFirstLogin) {
    return `${baseGreeting} Chào mừng đến với E-Health Record!`
  } else if (welcomeData?.isReturningUser && welcomeData.daysSinceLastLogin >= 7) {
    return `${baseGreeting} Rất vui được gặp lại bạn!`
  } else if (welcomeData?.loginCount && welcomeData.loginCount % 10 === 0) {
    return `${baseGreeting} Đây là lần thứ ${welcomeData.loginCount} bạn sử dụng ứng dụng!`
  }
  
  return baseGreeting
}

/**
 * Get motivational health tip for the day
 */
export function getDailyHealthTip(): string {
  const tips = [
    'Hãy uống đủ 8 ly nước mỗi ngày để cơ thể khỏe mạnh!',
    'Đi bộ 30 phút mỗi ngày giúp cải thiện sức khỏe tim mạch.',
    'Ngủ đủ 7-8 tiếng mỗi đêm để cơ thể phục hồi tốt nhất.',
    'Ăn nhiều rau xanh và trái cây tươi để bổ sung vitamin.',
    'Hãy thở sâu và thư giãn khi cảm thấy căng thẳng.',
    'Kiểm tra sức khỏe định kỳ để phát hiện sớm các vấn đề.',
    'Tập yoga hoặc thiền định giúp giảm stress hiệu quả.',
    'Hạn chế đồ ăn nhanh và thức ăn chế biến sẵn.',
    'Rửa tay thường xuyên để phòng ngừa bệnh tật.',
    'Duy trì thói quen tập thể dục đều đặn mỗi tuần.'
  ]
  
  // Use date as seed for consistent daily tip
  const today = new Date()
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
  
  return tips[dayOfYear % tips.length]
}

/**
 * Reset welcome data (for testing purposes)
 */
export async function resetWelcomeData(): Promise<void> {
  try {
    welcomeStorage = {}
    console.log('Welcome data reset successfully')
  } catch (error) {
    console.error('Failed to reset welcome data:', error)
  }
}