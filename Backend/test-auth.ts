// test-auth.ts
import { signUp, signIn } from './lib/supabase-client'

async function testAuth() {
  // Test sign up
  const result = await signUp({
    email: 'test@example.com',
    password: 'Test123456!',
    ho_ten: 'Nguyễn Văn Test'
  })
  console.log('Sign up:', result)

  // Test sign in
  const loginResult = await signIn('test@example.com', 'Test123456!')
  console.log('Sign in:', loginResult)
}

testAuth()