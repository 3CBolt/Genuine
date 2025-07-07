'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useGenuineDetection } from '@/lib/genuine-verify/hooks/useGenuineDetection'
import { usePresenceToken } from '@/lib/genuine-verify/usePresenceToken'
import { GenuineUI } from './GenuineUI'
import { DebugPanel } from './DebugPanel'
import { DEFAULT_THRESHOLDS } from '@/lib/genuine-verify/config'
import { createPresenceToken } from '@/lib/genuine-verify/tokenUtils'

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
  /** Token time-to-live in seconds (default: 300) */
  tokenTTL?: number
  /** Show debug panel in development */
  debug?: boolean
  /** Head tilt threshold in degrees (default: 15) */
  headTiltThreshold?: number
  /** Persist token in sessionStorage (default: true) */
  persist?: boolean
  /** Trigger mode: 'auto' starts immediately, 'manual' requires user action */
  trigger?: 'auto' | 'manual'
  /** Callback for manual start function */
  onStartRef?: (startFn: () => void) => void
  /** Callback for errors */
  onError?: (error: Error) => void
}

export const GenuineWidgetEmbeddable: React.FC<GenuineWidgetEmbeddableProps> = ({
  onTokenIssued,
  tokenTTL = 300,
  debug = false,
  headTiltThreshold = DEFAULT_THRESHOLDS.headTiltThreshold,
  persist = true,
  trigger = 'auto',
  onStartRef,
  onError
}) => {
  // State for debug panel collapse
  const [debugCollapsed, setDebugCollapsed] = useState(false)

  // Handle successful verification
  const handleSuccess = useCallback((tokenString: string) => {
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
    onError,
    persist,
    trigger,
    onStartRef
  })

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

  // Manual trigger state
  if (trigger === 'manual' && !(token && isValid)) {
    return (
      <>
        <div className="flex flex-col items-center justify-center p-6">
          <button
            className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition-colors font-medium"
            onClick={() => manualStartFn && manualStartFn()}
            disabled={isModelLoading}
          >
            {isModelLoading ? 'Loading...' : 'Start Verification'}
          </button>
          {isModelLoading && (
            <div className="text-sm text-gray-600 mt-2">Loading face detection model...</div>
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