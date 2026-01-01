// lib/api/file-upload.ts

import { supabase } from '../supabase-client'
import imageCompression from 'browser-image-compression'

// =============================================
// FILE COMPRESSION
// =============================================

/**
 * Nén ảnh trước khi upload
 */
async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1, // Giới hạn 1MB
    maxWidthOrHeight: 1920, // Max dimension
    useWebWorker: true,
    fileType: 'image/jpeg'
  }

  try {
    const compressedFile = await imageCompression(file, options)
    console.log(`Compressed: ${file.size} -> ${compressedFile.size} bytes`)
    return compressedFile
  } catch (error) {
    console.error('Compression error:', error)
    return file // Return original if compression fails
  }
}

/**
 * Validate file
 */
function validateFile(file: File, type: 'image' | 'pdf' | 'lab_result') {
  const maxSize = type === 'image' ? 10 * 1024 * 1024 : 5 * 1024 * 1024 // 10MB for images, 5MB for others
  
  if (file.size > maxSize) {
    throw new Error(`File quá lớn. Giới hạn ${maxSize / 1024 / 1024}MB`)
  }

  const allowedTypes: Record<string, string[]> = {
    image: ['image/jpeg', 'image/png', 'image/jpg', 'image/heic'],
    pdf: ['application/pdf'],
    lab_result: ['application/pdf', 'image/jpeg', 'image/png']
  }

  if (!allowedTypes[type].includes(file.type)) {
    throw new Error(`Định dạng file không được hỗ trợ: ${file.type}`)
  }
}

// =============================================
// UPLOAD FILE
// =============================================

export interface UploadFileParams {
  file: File
  recordId: string
  fileType: 'image' | 'pdf' | 'lab_result'
  moTa?: string
  compress?: boolean // Auto compress images
}

export async function uploadMedicalFile(params: UploadFileParams) {
  try {
    const { file, recordId, fileType, moTa, compress = true } = params

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập')
    }

    // Validate file
    validateFile(file, fileType)

    // Compress image if needed
    let uploadFile = file
    if (compress && fileType === 'image' && file.type.startsWith('image/')) {
      uploadFile = await compressImage(file)
    }

    // Generate unique file path: user_id/record_id/timestamp_filename
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${user.id}/${recordId}/${timestamp}_${sanitizedFileName}`

    // Upload to Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('medical-documents')
      .upload(filePath, uploadFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (storageError) throw storageError

    // Get public URL (signed URL for security)
    const { data: urlData } = supabase.storage
      .from('medical-documents')
      .getPublicUrl(filePath)

    // Save file metadata to database
    const { data: fileRecord, error: dbError } = await supabase
      .from('medical_files')
      .insert({
        record_id: recordId,
        user_id: user.id,
        file_name: file.name,
        file_type: fileType,
        file_path: filePath,
        file_size: uploadFile.size,
        mime_type: uploadFile.type,
        mo_ta: moTa
      })
      .select()
      .single()

    if (dbError) {
      // Rollback: delete uploaded file if DB insert fails
      await supabase.storage.from('medical-documents').remove([filePath])
      throw dbError
    }

    // Log activity
    await supabase.from('access_logs').insert({
      user_id: user.id,
      record_id: recordId,
      action: 'upload'
    })

    return {
      success: true,
      data: {
        ...fileRecord,
        url: urlData.publicUrl
      }
    }
  } catch (error: any) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error.message || 'Không thể tải file lên'
    }
  }
}

// =============================================
// UPLOAD MULTIPLE FILES
// =============================================

export async function uploadMultipleFiles(
  files: File[],
  recordId: string,
  fileType: 'image' | 'pdf' | 'lab_result'
) {
  try {
    const results = []
    const errors = []

    for (const file of files) {
      const result = await uploadMedicalFile({
        file,
        recordId,
        fileType,
        compress: fileType === 'image'
      })

      if (result.success) {
        results.push(result.data)
      } else {
        errors.push({ file: file.name, error: result.error })
      }
    }

    return {
      success: errors.length === 0,
      data: results,
      errors: errors.length > 0 ? errors : undefined
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

// =============================================
// GET FILES FOR RECORD
// =============================================

export async function getFilesForRecord(recordId: string) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập')
    }

    const { data: files, error } = await supabase
      .from('medical_files')
      .select('*')
      .eq('record_id', recordId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Generate signed URLs for each file
    const filesWithUrls = await Promise.all(
      (files || []).map(async (file: { file_path: any }) => {
        const { data } = await supabase.storage
          .from('medical-documents')
          .createSignedUrl(file.file_path, 3600) // 1 hour expiry

        return {
          ...file,
          signedUrl: data?.signedUrl
        }
      })
    )

    return {
      success: true,
      data: filesWithUrls
    }
  } catch (error: any) {
    console.error('Get files error:', error)
    return {
      success: false,
      error: error.message || 'Không thể tải danh sách file',
      data: []
    }
  }
}

// =============================================
// DELETE FILE
// =============================================

export async function deleteMedicalFile(fileId: string) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập')
    }

    // Get file info
    const { data: file, error: getError } = await supabase
      .from('medical_files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', user.id)
      .single()

    if (getError) throw getError
    if (!file) throw new Error('Không tìm thấy file')

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('medical-documents')
      .remove([file.file_path])

    if (storageError) {
      console.error('Storage delete error:', storageError)
      // Continue to delete DB record even if storage delete fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('medical_files')
      .delete()
      .eq('id', fileId)
      .eq('user_id', user.id)

    if (dbError) throw dbError

    // Log activity
    await supabase.from('access_logs').insert({
      user_id: user.id,
      record_id: file.record_id,
      action: 'delete_file'
    })

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

// =============================================
// DOWNLOAD FILE
// =============================================

export async function downloadMedicalFile(fileId: string) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Bạn cần đăng nhập')
    }

    // Get file info
    const { data: file, error: getError } = await supabase
      .from('medical_files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', user.id)
      .single()

    if (getError) throw getError
    if (!file) throw new Error('Không tìm thấy file')

    // Download from storage
    const { data: blob, error: downloadError } = await supabase.storage
      .from('medical-documents')
      .download(file.file_path)

    if (downloadError) throw downloadError

    // Create download link
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.file_name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Log activity
    await supabase.from('access_logs').insert({
      user_id: user.id,
      record_id: file.record_id,
      action: 'download'
    })

    return {
      success: true
    }
  } catch (error: any) {
    console.error('Download file error:', error)
    return {
      success: false,
      error: error.message || 'Không thể tải file'
    }
  }
}