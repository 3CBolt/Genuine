import { useState, useEffect, useCallback } from 'react'
import { getStoredToken, isStoredTokenValid } from '../tokenUtils'

export interface VerificationStatus {
  /** Whether the user is currently verified */
  isVerified: boolean
  /** The current token (if valid) */
  token: string | null
  /** Time remaining in seconds (null if not verified) */
  expiresIn: number | null
  /** Whether the token is expiring soon (within 60 seconds) */
  isExpiringSoon: boolean
  /** Formatted time remaining string */
  timeRemaining: string | null
  /** Clear the stored token */
  clearToken: () => void
  /** Refresh the verification status */
  refresh: () => void
}

export const useVerificationStatus = (): VerificationStatus => {
  const [status, setStatus] = useState<Omit<VerificationStatus, 'clearToken' | 'refresh'>>({
    isVerified: false,
    token: null,
    expiresIn: null,
    isExpiringSoon: false,
    timeRemaining: null
  })

  const formatTimeRemaining = useCallback((seconds: number): string => {
    if (seconds <= 0) return 'Expired'
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    } else {
      return `${remainingSeconds}s`
    }
  }, [])

  const calculateExpiry = useCallback((token: string): number | null => {
    try {
      const tokenData = JSON.parse(token)
      if (!tokenData.expiresAt) return null
      
      const expiresAt = new Date(tokenData.expiresAt).getTime()
      const now = Date.now()
      const diffSeconds = Math.floor((expiresAt - now) / 1000)
      
      return diffSeconds > 0 ? diffSeconds : null
    } catch {
      return null
    }
  }, [])

  const updateStatus = useCallback(() => {
    const storedToken = getStoredToken()
    
    if (!storedToken || !isStoredTokenValid(storedToken)) {
      setStatus({
        isVerified: false,
        token: null,
        expiresIn: null,
        isExpiringSoon: false,
        timeRemaining: null
      })
      return
    }

    const expiresIn = calculateExpiry(storedToken)
    const isExpiringSoon = expiresIn !== null && expiresIn <= 60

    setStatus({
      isVerified: expiresIn !== null && expiresIn > 0,
      token: storedToken,
      expiresIn,
      isExpiringSoon,
      timeRemaining: expiresIn !== null ? formatTimeRemaining(expiresIn) : null
    })
  }, [calculateExpiry, formatTimeRemaining])

  const clearToken = useCallback(() => {
    // Clear from sessionStorage
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('genuine_verify_token')
    }
    updateStatus()
  }, [updateStatus])

  const refresh = useCallback(() => {
    updateStatus()
  }, [updateStatus])

  // Initial status check
  useEffect(() => {
    updateStatus()
  }, [updateStatus])

  // Auto-update every second when verified
  useEffect(() => {
    if (!status.isVerified) return

    const interval = setInterval(() => {
      updateStatus()
    }, 1000)

    return () => clearInterval(interval)
  }, [status.isVerified, updateStatus])

  return {
    ...status,
    clearToken,
    refresh
  }
} 