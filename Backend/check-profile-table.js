// Quick check script for users_profile table
// Run with: node check-profile-table.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://aadydqifnwrcbjtxanje.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZHlkcWlmbndyY2JqdHhhbmplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzQ2ODksImV4cCI6MjA4MDk1MDY4OX0.KpfPaLJZto07-sXfceCXXdJVKBJZzrzq8J5X1dTPZlc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkTable() {
  console.log('Checking users_profile table...')
  
  try {
    const { data, error } = await supabase
      .from('users_profile')
      .select('count')
      .limit(1)

    if (error) {
      console.log('❌ Table check failed:', error.message)
      
      if (error.message.includes('does not exist')) {
        console.log('\n🔧 NEXT STEP: Run the migration in Supabase Dashboard')
        console.log('   File: Backend/supabase/functions/migrations/008_create_users_profile_table.sql')
      }
    } else {
      console.log('✅ users_profile table exists and is accessible')
    }
  } catch (err) {
    console.log('❌ Connection error:', err.message)
  }
}

checkTable()