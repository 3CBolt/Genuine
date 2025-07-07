import { useEffect, useRef, useState } from 'react'

export interface GenuineAnalytics {
  successCount: number
  failureCount: number
  attemptCount: number
  fps: number
  lastEvent: 'success' | 'failure' | 'attempt' | null
  log: (msg: string) => void
  clear: () => void
}

export interface UseGenuineAnalyticsOptions {
  /** Enable localStorage persistence (default: false) */
  persist?: boolean
  /** Enable console logging (default: true) */
  logToConsole?: boolean
}

export interface AnalyticsDetectionState {
  isCameraActive: boolean
  gestureMatched: boolean
  detectionState: string
  fps: number
}

const STORAGE_KEY = 'genuine-verify-analytics'

export function useGenuineAnalytics(
  detectionState: AnalyticsDetectionState,
  options: UseGenuineAnalyticsOptions = {}
) {
  const { persist = false, logToConsole = true } = options
  const [successCount, setSuccessCount] = useState(0)
  const [failureCount, setFailureCount] = useState(0)
  const [attemptCount, setAttemptCount] = useState(0)
  const [fps, setFps] = useState(0)
  const [lastEvent, setLastEvent] = useState<'success' | 'failure' | 'attempt' | null>(null)
  const initialized = useRef(false)

  // Only run in development
  const isDev = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'
  
  // Internal log function
  const log = (msg: string) => {
    if (logToConsole && isDev) {
      // eslint-disable-next-line no-console
      console.log(`[GenuineAnalytics] ${msg}`)
    }
    if (persist && isDev) {
      const prev = localStorage.getItem(STORAGE_KEY)
      const arr = prev ? JSON.parse(prev) : []
      arr.push({ ts: Date.now(), msg })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
    }
  }

  // Clear analytics (and localStorage)
  const clear = () => {
    setSuccessCount(0)
    setFailureCount(0)
    setAttemptCount(0)
    setFps(0)
    setLastEvent(null)
    if (persist && isDev) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  // Track attempts (when detection is started)
  useEffect(() => {
    if (!isDev) return
    if (!initialized.current && detectionState.isCameraActive) {
      setAttemptCount((c) => c + 1)
      setLastEvent('attempt')
      log('Detection attempt started')
      initialized.current = true
    }
    if (!detectionState.isCameraActive) {
      initialized.current = false
    }
  }, [detectionState.isCameraActive, isDev])

  // Track success
  useEffect(() => {
    if (!isDev) return
    if (detectionState.gestureMatched) {
      setSuccessCount((c) => c + 1)
      setLastEvent('success')
      log('Detection success')
    }
  }, [detectionState.gestureMatched, isDev])

  // Track failure
  useEffect(() => {
    if (!isDev) return
    if (detectionState.detectionState === 'failed') {
      setFailureCount((c) => c + 1)
      setLastEvent('failure')
      log('Detection failure')
    }
  }, [detectionState.detectionState, isDev])

  // Track FPS
  useEffect(() => {
    if (!isDev) return
    setFps(detectionState.fps)
  }, [detectionState.fps, isDev])

  return {
    successCount,
    failureCount,
    attemptCount,
    fps,
    lastEvent,
    log,
    clear
  }
} 