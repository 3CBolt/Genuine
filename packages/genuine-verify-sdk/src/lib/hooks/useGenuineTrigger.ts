import { useCallback, useRef } from 'react'

export interface GenuineTriggerControls {
  /** Start detection programmatically */
  startDetection: () => void
  /** Stop detection and cleanup */
  stopDetection: () => void
  /** Reset detection state */
  resetDetection: () => void
  /** Check if detection is currently active */
  isDetectionActive: boolean
  /** Check if model is loaded and ready */
  isModelReady: boolean
}

export interface UseGenuineTriggerOptions {
  /** Whether to auto-start detection when the hook is called */
  autoStart?: boolean
  /** Callback when detection starts */
  onStart?: () => void
  /** Callback when detection stops */
  onStop?: () => void
  /** Callback when detection resets */
  onReset?: () => void
}

export const useGenuineTrigger = (
  startFn: (() => void) | null,
  stopFn: (() => void) | null,
  resetFn: (() => void) | null,
  isActive: boolean = false,
  isModelReady: boolean = false,
  options: UseGenuineTriggerOptions = {}
): GenuineTriggerControls => {
  const { autoStart = false, onStart, onStop, onReset } = options
  
  // Track if we've been initialized
  const initialized = useRef(false)

  const startDetection = useCallback(() => {
    if (startFn && isModelReady && !isActive) {
      startFn()
      onStart?.()
    }
  }, [startFn, isModelReady, isActive, onStart])

  const stopDetection = useCallback(() => {
    if (stopFn && isActive) {
      stopFn()
      onStop?.()
    }
  }, [stopFn, isActive, onStop])

  const resetDetection = useCallback(() => {
    if (resetFn) {
      resetFn()
      onReset?.()
    }
  }, [resetFn, onReset])

  // Auto-start if requested and not already active
  if (autoStart && !initialized.current && isModelReady && !isActive) {
    initialized.current = true
    // Use setTimeout to avoid calling during render
    setTimeout(() => {
      startDetection()
    }, 0)
  }

  return {
    startDetection,
    stopDetection,
    resetDetection,
    isDetectionActive: isActive,
    isModelReady
  }
} 