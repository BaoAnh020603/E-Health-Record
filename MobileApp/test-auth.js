// Simple test to check Supabase Google OAuth configuration
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://aadydqifnwrcbjtxanje.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZHlkcWlmbndyY2JqdHhhbmplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzQ2ODksImV4cCI6MjA4MDk1MDY4OX0.KpfPaLJZto07-sXfceCXXdJVKBJZzrzq8J5X1dTPZlc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testGoogleAuth() {
  try {
    console.log('Testing Google OAuth configuration...')
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback'
      }
    })
    
    if (error) {
      console.error('❌ Google OAuth Error:', error.message)
      
      if (error.message.includes('Provider not found')) {
        console.log('\n🔧 Solution: Enable Google OAuth in Supabase Dashboard')
        console.log('1. Go to: https://supabase.com/dashboard/project/aadydqifnwrcbjtxanje/auth/providers')
        console.log('2. Find "Google" and enable it')
        console.log('3. Add redirect URL: exp://localhost:8081/--/auth/callback')
      }
    } else {
      console.log('✅ Google OAuth is configured correctly')
      console.log('Auth URL:', data.url)
    }
  } catch (err) {
    console.error('❌ Test failed:', err.message)
  }
}

testGoogleAuth()