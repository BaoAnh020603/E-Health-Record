/**
 * Logging configuration
 * Set ENABLE_LOGS = false to disable all logs
 */

export const ENABLE_LOGS = true // Bật logs để debug

// Disable console logs if configured
if (!ENABLE_LOGS) {
  console.log = () => {}
  console.info = () => {}
  console.debug = () => {}
  console.warn = () => {}
  // Keep console.error for critical issues
}
