// Script to fix pending files
// Run this to clean up files that were created before bucket existed

import { supabase } from './lib/supabase'

/**
 * Delete all pending/failed files from database
 * These files were never actually uploaded to storage
 */
async function cleanupPendingFiles() {
  try {
    console.log('🧹 Cleaning up pending/failed files...')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('❌ Not authenticated')
      return
    }
    
    // Get all pending/failed files
    const { data: pendingFiles, error: getError } = await supabase
      .from('medical_files')
      .select('id, file_name, trang_thai, record_id')
      .eq('user_id', user.id)
      .in('trang_thai', ['pending', 'failed'])
    
    if (getError) {
      console.error('❌ Error getting files:', getError.message)
      return
    }
    
    if (!pendingFiles || pendingFiles.length === 0) {
      console.log('✅ No pending/failed files found')
      return
    }
    
    console.log(`📁 Found ${pendingFiles.length} pending/failed files`)
    
    // Delete them
    const { error: deleteError } = await supabase
      .from('medical_files')
      .delete()
      .eq('user_id', user.id)
      .in('trang_thai', ['pending', 'failed'])
    
    if (deleteError) {
      console.error('❌ Error deleting files:', deleteError.message)
      return
    }
    
    console.log(`✅ Deleted ${pendingFiles.length} pending/failed files`)
    console.log('💡 Now you can add files again to these records')
    
    // Show affected records
    const uniqueRecords = [...new Set(pendingFiles.map(f => f.record_id))]
    console.log(`📋 Affected records (${uniqueRecords.length}):`)
    uniqueRecords.forEach(recordId => {
      console.log(`  - ${recordId}`)
    })
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message)
  }
}

/**
 * List all files with their status
 */
async function listAllFiles() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('❌ Not authenticated')
      return
    }
    
    const { data: files, error } = await supabase
      .from('medical_files')
      .select('id, file_name, trang_thai, file_path, record_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error:', error.message)
      return
    }
    
    console.log(`\n📁 Total files: ${files?.length || 0}\n`)
    
    const statusCount = {
      active: 0,
      pending: 0,
      failed: 0,
      deleted: 0
    }
    
    files?.forEach(file => {
      statusCount[file.trang_thai] = (statusCount[file.trang_thai] || 0) + 1
      
      const icon = file.trang_thai === 'active' ? '✅' : 
                   file.trang_thai === 'pending' ? '⏳' : 
                   file.trang_thai === 'failed' ? '❌' : '🗑️'
      
      console.log(`${icon} ${file.file_name}`)
      console.log(`   Status: ${file.trang_thai}`)
      console.log(`   Record: ${file.record_id}`)
      console.log(`   Path: ${file.file_path}`)
      console.log('')
    })
    
    console.log('📊 Summary:')
    console.log(`   ✅ Active: ${statusCount.active}`)
    console.log(`   ⏳ Pending: ${statusCount.pending}`)
    console.log(`   ❌ Failed: ${statusCount.failed}`)
    console.log(`   🗑️ Deleted: ${statusCount.deleted}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Export functions
export { cleanupPendingFiles, listAllFiles }

// Usage in app:
// import { cleanupPendingFiles, listAllFiles } from './fix-pending-files'
// 
// // List all files
// await listAllFiles()
//
// // Clean up pending/failed files
// await cleanupPendingFiles()
