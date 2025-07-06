import {
  createPresenceToken,
  verifyToken,
  getStoredToken,
  storeToken,
  clearStoredToken,
  isStoredTokenValid,
  createMockToken,
  TokenValidationResult
} from '../tokenUtils'

describe('Token Utilities', () => {
  beforeEach(() => {
    // Clear storage before each test
    if (typeof window !== 'undefined') {
      window.sessionStorage.clear()
      window.localStorage.clear()
    }
  })

  describe('createPresenceToken', () => {
    it('should create a valid presence token', () => {
      const token = createPresenceToken('headTilt')
      
      expect(token).toHaveProperty('token')
      expect(token).toHaveProperty('gesture', 'headTilt')
      expect(token).toHaveProperty('issuedAt')
      expect(token).toHaveProperty('expiresAt')
      expect(token).toHaveProperty('version', 1)
    })

    it('should create token with custom TTL', () => {
      const token = createPresenceToken('headTilt', 60000) // 1 minute
      const expiresAt = new Date(token.expiresAt)
      const issuedAt = new Date(token.issuedAt)
      const diff = expiresAt.getTime() - issuedAt.getTime()
      
      expect(diff).toBeCloseTo(60000, -2) // Within 100ms
    })
  })

  describe('verifyToken', () => {
    it('should verify a valid token', async () => {
      const token = createPresenceToken('headTilt')
      const tokenString = JSON.stringify(token)
      
      const result = await verifyToken(tokenString)
      
      expect(result.valid).toBe(true)
      expect(result.reason).toBe(null)
      expect(result.gestureType).toBe('headTilt')
      expect(result.expiresIn).toBeGreaterThan(0)
    })

    it('should reject missing token', async () => {
      const result = await verifyToken('')
      
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('Missing or invalid token')
    })

    it('should reject malformed token', async () => {
      const result = await verifyToken('invalid-json')
      
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('Malformed token format')
    })

    it('should reject expired token', async () => {
      const expiredToken = createMockToken('headTilt', true)
      const tokenString = JSON.stringify(expiredToken)
      
      const result = await verifyToken(tokenString)
      
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Token expired')
    })

    it('should reject invalid token structure', async () => {
      const invalidToken = { token: 'test', gesture: 'invalid' }
      const tokenString = JSON.stringify(invalidToken)
      
      const result = await verifyToken(tokenString)
      
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Invalid token structure')
    })
  })

  describe('Storage utilities', () => {
    it('should store and retrieve token', () => {
      const token = 'test-token'
      const success = storeToken(token)
      
      expect(success).toBe(true)
      
      const retrieved = getStoredToken()
      expect(retrieved).toBe(token)
    })

    it('should clear stored token', () => {
      const token = 'test-token'
      storeToken(token)
      
      const success = clearStoredToken()
      expect(success).toBe(true)
      
      const retrieved = getStoredToken()
      expect(retrieved).toBe(null)
    })

    it('should handle storage errors gracefully', () => {
      // Mock storage to throw error
      const originalSetItem = window.sessionStorage.setItem
      window.sessionStorage.setItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage error')
      })
      
      const success = storeToken('test')
      expect(success).toBe(false)
      
      window.sessionStorage.setItem = originalSetItem
    })
  })

  describe('createMockToken', () => {
    it('should create valid mock token', () => {
      const token = createMockToken('headTilt', false)
      
      expect(token.gesture).toBe('headTilt')
      expect(token.token).toContain('mock-token-')
      expect(token.version).toBe(1)
    })

    it('should create expired mock token', () => {
      const token = createMockToken('headTilt', true)
      const expiresAt = new Date(token.expiresAt)
      const now = new Date()
      
      expect(expiresAt.getTime()).toBeLessThan(now.getTime())
    })
  })
}) 