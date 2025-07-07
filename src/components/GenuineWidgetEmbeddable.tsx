'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useGenuineDetection } from '@/lib/genuine-verify/hooks/useGenuineDetection'
import { usePresenceToken } from '@/lib/genuine-verify/usePresenceToken'
import { useGenuineTrigger } from '@/lib/genuine-verify/hooks/useGenuineTrigger'
import { GenuineUI } from './GenuineUI'
import { DebugPanel } from './DebugPanel'
import { DEFAULT_THRESHOLDS } from '@/lib/genuine-verify/config'
import { createPresenceToken } from '@/lib/genuine-verify/tokenUtils'

export interface FailureContext {
  /** Reason for the failure */
  reason: 'max_attempts_reached' | 'gesture_timeout' | 'camera_error' | 'model_error' | 'unknown'
  /** Number of attempts made */
  attempts: number
  /** Maximum attempts allowed */
  maxAttempts: number
  /** Error details if available */
  error?: Error
  /** Timestamp of the failure */
  timestamp: string
}

export interface GenuineWidgetEmbeddableProps {
  /** Callback when a valid token is issued with metadata */
  onTokenIssued: (payload: {
    token: string;
    metadata: {
      issuedAt: string;
      expiresAt: string;
      gestureType: string;
    };
  }) => void
  /** Callback when gesture detection fails after max attempts */
  onFailure?: (context: FailureContext) => void
  /** Token time-to-live in seconds (default: 300) */
  tokenTTL?: number
  /** Show debug panel in development */
  debug?: boolean
  /** Head tilt threshold in degrees (default: 15) */
  headTiltThreshold?: number
  /** Persist token in sessionStorage (default: true) */
  persist?: boolean
  /** Trigger mode: 'auto' starts immediately, 'manual' requires user action, 'manualStart' requires explicit programmatic start */
  trigger?: 'auto' | 'manual' | 'manualStart'
  /** Callback for manual start function */
  onStartRef?: (startFn: () => void) => void
  /** Callback for errors */
  onError?: (error: Error) => void
  /** Maximum attempts before triggering fallback (default: 3) */
  maxAttempts?: number
  /** Custom fallback component to render when max attempts reached */
  fallback?: React.ComponentType<{
    failureContext: FailureContext
    triggerRetry: () => void
  }>
}

