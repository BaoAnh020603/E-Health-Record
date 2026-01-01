// supabase/functions/_shared/encryption.ts

// deno-lint-ignore ban-ts-comment
// @ts-ignore

/**
 * Mã hóa AES-256-GCM cho dữ liệu nhạy cảm
 * Sử dụng Web Crypto API (có sẵn trong Deno và Browser)
 */

// Lấy encryption key từ environment
async function getEncryptionKey(): Promise<CryptoKey> {
  // Sửa lỗi: Loại bỏ logic Node.js 'process.env' vì đây là môi trường Deno (Edge Function)
  const keyString = Deno.env.get('MEDICAL_ENCRYPTION_KEY')

  if (!keyString) {
    throw new Error('Encryption key not configured')
  }

  // Convert base64 key to bytes
  const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0))

  // Import key
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Mã hóa dữ liệu
 */
export async function encrypt(plaintext: string): Promise<string> {
  try {
    const key = await getEncryptionKey()

    // Generate random IV (12 bytes for GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Convert plaintext to bytes
    const encoder = new TextEncoder()
    const data = encoder.encode(plaintext)

    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      data
    )

    // Combine IV + ciphertext
    const combined = new Uint8Array(iv.length + ciphertext.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(ciphertext), iv.length)

    // Return base64
    return btoa(String.fromCharCode(...combined))
  } catch (error) {
    // Sửa lỗi: Xử lý lỗi 'unknown' (không cần dùng 'error.message' nếu dùng 'throw new Error')
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Giải mã dữ liệu
 */
export async function decrypt(ciphertext: string): Promise<string> {
  try {
    const key = await getEncryptionKey()

    // Decode base64
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))

    // Extract IV and ciphertext
    const iv = combined.slice(0, 12)
    const data = combined.slice(12)

    // Decrypt
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      data
    )

    // Convert bytes to string
    const decoder = new TextDecoder()
    return decoder.decode(plaintext)
  } catch (error) {
    // Sửa lỗi: Xử lý lỗi 'unknown' (không cần dùng 'error.message' nếu dùng 'throw new Error')
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Mã hóa một object (chỉ các trường nhạy cảm)
 */
export async function encryptSensitiveFields(
  // Sửa lỗi: Thay thế 'any' bằng 'unknown' để an toàn hơn
  data: Record<string, unknown>,
  sensitiveFields: string[]
): Promise<Record<string, unknown>> {
  const result = { ...data }

  for (const field of sensitiveFields) {
    if (result[field]) {
      // Type assertion: Ép kiểu result[field] thành string trước khi mã hóa
      result[field] = await encrypt(String(result[field]))
    }
  }

  return result
}

/**
 * Giải mã một object
 */
export async function decryptSensitiveFields(
  // Sửa lỗi: Thay thế 'any' bằng 'unknown'
  data: Record<string, unknown>,
  sensitiveFields: string[]
): Promise<Record<string, unknown>> {
  const result = { ...data }

  for (const field of sensitiveFields) {
    if (result[field] && typeof result[field] === 'string') {
      try {
        // Biến 'error' không được sử dụng, đổi thành '_error'
        result[field] = await decrypt(result[field] as string)
      } catch (_error) {
        // Sửa lỗi: Đổi tên thành '_error' để tránh cảnh báo 'no-unused-vars'
        console.warn(`Failed to decrypt field ${field}`)
      }
    }
  }

  return result
}

/**
 * Generate encryption key (chỉ dùng 1 lần để setup)
 * Run this once and save the output to your secrets
 */
export async function generateEncryptionKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )

  const exported = await crypto.subtle.exportKey('raw', key)
  const keyBytes = new Uint8Array(exported)

  return btoa(String.fromCharCode(...keyBytes))
}

// Usage example:
// const key = await generateEncryptionKey()
// console.log('Save this key to your secrets:', key)
// Then set: supabase secrets set MEDICAL_ENCRYPTION_KEY="<your-key>"