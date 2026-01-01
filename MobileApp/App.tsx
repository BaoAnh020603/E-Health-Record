import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import * as Linking from 'expo-linking'
import { supabase } from './lib/supabase'
import AppNavigator from './navigation/AppNavigator'
import './config/logging' // Tắt console logs

export default function App() {
  useEffect(() => {
    // Handle deep links for OAuth callback (simplified)
    const handleDeepLink = (url: string) => {
      // Check if this is an OAuth callback with tokens
      if (url.includes('access_token')) {
        console.log('OAuth callback detected - session should be handled by auth service')
        // The auth service now handles session setting directly
        // This is just for logging/debugging
      }
    }

    // Listen for deep links
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url)
    })

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url)
      }
    })

    return () => {
      subscription?.remove()
    }
  }, [])

  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  )
}
