// Main exports
export { GenuineWidget } from './components/GenuineWidget'
export { GenuineWidgetEmbeddable } from './components/GenuineWidgetEmbeddable'
export type { GenuineWidgetProps } from './components/GenuineWidget'
export type { GenuineWidgetEmbeddableProps } from './components/GenuineWidgetEmbeddable'

// UI Components
export { GenuineUI } from './components/GenuineUI'
export { DebugPanelMini as DebugPanel } from './components/DebugPanelMini'
export { ExpirationWarning } from './components/ExpirationWarning'

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
export { useGenuineTrigger } from './lib/hooks/useGenuineTrigger'
export { useGenuineAnalytics } from './lib/hooks/useGenuineAnalytics'
export type { VerificationStatus } from './lib/hooks/useVerificationStatus'
export type { GenuineTriggerControls, UseGenuineTriggerOptions } from './lib/hooks/useGenuineTrigger'
export type { GenuineAnalytics, UseGenuineAnalyticsOptions, AnalyticsDetectionState } from './lib/hooks/useGenuineAnalytics'

// Constants
export { DEFAULT_THRESHOLDS } from './lib/config'

// Version
export const VERSION = '0.1.0' 