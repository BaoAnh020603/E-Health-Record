import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'
import { getCurrentUserProfile } from '../services/auth'

// Custom Components
import CustomTabBar from '../components/CustomTabBar'

// Welcome Screen
import WelcomeScreen from '../screens/WelcomeScreen'

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen'

// Main Screens
import HomeScreen from '../screens/main/HomeScreen'
import MedicalRecordsScreen from '../screens/main/MedicalRecordsScreen'
import RecordDetailScreen from '../screens/main/RecordDetailScreen'
import CreateRecordScreen from '../screens/main/CreateRecordScreen'
import EditRecordScreen from '../screens/main/EditRecordScreen'
import ProfileScreen from '../screens/main/ProfileScreen'
import ProfileSetupScreen from '../screens/main/ProfileSetupScreen'
import QRCodeDisplayScreen from '../screens/main/QRCodeDisplayScreen'
import ShareScreen from '../screens/main/ShareScreen'
import QRScannerScreen from '../screens/main/QRScannerScreen'
import AIHubScreen from '../screens/main/AIHubScreen'
import AIMedicalAssistantScreen from '../screens/main/AIMedicalAssistantScreen'
import DiseasePredictionScreen from '../screens/main/DiseasePredictionScreen'
import MedicalRecordAnalysisScreen from '../screens/main/MedicalRecordAnalysisScreen'
import IntelligentMedicalAnalysisScreen from '../screens/main/IntelligentMedicalAnalysisScreen'
import MedicalTermExplainerScreen from '../screens/main/MedicalTermExplainerScreen'
import SmartRemindersScreen from '../screens/main/SmartRemindersScreen'
import MedicationRemindersScreen from '../screens/main/MedicationRemindersScreen'

// Prescription OCR Screens
import PrescriptionUploadScreen from '../screens/PrescriptionUploadScreen'
import PrescriptionAnalysisScreen from '../screens/PrescriptionAnalysisScreen'
import PrescriptionDetailScreen from '../screens/PrescriptionDetailScreen'
import ReminderReviewScreen from '../screens/ReminderReviewScreen'
import ReminderConfirmationScreen from '../screens/ReminderConfirmationScreen'

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ tabBarLabel: 'Trang chủ' }}
      />
      <Tab.Screen 
        name="Records" 
        component={MedicalRecordsScreen} 
        options={{ tabBarLabel: 'Hồ sơ' }}
      />
      <Tab.Screen 
        name="AIHub" 
        component={AIHubScreen} 
        options={{ tabBarLabel: 'AI' }}
      />
      <Tab.Screen 
        name="Share" 
        component={ShareScreen} 
        options={{ tabBarLabel: 'Chia sẻ' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarLabel: 'Cá nhân' }}
      />
    </Tab.Navigator>
  )
}

function WelcomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Auth" component={AuthStack} />
    </Stack.Navigator>
  )
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  )
}

