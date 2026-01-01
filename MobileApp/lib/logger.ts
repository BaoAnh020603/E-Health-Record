/**
 * Logger utility - Tắt logs trong production
 */

const isDevelopment = __DEV__ // React Native built-in flag

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args)
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  }
}

// Disable all console logs in production
if (!isDevelopment) {
  console.log = () => {}
  console.info = () => {}
  console.debug = () => {}
  console.warn = () => {}
  // Keep console.error for critical issues
}
