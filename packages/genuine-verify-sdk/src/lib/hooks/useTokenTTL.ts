import { useState, useEffect, useCallback, useRef } from 'react'
import { PresenceToken } from '../presence'
import { isTokenExpired } from '../presence'

interface UseTokenTTLOptions {
  onTokenExpired?: () => void
  showExpirationWarning?: boolean
  autoRefreshOnExpiry?: boolean
  warningThreshold?: number // Time in ms before expiry to show warning (default: 30 seconds)
}

export function useTokenTTL(
  token: PresenceToken | null,
  ttlMs: number = 300_000, // 5 minutes default
  options: UseTokenTTLOptions = {}
) {
  const {
    onTokenExpired,
    showExpirationWarning = false,
    autoRefreshOnExpiry = false,
    warningThreshold = 30_000 // 30 seconds default
  } = options

  const [isExpired, setIsExpired] = useState(false)
  const [isExpiringSoon, setIsExpiringSoon] = useState(false)
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(null)
  const [timeUntilWarning, setTimeUntilWarning] = useState<number | null>(null)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const warningIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const clearIntervals = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (warningIntervalRef.current) {
      clearInterval(warningIntervalRef.current)
      warningIntervalRef.current = null
    }
  }, [])

  const checkExpiry = useCallback(() => {
    if (!token) {
      setIsExpired(false)
      setIsExpiringSoon(false)
      setTimeUntilExpiry(null)
      setTimeUntilWarning(null)
      clearIntervals()
      return
    }

    const now = Date.now()
    const expiryTime = new Date(token.expiresAt).getTime()
    const timeUntilExpiryMs = expiryTime - now
    const timeUntilWarningMs = expiryTime - warningThreshold - now

    setTimeUntilExpiry(Math.max(0, timeUntilExpiryMs))
    setTimeUntilWarning(Math.max(0, timeUntilWarningMs))

    // Check if token is expired
    if (timeUntilExpiryMs <= 0) {
      setIsExpired(true)
      setIsExpiringSoon(false)
      onTokenExpired?.()
      clearIntervals()
      return
    }

    // Check if token is expiring soon
    if (showExpirationWarning && timeUntilWarningMs <= 0) {
      setIsExpiringSoon(true)
    } else {
      setIsExpiringSoon(false)
    }

    setIsExpired(false)
  }, [token, warningThreshold, showExpirationWarning, onTokenExpired, clearIntervals])

  // Set up intervals for checking expiry
  useEffect(() => {
    if (!token) {
      clearIntervals()
      return
    }

    // Initial check
    checkExpiry()

    // Set up interval for regular checks (every second)
    intervalRef.current = setInterval(checkExpiry, 1000)

    // Set up warning interval if needed
    if (showExpirationWarning) {
      warningIntervalRef.current = setInterval(() => {
        const now = Date.now()
        const expiryTime = new Date(token.expiresAt).getTime()
        const timeUntilWarningMs = expiryTime - warningThreshold - now

        if (timeUntilWarningMs <= 0) {
          setIsExpiringSoon(true)
        }
      }, 1000)
    }

    return () => {
      clearIntervals()
    }
  }, [token, checkExpiry, showExpirationWarning, warningThreshold, clearIntervals])

  // Auto-refresh on expiry
  useEffect(() => {
    if (isExpired && autoRefreshOnExpiry) {
      // Trigger re-verification by clearing the token
      // This will cause the widget to restart verification
      setIsExpired(false)
      setIsExpiringSoon(false)
    }
  }, [isExpired, autoRefreshOnExpiry])

  const formatTimeRemaining = useCallback((ms: number): string => {
    if (ms <= 0) return 'Expired'
    
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }, [])

  return {
    isExpired,
    isExpiringSoon,
    timeUntilExpiry,
    timeUntilWarning,
    formatTimeRemaining,
    clearIntervals
  }
} 