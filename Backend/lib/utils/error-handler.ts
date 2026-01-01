// lib/utils/error-handler.ts

/**
 * Centralized Error Handling
 * Chuyển đổi lỗi kỹ thuật thành thông báo thân thiện
 */

export class AppError extends Error {
  constructor(
    public message: string,
    public code?: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Map Supabase errors to user-friendly messages
 */
export function handleSupabaseError(error: any): AppError {
  console.error('Supabase error:', error)

  // Network errors
  if (error.message?.includes('fetch')) {
    return new AppError(
      'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.',
      'NETWORK_ERROR',
      503,
      error
    )
  }

  // Auth errors
  if (error.message?.includes('Invalid login credentials')) {
    return new AppError(
      'Email hoặc mật khẩu không chính xác',
      'AUTH_INVALID_CREDENTIALS',
      401,
      error
    )
  }

  if (error.message?.includes('User already registered')) {
    return new AppError(
      'Email này đã được đăng ký',
      'AUTH_USER_EXISTS',
      409,
      error
    )
  }

  if (error.message?.includes('Email not confirmed')) {
    return new AppError(
      'Vui lòng xác thực email của bạn',
      'AUTH_EMAIL_NOT_CONFIRMED',
      401,
      error
    )
  }

  // RLS / Permission errors
  if (error.code === 'PGRST301' || error.message?.includes('row-level security')) {
    return new AppError(
      'Bạn không có quyền truy cập dữ liệu này',
      'PERMISSION_DENIED',
      403,
      error
    )
  }

  // Unique constraint violations
  if (error.code === '23505') {
    return new AppError(
      'Dữ liệu đã tồn tại trong hệ thống',
      'DUPLICATE_DATA',
      409,
      error
    )
  }

  // Foreign key violations
  if (error.code === '23503') {
    return new AppError(
      'Không thể thực hiện thao tác do ràng buộc dữ liệu',
      'CONSTRAINT_VIOLATION',
      400,
      error
    )
  }

  // Storage errors
  if (error.message?.includes('storage')) {
    return new AppError(
      'Lỗi khi xử lý file. Vui lòng thử lại.',
      'STORAGE_ERROR',
      500,
      error
    )
  }

  // Generic error
  return new AppError(
    'Đã xảy ra lỗi. Vui lòng thử lại sau.',
    'UNKNOWN_ERROR',
    500,
    error
  )
}

/**
 * Safe error message extraction
 * Never expose sensitive info to users
 */
export function getSafeErrorMessage(error: any): string {
  if (error instanceof AppError) {
    return error.message
  }

  if (error?.message) {
    // Filter out technical details
    const message = error.message.toLowerCase()
    
    if (message.includes('jwt') || message.includes('token')) {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Không thể kết nối đến máy chủ'
    }
    
    if (message.includes('timeout')) {
      return 'Kết nối quá chậm. Vui lòng thử lại.'
    }
  }

  // Default generic message
  return 'Đã xảy ra lỗi không xác định'
}

// =============================================
// LOGGING UTILITIES
// =============================================

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  error?: any
  userId?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatLog(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
      entry.message
    ]

    if (entry.userId) {
      parts.push(`[User: ${entry.userId}]`)
    }

    if (entry.context) {
      parts.push(JSON.stringify(entry.context))
    }

    return parts.join(' ')
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: any) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error
    }

    const formatted = this.formatLog(entry)

    // Console output
    switch (level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) console.debug(formatted, error)
        break
      case LogLevel.INFO:
        console.info(formatted)
        break
      case LogLevel.WARN:
        console.warn(formatted, error)
        break
      case LogLevel.ERROR:
        console.error(formatted, error)
        break
    }

    // In production, send to logging service
    if (!this.isDevelopment && level === LogLevel.ERROR) {
      this.sendToLoggingService(entry)
    }
  }

  private sendToLoggingService(entry: LogEntry) {
    // TODO: Integrate with logging service (Sentry, LogRocket, etc.)
    // Example:
    // Sentry.captureException(entry.error, {
    //   contexts: { custom: entry.context }
    // })
  }

  debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: Record<string, any>, error?: any) {
    this.log(LogLevel.WARN, message, context, error)
  }

  error(message: string, error?: any, context?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, context, error)
  }
}

export const logger = new Logger()

// =============================================
// USAGE EXAMPLES
// =============================================

/*
// In your API functions:

try {
  const result = await supabase.from('medical_records').select()
  logger.info('Fetched medical records', { count: result.data?.length })
} catch (error) {
  const appError = handleSupabaseError(error)
  logger.error('Failed to fetch records', error, { userId: user.id })
  
  return {
    success: false,
    error: getSafeErrorMessage(appError)
  }
}

// In components:

try {
  await uploadFile(file)
} catch (error) {
  const message = getSafeErrorMessage(error)
  toast.error(message)
}
*/