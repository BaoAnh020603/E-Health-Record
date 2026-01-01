// Test script to check file loading issues
// Run this in your app to debug file loading

import { supabase } from './lib/supabase'

async function testFileLoading(recordId) {
  console.log('🔍 Testing file loading for record:', recordId)
  
  try {
    // 1. Check if record exists
    const { data: record, error: recordError } = await supabase
      .from('medical_records')
      .select('id, ma_hsba, user_id')
      .eq('id', recordId)
      .single()
    
    if (recordError) {
      console.error('❌ Record not found:', recordError.message)
      return
    }
    
    console.log('✅ Record found:', record.ma_hsba)
    
    // 2. Check files in database
    const { data: files, error: filesError } = await supabase
      .from('medical_files')
      .select('*')
      .eq('record_id', recordId)
    
    if (filesError) {
      console.error('❌ Error loading files:', filesError.message)
      return
    }
    
    console.log(`📁 Found ${files?.length || 0} files in database`)
    
    if (files && files.length > 0) {
      files.forEach((file, index) => {
        console.log(`\n📄 File ${index + 1}:`)
        console.log('  - Name:', file.file_name)
        console.log('  - Path:', file.file_path)
        console.log('  - Type:', file.file_type)
        console.log('  - Status:', file.trang_thai)
        console.log('  - Size:', file.file_size, 'bytes')
        
        // 3. Try to get public URL
        if (file.trang_thai === 'active' && !file.file_path.includes('pending') && !file.file_path.includes('failed')) {
          const { data: urlData } = supabase.storage
            .from('medical-files')
            .getPublicUrl(file.file_path)
          
          console.log('  - Public URL:', urlData.publicUrl)
          
          // 4. Test if URL is accessible
          fetch(urlData.publicUrl, { method: 'HEAD' })
            .then(response => {
              if (response.ok) {
                console.log('  - ✅ URL is accessible')
              } else {
                console.log('  - ❌ URL returned status:', response.status)
              }
            })
            .catch(err => {
              console.log('  - ❌ URL not accessible:', err.message)
            })
        } else {
          console.log('  - ⚠️ File not uploaded or in pending/failed state')
        }
      })
    } else {
      console.log('⚠️ No files found for this record')
    }
    
    // 5. Check storage bucket
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.error('❌ Error checking buckets:', bucketError.message)
    } else {
      const medicalBucket = buckets?.find(b => b.id === 'medical-files')
      if (medicalBucket) {
        console.log('\n✅ Storage bucket "medical-files" exists')
        console.log('  - Public:', medicalBucket.public)
      } else {
        console.log('\n❌ Storage bucket "medical-files" NOT FOUND')
        console.log('  - This is why files cannot be uploaded!')
        console.log('  - Please create the bucket in Supabase dashboard')
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Usage:
// testFileLoading('your-record-id-here')

export { testFileLoading }
