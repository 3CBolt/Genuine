import { renderHook, act } from '@testing-library/react'
import { usePresenceToken } from '../usePresenceToken'

describe('usePresenceToken', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  it('should initialize with no token', () => {
    const { result } = renderHook(() => usePresenceToken())
    
    expect(result.current.token).toBe(null)
    expect(result.current.isValid).toBe(false)
  })

  it('should generate and store a token', () => {
    const { result } = renderHook(() => usePresenceToken())
    
    act(() => {
      result.current.generatePresenceToken()
    })
    
    expect(result.current.token).not.toBe(null)
    expect(localStorage.getItem('genuine_verify_dev_token')).not.toBe(null)
  })

  it('should validate a recent token', () => {
    const { result } = renderHook(() => usePresenceToken())
    
    act(() => {
      result.current.generatePresenceToken()
    })
    
    act(() => {
      result.current.validatePresenceToken()
    })
    
    expect(result.current.isValid).toBe(true)
  })

  it('should invalidate an old token', () => {
    const { result } = renderHook(() => usePresenceToken())
    
    // Generate token
    act(() => {
      result.current.generatePresenceToken()
    })
    
    // Mock Date.now to return a time 25 hours in the future
    const realDateNow = Date.now
    Date.now = jest.fn(() => realDateNow() + 25 * 60 * 60 * 1000)
    
    // Validate token
    act(() => {
      result.current.validatePresenceToken()
    })
    
    // Restore Date.now
    Date.now = realDateNow
    
    expect(result.current.isValid).toBe(false)
  })

  it('should clear token', () => {
    const { result } = renderHook(() => usePresenceToken())
    
    // Generate token
    act(() => {
      result.current.generatePresenceToken()
    })
    
    // Clear token
    act(() => {
      result.current.clearPresenceToken()
    })
    
    expect(result.current.token).toBe(null)
    expect(result.current.isValid).toBe(false)
    expect(localStorage.getItem('genuine_verify_dev_token')).toBe(null)
  })
}) 