function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerBackTitle: 'Quay về'
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RecordDetail" 
        component={RecordDetailScreen}
        options={{ title: 'Chi tiết hồ sơ' }}
      />
      <Stack.Screen 
        name="CreateRecord" 
        component={CreateRecordScreen}
        options={{ title: 'Tạo hồ sơ mới' }}
      />
      <Stack.Screen 
        name="EditRecord" 
        component={EditRecordScreen}
        options={{ title: 'Chỉnh sửa hồ sơ' }}
      />
      <Stack.Screen 
        name="QRScanner" 
        component={QRScannerScreen}
        options={{ title: 'Quét mã QR' }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={ProfileSetupScreen}
        options={{ 
          title: 'Chỉnh sửa thông tin',
          headerStyle: { backgroundColor: '#2196F3' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />
      <Stack.Screen 
        name="QRCodeDisplay" 
        component={QRCodeDisplayScreen}
        options={{ headerShown: false }}
      />
      {/* AI Features */}
      <Stack.Screen 
        name="AIAssistant" 
        component={AIMedicalAssistantScreen}
        options={{ title: 'AI Trợ lý Y tế' }}
      />
      <Stack.Screen 
        name="IntelligentAnalysis" 
        component={IntelligentMedicalAnalysisScreen}
        options={{ title: 'Phân tích Hồ sơ' }}
      />
      <Stack.Screen 
        name="RecordAnalysis" 
        component={MedicalRecordAnalysisScreen}
        options={{ title: 'Phân tích Đơn lẻ' }}
      />
      <Stack.Screen 
        name="MedicalTermExplainer" 
        component={MedicalTermExplainerScreen}
        options={{ title: 'Tra cứu Y khoa' }}
      />
      <Stack.Screen 
        name="SmartReminders" 
        component={SmartRemindersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="MedicationReminders" 
        component={MedicationRemindersScreen}
        options={{ title: 'Nhắc nhở uống thuốc' }}
      />
      <Stack.Screen 
        name="DiseasePrediction" 
        component={DiseasePredictionScreen}
        options={{ title: 'Dự đoán & Phòng ngừa' }}
      />
      {/* Prescription OCR */}
      <Stack.Screen 
        name="PrescriptionUpload" 
        component={PrescriptionUploadScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PrescriptionAnalysis" 
        component={PrescriptionAnalysisScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PrescriptionDetail" 
        component={PrescriptionDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ReminderConfirmation" 
        component={ReminderConfirmationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ReminderReview" 
        component={ReminderReviewScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  )
}

export default function AppNavigator() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      // Don't force profile setup on app restart, only on fresh login
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // User just logged in - force profile setup immediately
        setSession(session)
        setNeedsProfileSetup(true)
        setLoading(false)
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Token refresh - keep current state
        setSession(session)
        setLoading(false)
      } else if (event === 'SIGNED_OUT') {
        // User logged out
        setSession(null)
        setNeedsProfileSetup(false)
        setLoading(false)
      } else if (session) {
        // Other events with session
        setSession(session)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const checkProfileSetup = async () => {
    try {
      const profile = await getCurrentUserProfile()
      
      // Always force profile setup after login - users must update info first
      setNeedsProfileSetup(true)
    } catch (error) {
      console.error('Error checking profile setup:', error)
      // On error, show profile setup to be safe
      setNeedsProfileSetup(true)
    } finally {
      setLoading(false)
    }
  }

  // Function to be called when profile setup is completed
  const onProfileSetupComplete = () => {
    setNeedsProfileSetup(false)
  }

  if (loading) {
    return null
  }

  return (
    <NavigationContainer>
      {!session ? (
        <WelcomeStack />
      ) : needsProfileSetup ? (
        <Stack.Navigator screenOptions={{ headerBackTitle: 'Quay về' }}>
          <Stack.Screen 
            name="ProfileSetup" 
            options={{ 
              title: 'Cập nhật thông tin cá nhân',
              headerStyle: { backgroundColor: '#2196F3' },
              headerTintColor: 'white',
              headerTitleStyle: { fontWeight: 'bold' },
              headerShown: true,
              headerLeft: () => null // Prevent going back to login
            }}
          >
            {(props) => <ProfileSetupScreen {...props} onComplete={onProfileSetupComplete} />}
          </Stack.Screen>
          <Stack.Screen name="QRCodeDisplay" component={QRCodeDisplayScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen 
            name="QRScanner" 
            component={QRScannerScreen}
            options={{ title: 'Quét mã QR', headerShown: true }}
          />
          <Stack.Screen 
            name="EditProfile" 
            component={ProfileSetupScreen}
            options={{ 
              title: 'Chỉnh sửa thông tin',
              headerStyle: { backgroundColor: '#2196F3' },
              headerTintColor: 'white',
              headerTitleStyle: { fontWeight: 'bold' },
              headerShown: true
            }}
          />
          <Stack.Screen 
            name="RecordDetail" 
            component={RecordDetailScreen}
            options={{ title: 'Chi tiết hồ sơ', headerShown: true }}
          />
          <Stack.Screen 
            name="CreateRecord" 
            component={CreateRecordScreen}
            options={{ title: 'Tạo hồ sơ mới', headerShown: true }}
          />
          <Stack.Screen 
            name="EditRecord" 
            component={EditRecordScreen}
            options={{ title: 'Chỉnh sửa hồ sơ', headerShown: true }}
          />
          {/* AI Features */}
          <Stack.Screen 
            name="AIAssistant" 
            component={AIMedicalAssistantScreen}
            options={{ title: 'AI Trợ lý Y tế', headerShown: true }}
          />
          <Stack.Screen 
            name="IntelligentAnalysis" 
            component={IntelligentMedicalAnalysisScreen}
            options={{ title: 'Phân tích Hồ sơ', headerShown: true }}
          />
          <Stack.Screen 
            name="MedicalTermExplainer" 
            component={MedicalTermExplainerScreen}
            options={{ title: 'Tra cứu Y khoa', headerShown: true }}
          />
          <Stack.Screen 
            name="MedicationReminders" 
            component={MedicationRemindersScreen}
            options={{ title: 'Nhắc nhở uống thuốc', headerShown: true }}
          />
          <Stack.Screen 
            name="DiseasePrediction" 
            component={DiseasePredictionScreen}
            options={{ title: 'Dự đoán & Phòng ngừa', headerShown: true }}
          />
          {/* Prescription OCR */}
          <Stack.Screen 
            name="PrescriptionUpload" 
            component={PrescriptionUploadScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="PrescriptionAnalysis" 
            component={PrescriptionAnalysisScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="PrescriptionDetail" 
            component={PrescriptionDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="ReminderReview" 
            component={ReminderReviewScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      ) : (
        <MainStack />
      )}
    </NavigationContainer>
  )
}