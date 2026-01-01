// Test script to verify database setup
// Run this with: npx ts-node test-database-setup.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aadydqifnwrcbjtxanje.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZHlkcWlmbndyY2JqdHhhbmplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzQ2ODksImV4cCI6MjA4MDk1MDY4OX0.KpfPaLJZto07-sXfceCXXdJVKBJZzrzq8J5X1dTPZlc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDatabaseSetup() {
  console.log('🔍 Testing database setup...\n')

  try {
    // Test 1: Check if users_profile table exists
    console.log('1. Testing users_profile table existence...')
    const { data: tableTest, error: tableError } = await supabase
      .from('users_profile')
      .select('count')
      .limit(1)

    if (tableError) {
      console.error('❌ users_profile table test failed:', tableError.message)
      
      if (tableError.message.includes('relation "users_profile" does not exist')) {
        console.log('\n📋 SOLUTION: Run the following migration in Supabase Dashboard:')
        console.log('   1. Go to Supabase Dashboard > SQL Editor')
        console.log('   2. Create new query')
        console.log('   3. Copy and paste the content from:')
        console.log('      Backend/supabase/functions/migrations/008_create_users_profile_table.sql')
        console.log('   4. Run the query')
      }
      return
    }
    console.log('✅ users_profile table exists')

    // Test 2: Check RLS policies
    console.log('\n2. Testing RLS policies...')
    
    // This will fail if RLS policies are not set up correctly
    const { data: policyTest, error: policyError } = await supabase
      .from('users_profile')
      .select('id')
      .limit(1)

    if (policyError) {
      console.error('❌ RLS policy test failed:', policyError.message)
      console.log('\n📋 SOLUTION: Check RLS policies in Supabase Dashboard:')
      console.log('   1. Go to Authentication > Policies')
      console.log('   2. Ensure policies exist for users_profile table')
      console.log('   3. Re-run migration if needed')
      return
    }
    console.log('✅ RLS policies are working')

    // Test 3: Check table structure
    console.log('\n3. Testing table structure...')
    const { data: structureTest, error: structureError } = await supabase
      .from('users_profile')
      .select('ho_ten, so_cccd, ngay_sinh, gioi_tinh, email, dien_thoai')
      .limit(1)

    if (structureError) {
      console.error('❌ Table structure test failed:', structureError.message)
      console.log('\n📋 SOLUTION: Re-run the migration to ensure all columns exist')
      return
    }
    console.log('✅ Table structure is correct')

    console.log('\n🎉 Database setup is complete and working!')
    console.log('\n📱 You can now test profile creation in the mobile app.')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the test
testDatabaseSetup()