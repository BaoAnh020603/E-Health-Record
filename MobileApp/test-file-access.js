/**
 * Test file access and public URLs
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://aadydqifnwrcbjtxanje.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZHlkcWlmbndyY2JqdHhhbmplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzQ2ODksImV4cCI6MjA4MDk1MDY4OX0.KpfPaLJZto07-sXfceCXXdJVKBJZzrzq8J5X1dTPZlc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testFileAccess() {
  console.log('🧪 Testing File Access\n')
  console.log('=' .repeat(60))

  try {
    // 1. List all files in storage
    console.log('\n📁 Listing files in medical-files bucket...')
    const { data: files, error: listError } = await supabase.storage
      .from('medical-files')
      .list()

    if (listError) {
      console.error('❌ Error listing files:', listError)
    } else {
      console.log(`✅ Found ${files?.length || 0} files/folders`)
      if (files && files.length > 0) {
        files.slice(0, 5).forEach(file => {
          console.log(`   - ${file.name} (${file.metadata?.size || 'unknown'} bytes)`)
        })
      }
    }

    // 2. Check bucket configuration
    console.log('\n🔧 Checking bucket configuration...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error getting buckets:', bucketsError)
    } else {
      const medicalBucket = buckets?.find(b => b.name === 'medical-files')
      if (medicalBucket) {
        console.log('✅ Bucket found:', medicalBucket.name)
        console.log('   Public:', medicalBucket.public)
        console.log('   Created:', medicalBucket.created_at)
      } else {
        console.log('❌ medical-files bucket not found')
      }
    }

    // 3. Test getting medical files from database
    console.log('\n📋 Checking medical_files table...')
    const { data: dbFiles, error: dbError } = await supabase
      .from('medical_files')
      .select('*')
      .limit(5)

    if (dbError) {
      console.error('❌ Error querying medical_files:', dbError)
    } else {
      console.log(`✅ Found ${dbFiles?.length || 0} file records in database`)
      if (dbFiles && dbFiles.length > 0) {
        dbFiles.forEach(file => {
          console.log(`\n   File: ${file.file_name}`)
          console.log(`   Path: ${file.file_path}`)
          console.log(`   Status: ${file.trang_thai}`)
          console.log(`   Type: ${file.file_type}`)
          
          // Try to generate public URL
          if (file.file_path) {
            const { data: urlData } = supabase.storage
              .from('medical-files')
              .getPublicUrl(file.file_path)
            
            console.log(`   Public URL: ${urlData.publicUrl}`)
          }
        })
      }
    }

    // 4. Test a specific file path
    console.log('\n🔗 Testing public URL generation...')
    const testPath = 'test/sample.jpg'
    const { data: urlData } = supabase.storage
      .from('medical-files')
      .getPublicUrl(testPath)
    
    console.log(`   Test path: ${testPath}`)
    console.log(`   Generated URL: ${urlData.publicUrl}`)
    console.log(`   ℹ️  Note: URL is generated even if file doesn't exist`)

    console.log('\n' + '='.repeat(60))
    console.log('✅ Test completed!')
    console.log('\n💡 Tips:')
    console.log('   - If bucket is not public, files won\'t be accessible')
    console.log('   - Check Supabase dashboard > Storage > medical-files > Settings')
    console.log('   - Make sure "Public bucket" is enabled')
    console.log('   - Or use signed URLs for private files')

  } catch (error) {
    console.error('\n❌ Test failed:', error)
  }
}

testFileAccess()
