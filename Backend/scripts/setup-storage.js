/**
 * Automated Storage Setup Script
 * Tự động tạo bucket và policies cho medical files
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.SUPABASE_URL || 'https://aadydqifnwrcbjtxanje.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local')
  console.log('\n💡 Bạn cần thêm SUPABASE_SERVICE_ROLE_KEY vào Backend/.env.local')
  console.log('   Lấy key từ: Supabase Dashboard > Settings > API > service_role key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupStorage() {
  console.log('🚀 Starting Storage Setup\n')
  console.log('=' .repeat(60))

  try {
    // Step 1: Check if bucket exists
    console.log('\n📦 Step 1: Checking if bucket exists...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`)
    }

    const existingBucket = buckets?.find(b => b.name === 'medical-files')
    
    if (existingBucket) {
      console.log('✅ Bucket "medical-files" already exists')
      console.log(`   Public: ${existingBucket.public}`)
      console.log(`   Created: ${existingBucket.created_at}`)
    } else {
      // Step 2: Create bucket
      console.log('\n📦 Step 2: Creating bucket...')
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('medical-files', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      })

      if (createError) {
        throw new Error(`Failed to create bucket: ${createError.message}`)
      }

      console.log('✅ Bucket "medical-files" created successfully')
    }

    // Step 3: Setup policies via SQL
    console.log('\n🔐 Step 3: Setting up storage policies...')
    console.log('   ℹ️  Policies need to be created via SQL Editor in Supabase Dashboard')
    console.log('   ℹ️  Or run the SQL file: Backend/database/storage-setup.sql')

    // Step 4: Test bucket access
    console.log('\n🧪 Step 4: Testing bucket access...')
    const testPath = `test/${Date.now()}.txt`
    const testContent = 'Test file for storage setup'
    
    const { error: uploadError } = await supabase.storage
      .from('medical-files')
      .upload(testPath, testContent, {
        contentType: 'text/plain'
      })

    if (uploadError) {
      console.log('⚠️  Upload test failed:', uploadError.message)
      console.log('   This is expected if policies are not set up yet')
    } else {
      console.log('✅ Upload test successful')
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('medical-files')
        .getPublicUrl(testPath)
      
      console.log(`   Public URL: ${urlData.publicUrl}`)
      
      // Clean up test file
      await supabase.storage
        .from('medical-files')
        .remove([testPath])
      
      console.log('   Test file cleaned up')
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Storage setup completed!\n')
    
    console.log('📋 Next steps:')
    console.log('   1. Go to Supabase Dashboard > Storage > medical-files')
    console.log('   2. Verify bucket is PUBLIC')
    console.log('   3. Go to SQL Editor')
    console.log('   4. Run: Backend/database/storage-setup.sql')
    console.log('   5. Test upload in mobile app')
    console.log('\n   Or follow: STORAGE_SETUP_GUIDE.md')

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message)
    console.log('\n💡 Manual setup required:')
    console.log('   Follow instructions in: STORAGE_SETUP_GUIDE.md')
    process.exit(1)
  }
}

setupStorage()