export const GenuineWidgetEmbeddable: React.FC<GenuineWidgetEmbeddableProps> = ({
  onTokenIssued,
  onFailure,
  tokenTTL = 300,
  debug = false,
  headTiltThreshold = DEFAULT_THRESHOLDS.headTiltThreshold,
  persist = true,
  trigger = 'auto',
  onStartRef,
  onError,
  maxAttempts = 3,
  fallback: FallbackComponent
}) => {
  // State for debug panel collapse
  const [debugCollapsed, setDebugCollapsed] = useState(false)
  
  // State for failure handling
  const [attempts, setAttempts] = useState(0)
  const [failureContext, setFailureContext] = useState<FailureContext | null>(null)

  // Handle successful verification
  const handleSuccess = useCallback((tokenString: string) => {
    // Reset attempts on success
    setAttempts(0)
    setFailureContext(null)
    
    // Create a proper token with the specified TTL
    const token = createPresenceToken('headTilt', tokenTTL * 1000)
    
    // Construct the payload with token and metadata
    const payload = {
      token: token.token,
      metadata: {
        issuedAt: token.issuedAt,
        expiresAt: token.expiresAt,
        gestureType: token.gesture
      }
    }
    
    onTokenIssued(payload)
  }, [onTokenIssued, tokenTTL])

  // Handle failure
  const handleFailure = useCallback((reason: FailureContext['reason'], error?: Error) => {
    const newAttempts = attempts + 1
    setAttempts(newAttempts)
    
    if (newAttempts >= maxAttempts) {
      const context: FailureContext = {
        reason,
        attempts: newAttempts,
        maxAttempts,
        error,
        timestamp: new Date().toISOString()
      }
      
      setFailureContext(context)
      onFailure?.(context)
    }
  }, [attempts, maxAttempts, onFailure])

  // Detection hook
  const {
    detectionState,
    isCameraActive,
    isModelLoaded,
    isModelLoading,
    error,
    errorDetails,
    status,
    timeRemaining,
    countdownMessage,
    facePosition,
    eyesDetected,
    positioningMessage,
    videoRef,
    canvasRef,
    handleStartCamera,
    handleCleanup,
    clearDetectionInterval,
    verified,
    gestureMatched,
    confidenceScore,
    fps,
    headTiltMetrics,
    tokenStatus,
    resetDetectionState,
    clearToken,
    unifiedDetectionState,
    manualStartFn
  } = useGenuineDetection({
    gestureType: 'headTilt',
    headTiltThreshold,
    onSuccess: handleSuccess,
    onError: (error) => {
      onError?.(error)
      handleFailure('model_error', error)
    },
    persist,
    trigger,
    onStartRef,
    maxAttempts
  })

  // Retry function (must be after detection hook)
  const triggerRetry = useCallback(() => {
    setAttempts(0)
    setFailureContext(null)
    resetDetectionState()
    handleStartCamera()
  }, [resetDetectionState, handleStartCamera])

  // Trigger hook for programmatic control
  const triggerControls = useGenuineTrigger(
    handleStartCamera,
    handleCleanup,
    resetDetectionState,
    isCameraActive,
    isModelLoaded,
    {
      onStart: () => console.log('Detection started programmatically'),
      onStop: () => console.log('Detection stopped programmatically'),
      onReset: () => console.log('Detection reset programmatically')
    }
  )

  // Token management
  const {
    token,
    isValid,
    clearToken: clearStoredToken
  } = usePresenceToken(persist)

  // Debug panel (only in development)
  const showDebug = process.env.NODE_ENV === 'development' && debug
  const debugPanel = showDebug ? (
    <DebugPanel
      gestureMatched={gestureMatched}
      confidenceScore={confidenceScore}
      fps={fps}
      tiltMetrics={headTiltMetrics || undefined}
      unifiedDetectionState={unifiedDetectionState}
      tokenStatus={{
        token: tokenStatus.token || undefined,
        expiresAt: tokenStatus.expiresAt
      }}
      resetDetectionState={resetDetectionState}
      clearToken={clearStoredToken}
      isCollapsed={debugCollapsed}
      onToggleCollapse={() => setDebugCollapsed((c) => !c)}
    />
  ) : null

  // Auto-start detection on mount if trigger is 'auto'
  useEffect(() => {
    if (trigger === 'auto' && !verified && isModelLoaded && !isCameraActive) {
      handleStartCamera()
    }
  }, [trigger, verified, isModelLoaded, isCameraActive, handleStartCamera])

  // Expose trigger controls for manualStart mode
  useEffect(() => {
    if (trigger === 'manualStart' && onStartRef) {
      onStartRef(triggerControls.startDetection)
    }
  }, [trigger, onStartRef, triggerControls.startDetection])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up camera and detection
      handleCleanup()
      clearDetectionInterval()
      
      // Clear any stored tokens if not persisting
      if (!persist) {
        clearStoredToken()
      }
    }
  }, [handleCleanup, clearDetectionInterval, persist, clearStoredToken])

  // Success state
  if (verified) {
    return (
      <>
        <div className="flex flex-col items-center justify-center p-6 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-2xl font-bold text-green-600 mb-2">✅ Human Verified</div>
          <div className="text-sm text-green-600">Token issued successfully</div>
        </div>
        {debugPanel}
      </>
    )
  }

  // Fallback state
  if (failureContext) {
    if (FallbackComponent) {
      return (
        <>
          <FallbackComponent 
            failureContext={failureContext} 
            triggerRetry={triggerRetry} 
          />
          {debugPanel}
        </>
      )
    }
    
    // Default fallback UI
    return (
      <>
        <div className="flex flex-col items-center justify-center p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-2xl font-bold text-red-600 mb-2">❌ Verification Failed</div>
          <div className="text-sm text-red-600 mb-4">
            Failed after {failureContext.attempts} attempts. Reason: {failureContext.reason}
          </div>
          <button
            onClick={triggerRetry}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
        {debugPanel}
      </>
    )
  }

  // Manual trigger state
  if ((trigger === 'manual' || trigger === 'manualStart') && !(token && isValid)) {
    return (
      <>
        <div className="flex flex-col items-center justify-center p-6">
          {trigger === 'manual' && (
            <button
              className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition-colors font-medium"
              onClick={() => manualStartFn && manualStartFn()}
              disabled={isModelLoading}
            >
              {isModelLoading ? 'Loading...' : 'Start Verification'}
            </button>
          )}
          {trigger === 'manualStart' && (
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700 mb-2">
                Verification Ready
              </div>
              <div className="text-sm text-gray-600">
                Detection will start when triggered programmatically
              </div>
              {isModelLoading && (
                <div className="text-sm text-gray-600 mt-2">Loading face detection model...</div>
              )}
            </div>
          )}
        </div>
        {debugPanel}
      </>
    )
  }

  // Main widget UI
  return (
    <>
      <GenuineUI
        detectionState={detectionState}
        unifiedDetectionState={unifiedDetectionState}
        isCameraActive={isCameraActive}
        isModelLoading={isModelLoading}
        error={error}
        errorDetails={errorDetails}
        status={status}
        timeRemaining={timeRemaining}
        countdownMessage={countdownMessage}
        facePosition={facePosition}
        eyesDetected={eyesDetected}
        positioningMessage={positioningMessage}
        videoRef={videoRef}
        canvasRef={canvasRef}
        onStart={handleStartCamera}
        onReset={handleCleanup}
      />
      {debugPanel}
    </>
  )
} 