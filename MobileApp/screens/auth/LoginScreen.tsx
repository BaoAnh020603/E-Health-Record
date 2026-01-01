import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { signInWithGoogle } from '../../services/auth'

export default function LoginScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const result = await signInWithGoogle()
      
      if (result.success) {
        // Check if we got a session immediately (new fast flow)
        if (result.session) {
          // No need to show alert, navigation will happen automatically
        } else {
          // Fallback message for slower OAuth flows
          Alert.alert(
            'Đăng nhập Google',
            result.message || 'Đăng nhập thành công! Đang chuyển hướng...',
            [{ text: 'OK' }]
          )
        }
        // Navigation will be handled automatically by AppNavigator
      } else {
        Alert.alert(
          'Không thể đăng nhập', 
          result.error + (result.details ? `\n\nChi tiết: ${result.details}` : ''),
          [
            { text: 'OK' },
            { 
              text: 'Hướng dẫn cấu hình', 
              onPress: () => Alert.alert(
                'Cấu hình Google OAuth',
                '1. Vào Supabase Dashboard\n2. Authentication > Providers\n3. Bật Google provider\n4. Thêm Client ID và Secret từ Google Cloud Console'
              )
            }
          ]
        )
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      Alert.alert('Lỗi', 'Có lỗi không mong muốn xảy ra')
    } finally {
      setLoading(false)
    }
  }



  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Ionicons name="medical" size={80} color="#2196F3" />
          <Text style={styles.title}>Hồ Sơ Y Tế</Text>
          <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>
        </View>

        <View style={styles.form}>
          {/* Google Login */}
          <TouchableOpacity
            style={[styles.googleButton, loading && styles.buttonDisabled]}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <Ionicons name="logo-google" size={24} color="white" />
            <Text style={styles.googleButtonText}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập với Google'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Bằng việc đăng nhập, bạn đồng ý với{'\n'}
            <Text style={styles.linkText}>Điều khoản sử dụng</Text> và{' '}
            <Text style={styles.linkText}>Chính sách bảo mật</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  googleButton: {
    backgroundColor: '#DB4437',
    borderRadius: 10,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  googleButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    lineHeight: 18,
  },
  linkText: {
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
})