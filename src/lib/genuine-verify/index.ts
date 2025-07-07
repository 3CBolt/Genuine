// Export the verification status hook
export { useVerificationStatus } from './hooks/useVerificationStatus'
export type { VerificationStatus } from './hooks/useVerificationStatus'

// Export token utilities
export {
  verifyToken,
  createPresenceToken,
  getStoredToken,
  storeToken,
  clearStoredToken,
  isStoredTokenValid,
  createMockToken
} from './tokenUtils'

// Export types
export type { PresenceToken, TokenValidationResult } from './types'

// Export configuration
export { DEFAULT_THRESHOLDS } from './config' 