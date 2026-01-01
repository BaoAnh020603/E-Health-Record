import { supabase } from '../lib/supabase'
import { validateRecordId } from '../lib/validation'
import { decode } from 'base64-arraybuffer'

export interface UploadFileResult {
  success: boolean
  data?: any
  error?: string
}

/**
 * Upload medical file to Supabase storage and create database record
 */
export async function uploadMedicalFile(recordId: string, fileInfo: any): Promise<UploadFileResult> {
  try {
    console.log('🔐 Checking authentication...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập để thực hiện chức năng này')
    }
    console.log(`✅ User authenticated: ${user.id}`)

    if (!fileInfo || !fileInfo.uri) {
      throw new Error('File không hợp lệ')
    }

    // Generate unique filename
    const fileExtension = fileInfo.name?.split('.').pop() || 'unknown'
    const fileName = `${user.id}/${recordId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`
    console.log(`📝 Generated file path: ${fileName}`)

    try {
      // Skip bucket check - just try to upload directly
      // The bucket exists, but listBuckets() requires elevated permissions
      console.log('📖 Reading file...')
      // Read file as base64 and convert to ArrayBuffer
      const response = await fetch(fileInfo.uri)
      const blob = await response.blob()
      console.log(`📦 File blob size: ${blob.size} bytes`)
      
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1] // Remove data:image/jpeg;base64, prefix
          resolve(base64)
        }
        reader.readAsDataURL(blob)
      })
      console.log(`✅ File converted to base64 (${base64Data.length} chars)`)

      // Convert base64 to ArrayBuffer
      const arrayBuffer = decode(base64Data)
      console.log(`✅ Converted to ArrayBuffer (${arrayBuffer.byteLength} bytes)`)

      // Upload to Supabase Storage
      console.log(`📤 Uploading to storage: ${fileName}`)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('medical-files')
        .upload(fileName, arrayBuffer, {
          contentType: fileInfo.type || 'application/octet-stream',
          upsert: false
        })

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }
      console.log('✅ File uploaded to storage successfully')

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('medical-files')
        .getPublicUrl(fileName)
      console.log(`🔗 Public URL: ${urlData.publicUrl}`)

      // Create database record
      console.log('💾 Creating database record...')
      const { data: fileRecord, error: dbError } = await supabase
        .from('medical_files')
        .insert({
          record_id: recordId,
          user_id: user.id,
          file_name: fileInfo.name || 'Unknown',
          file_path: fileName,
          file_size: fileInfo.size || 0,
          file_type: fileInfo.type || 'application/octet-stream',
          description: '',
          loai_file: getFileCategory(fileInfo.type || ''),
          trang_thai: 'active'
        })
        .select()
        .single()

      if (dbError) {
        console.error('❌ Database error:', dbError)
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('medical-files').remove([fileName])
        throw new Error(`Database error: ${dbError.message}`)
      }

      console.log('✅ Database record created successfully')
      return {
        success: true,
        data: {
          ...fileRecord,
          public_url: urlData.publicUrl
        }
      }

    } catch (storageError: any) {
      console.error('❌ Storage operation failed:', storageError)
      
      // If storage fails, still save file metadata for later processing
      const { data: fileRecord, error: dbError } = await supabase
        .from('medical_files')
        .insert({
          record_id: recordId,
          user_id: user.id,
          file_name: fileInfo.name || 'Unknown',
          file_path: `failed_upload/${fileName}`,
          file_size: fileInfo.size || 0,
          file_type: fileInfo.type || 'application/octet-stream',
          description: `Upload failed: ${storageError.message}`,
          loai_file: getFileCategory(fileInfo.type || ''),
          trang_thai: 'failed'
        })
        .select()
        .single()

      if (dbError) {
        throw new Error(`Both storage and database failed: ${storageError.message}, ${dbError.message}`)
      }

      return {
        success: false,
        error: `Storage upload failed: ${storageError.message}. File metadata saved for retry.`,
        data: fileRecord
      }
    }

  } catch (error: any) {
    console.error('❌ Upload file error:', error)
    return {
      success: false,
      error: error.message || 'Không thể tải file lên'
    }
  }
}

/**
 * Delete medical file from storage and database
 */
export async function deleteMedicalFile(fileId: string): Promise<UploadFileResult> {
  try {
    // Validate fileId parameter
    const validation = validateRecordId(fileId)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập để thực hiện chức năng này')
    }

    // Get file record first
    const { data: fileRecord, error: getError } = await supabase
      .from('medical_files')
      .select('file_path')
      .eq('id', validation.sanitized!)
      .eq('user_id', user.id)
      .single()

    if (getError || !fileRecord) {
      throw new Error('Không tìm thấy file hoặc không có quyền xóa')
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('medical-files')
      .remove([fileRecord.file_path])

    if (storageError) {
      console.warn('Storage delete error:', storageError)
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('medical_files')
      .delete()
      .eq('id', validation.sanitized!)
      .eq('user_id', user.id)

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`)
    }

    return {
      success: true
    }

  } catch (error: any) {
    console.error('Delete file error:', error)
    return {
      success: false,
      error: error.message || 'Không thể xóa file'
    }
  }
}

/**
 * Get files for a medical record
 */
export async function getMedicalFiles(recordId: string): Promise<UploadFileResult> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập để thực hiện chức năng này')
    }

    const { data: files, error } = await supabase
      .from('medical_files')
      .select('*')
      .eq('record_id', recordId)
      .eq('user_id', user.id)
      .eq('trang_thai', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // Add public URLs
    const filesWithUrls = files?.map(file => {
      const { data: urlData } = supabase.storage
        .from('medical-files')
        .getPublicUrl(file.file_path)
      
      return {
        ...file,
        public_url: urlData.publicUrl
      }
    }) || []

    return {
      success: true,
      data: filesWithUrls
    }

  } catch (error: any) {
    console.error('Get files error:', error)
    return {
      success: false,
      error: error.message || 'Không thể tải danh sách file'
    }
  }
}

// Helper functions
function getFileCategory(mimeType: string): string {
  if (mimeType.includes('image')) return 'Hình ảnh y khoa'
  if (mimeType.includes('pdf')) return 'Kết quả xét nghiệm'
  if (mimeType.includes('word') || mimeType.includes('doc')) return 'Đơn thuốc'
  return 'Khác'
}