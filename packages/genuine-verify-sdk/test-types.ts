// TypeScript test file to verify all exports are properly typed
import {
  GenuineWidget,
  GenuineWidgetEmbeddable,
  GenuineWidgetProps,
  GenuineWidgetEmbeddableProps,
  PresenceToken,
  TokenValidationResult,
  TokenError,
  DetectionState,
  UnifiedDetectionState,
  HeadTiltMetrics,
  FacePosition,
  createPresenceToken,
  verifyToken,
  getStoredToken,
  storeToken,
  clearStoredToken,
  isStoredTokenValid,
  createMockToken,
  useGenuineDetection,
  usePresenceToken,
  useTokenTTL,
  DEFAULT_THRESHOLDS,
  VERSION
} from './dist/index.js'

// Test component props
const widgetProps: GenuineWidgetProps = {
  gestureType: 'headTilt',
  onSuccess: (token: PresenceToken) => {
    console.log('Token issued:', token)
  },
  onError: (error: Error) => {
    console.error('Error:', error)
  },
  onTokenExpired: () => {
    console.log('Token expired')
  },
  debug: true,
  blinkThreshold: 0.5,
  headTiltThreshold: 15,
  showGestureFeedback: true,
  persist: true,
  trigger: 'auto',
  tokenTTL: 300000,
  showExpirationWarning: true,
  autoRefreshOnExpiry: true
}

// Test embeddable props
const embeddableProps: GenuineWidgetEmbeddableProps = {
  onTokenIssued: (token: string) => {
    console.log('Token issued:', token)
  },
  tokenTTL: 300,
  debug: true,
  headTiltThreshold: 15,
  persist: true,
  trigger: 'auto',
  onError: (error: Error) => {
    console.error('Error:', error)
  }
}

// Test token creation
const token: PresenceToken = createPresenceToken('headTilt', 300000)

// Test token validation
async function testTokenValidation() {
  const result: TokenValidationResult = await verifyToken(token.token)
  console.log('Validation result:', result)
}

// Test storage functions
function testStorage() {
  const stored = getStoredToken()
  const stored2 = getStoredToken('custom-key', 'localStorage')
  
  const storedSuccess = storeToken(token.token)
  const cleared = clearStoredToken()
  const isValid = isStoredTokenValid()
}

// Test mock token
const mockToken = createMockToken('headTilt', false)

// Test detection state
const detectionState: DetectionState = 'idle'
const unifiedState: UnifiedDetectionState = {
  hasFace: true,
  hasEyes: true,
  gestureMatched: false,
  isStable: false,
  confidence: 0.8,
  lastUpdate: Date.now()
}

// Test metrics
const metrics: HeadTiltMetrics = {
  leftEyeY: 100,
  rightEyeY: 100,
  noseBridgeY: 120,
  chinY: 150,
  tiltAngle: 15,
  tiltDirection: 'left',
  isTilted: true,
  tiltStartTime: Date.now(),
  smoothedAngle: 14,
  confidence: 0.9,
  isStable: true,
  faceAlignment: 0.5
}

// Test face position
const facePosition: FacePosition = {
  x: 100,
  y: 100,
  width: 200,
  height: 200
}

// Test constants
console.log('Version:', VERSION)
console.log('Default thresholds:', DEFAULT_THRESHOLDS)

// Test error types
const error: TokenError = 'EXPIRED_TOKEN'

console.log('All TypeScript types are properly exported and typed!') 