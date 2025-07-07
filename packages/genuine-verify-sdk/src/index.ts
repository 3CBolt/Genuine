// Main exports
export { GenuineWidget } from './components/GenuineWidget'
export { GenuineWidgetEmbeddable } from './components/GenuineWidgetEmbeddable'
export type { GenuineWidgetProps } from './components/GenuineWidget'
export type { GenuineWidgetEmbeddableProps } from './components/GenuineWidgetEmbeddable'

// Types
export type { PresenceToken } from './lib/presence'
export type { 
  DetectionState, 
  UnifiedDetectionState, 
  HeadTiltMetrics,
  FacePosition 
} from './lib/types'

// Token utilities
export {
  createPresenceToken,
  verifyToken,
  getStoredToken,
  storeToken,
  clearStoredToken,
  isStoredTokenValid,
  createMockToken
} from './lib/tokenUtils'
export type { TokenValidationResult, TokenError } from './lib/tokenUtils'

// Hooks (for advanced usage)
export { useGenuineDetection } from './lib/hooks/useGenuineDetection'
export { usePresenceToken } from './lib/usePresenceToken'
export { useTokenTTL } from './lib/hooks/useTokenTTL'
export { useVerificationStatus } from './lib/hooks/useVerificationStatus'
export type { VerificationStatus } from './lib/hooks/useVerificationStatus'

// Constants
export { DEFAULT_THRESHOLDS } from './lib/config'

// Version
export const VERSION = '0.1.0' 