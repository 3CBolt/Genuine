import { PresenceToken, getPresenceToken, isTokenExpired } from './presence'

/**
 * Token validation result interface
 */
export interface TokenValidationResult {
  valid: boolean
  reason: string | null
  gestureType?: string
  expiresIn?: number
  issuedAt?: string
}

/**
 * Token error types
 */
export type TokenError = 
  | 'MISSING_TOKEN'
  | 'MALFORMED_TOKEN'
  | 'INVALID_STRUCTURE'
  | 'EXPIRED_TOKEN'
  | 'ALREADY_USED'
  | 'UNKNOWN_ERROR'

/**
 * Get a presence token for the specified gesture
 * @param gesture - The gesture type ('blink' | 'headTilt')
 * @param ttlMs - Time to live in milliseconds (default: 5 minutes)
 * @returns PresenceToken object
 */
export function createPresenceToken(
  gesture: 'blink' | 'headTilt',
  ttlMs: number = 300_000
): PresenceToken {
  return getPresenceToken(gesture, ttlMs)
}

/**
 * Verify a token string and return validation result
 * @param token - The token string to verify
 * @param options - Verification options
 * @returns Promise<TokenValidationResult>
 */
export async function verifyToken(
  token: string,
  options: {
    oneTimeUse?: boolean
    baseUrl?: string
  } = {}
): Promise<TokenValidationResult> {
  const { oneTimeUse = false, baseUrl = '' } = options

  try {
    // Validate token exists
    if (!token || typeof token !== 'string') {
      return {
        valid: false,
        reason: 'Missing or invalid token'
      }
    }

    // Parse token
    let tokenData: any
    try {
      tokenData = JSON.parse(token)
    } catch (error) {
      return {
        valid: false,
        reason: 'Malformed token format'
      }
    }

    // Validate token structure
    if (!validateTokenStructure(tokenData)) {
      return {
        valid: false,
        reason: 'Invalid token structure'
      }
    }

    // Check if token is expired
    if (isTokenExpired(tokenData)) {
      return {
        valid: false,
        reason: 'Token expired'
      }
    }

    // If baseUrl is provided, make API call for server-side validation
    if (baseUrl) {
      return await verifyTokenWithAPI(token, baseUrl, oneTimeUse)
    }

    // Client-side validation only
    const expiresAt = new Date(tokenData.expiresAt)
    const now = new Date()
    const expiresIn = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))

    return {
      valid: true,
      reason: null,
      gestureType: tokenData.gesture,
      expiresIn,
      issuedAt: tokenData.issuedAt
    }

  } catch (error) {
    console.error('Token verification error:', error)
    return {
      valid: false,
      reason: 'Unknown verification error'
    }
  }
}

/**
 * Verify token using the API endpoint
 * @param token - The token string
 * @param baseUrl - Base URL for the API
 * @param oneTimeUse - Whether to enable one-time use validation
 * @returns Promise<TokenValidationResult>
 */
async function verifyTokenWithAPI(
  token: string,
  baseUrl: string,
  oneTimeUse: boolean = false
): Promise<TokenValidationResult> {
  try {
    const url = new URL('/api/verify-human', baseUrl)
    if (oneTimeUse) {
      url.searchParams.set('oneTimeUse', 'true')
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ token })
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        valid: false,
        reason: result.reason || `HTTP ${response.status}`
      }
    }

    return result as TokenValidationResult

  } catch (error) {
    console.error('API verification error:', error)
    return {
      valid: false,
      reason: 'Network error during verification'
    }
  }
}

/**
 * Validate token structure
 * @param token - Token object to validate
 * @returns boolean
 */
function validateTokenStructure(token: any): token is PresenceToken {
  return (
    token &&
    typeof token === 'object' &&
    typeof token.token === 'string' &&
    typeof token.gesture === 'string' &&
    ['blink', 'headTilt'].includes(token.gesture) &&
    typeof token.issuedAt === 'string' &&
    typeof token.expiresAt === 'string' &&
    typeof token.version === 'number'
  )
}

/**
 * Get token from storage (localStorage/sessionStorage)
 * @param key - Storage key (default: 'genuine-verify-token')
 * @param storage - Storage type ('localStorage' | 'sessionStorage', default: 'sessionStorage')
 * @returns string | null
 */
export function getStoredToken(
  key: string = 'genuine-verify-token',
  storage: 'localStorage' | 'sessionStorage' = 'sessionStorage'
): string | null {
  try {
    if (typeof window === 'undefined') return null
    
    const storageObj = storage === 'localStorage' ? window.localStorage : window.sessionStorage
    return storageObj.getItem(key)
  } catch (error) {
    console.error('Error getting stored token:', error)
    return null
  }
}

/**
 * Store token in storage
 * @param token - Token string to store
 * @param key - Storage key (default: 'genuine-verify-token')
 * @param storage - Storage type ('localStorage' | 'sessionStorage', default: 'sessionStorage')
 * @returns boolean - Success status
 */
export function storeToken(
  token: string,
  key: string = 'genuine-verify-token',
  storage: 'localStorage' | 'sessionStorage' = 'sessionStorage'
): boolean {
  try {
    if (typeof window === 'undefined') return false
    
    const storageObj = storage === 'localStorage' ? window.localStorage : window.sessionStorage
    storageObj.setItem(key, token)
    return true
  } catch (error) {
    console.error('Error storing token:', error)
    return false
  }
}

/**
 * Clear stored token
 * @param key - Storage key (default: 'genuine-verify-token')
 * @param storage - Storage type ('localStorage' | 'sessionStorage', default: 'sessionStorage')
 * @returns boolean - Success status
 */
export function clearStoredToken(
  key: string = 'genuine-verify-token',
  storage: 'localStorage' | 'sessionStorage' = 'sessionStorage'
): boolean {
  try {
    if (typeof window === 'undefined') return false
    
    const storageObj = storage === 'localStorage' ? window.localStorage : window.sessionStorage
    storageObj.removeItem(key)
    return true
  } catch (error) {
    console.error('Error clearing stored token:', error)
    return false
  }
}

/**
 * Check if a stored token is valid
 * @param key - Storage key (default: 'genuine-verify-token')
 * @param storage - Storage type ('localStorage' | 'sessionStorage', default: 'sessionStorage')
 * @returns Promise<boolean>
 */
export async function isStoredTokenValid(
  key: string = 'genuine-verify-token',
  storage: 'localStorage' | 'sessionStorage' = 'sessionStorage'
): Promise<boolean> {
  const token = getStoredToken(key, storage)
  if (!token) return false
  
  const result = await verifyToken(token)
  return result.valid
}

/**
 * Development helper: Create a mock token for testing
 * @param gesture - Gesture type
 * @param expired - Whether the token should be expired
 * @returns PresenceToken
 */
export function createMockToken(
  gesture: 'blink' | 'headTilt' = 'headTilt',
  expired: boolean = false
): PresenceToken {
  const now = new Date()
  const expiresAt = expired 
    ? new Date(now.getTime() - 1000) // 1 second ago
    : new Date(now.getTime() + 300000) // 5 minutes from now

  return {
    token: `mock-token-${Date.now()}`,
    gesture,
    issuedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    version: 1
  }
} 