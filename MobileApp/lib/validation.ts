/**
 * Validation utilities for the mobile app
 */

/**
 * Validates if a string is a valid UUID v4 format
 */
export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Validates and sanitizes a record ID parameter
 */
export function validateRecordId(recordId: any): { isValid: boolean; error?: string; sanitized?: string } {
  // Check if recordId exists and is not undefined/null
  if (!recordId || recordId === 'undefined' || recordId === 'null') {
    return {
      isValid: false,
      error: 'ID hồ sơ không hợp lệ'
    }
  }

  // Convert to string and trim
  const sanitized = String(recordId).trim()
  
  // Check if empty after trimming
  if (sanitized === '') {
    return {
      isValid: false,
      error: 'ID hồ sơ không được để trống'
    }
  }

  // Validate UUID format
  if (!isValidUUID(sanitized)) {
    return {
      isValid: false,
      error: 'ID hồ sơ không đúng định dạng UUID'
    }
  }

  return {
    isValid: true,
    sanitized
  }
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Validates phone number (Vietnamese format)
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false
  }
  
  // Vietnamese phone number patterns
  const phoneRegex = /^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * Validates date string (YYYY-MM-DD format)
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') {
    return false
  }
  
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Sanitizes text input by trimming and removing dangerous characters
 */
export function sanitizeTextInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  return input.trim().replace(/[<>]/g, '')
}