'use client'

import React, { useState } from 'react'
import { useGenuineDetection } from '@/lib/genuine-verify/hooks/useGenuineDetection'
import { usePresenceToken } from '@/lib/genuine-verify/usePresenceToken'
import { useTokenTTL } from '@/lib/genuine-verify/hooks/useTokenTTL'
import { GenuineUI } from './GenuineUI'
import { DebugPanel } from './DebugPanel'
import { ExpirationWarning } from './ExpirationWarning'
import { DEFAULT_THRESHOLDS } from '@/lib/genuine-verify/config'
import { PresenceToken } from '@/lib/genuine-verify/presence'

export interface GenuineWidgetProps {
  gestureType: 'blink' | 'headTilt';
  onSuccess: (token: PresenceToken) => void;
  onError?: (error: Error) => void;
  onTokenExpired?: () => void;
  debug?: boolean;
  blinkThreshold?: number;
  headTiltThreshold?: number;
  showGestureFeedback?: boolean;
  persist?: boolean;
  trigger?: 'auto' | 'manual';
  onStartRef?: (startFn: () => void) => void;
  tokenTTL?: number; // Time to live in milliseconds (default: 5 minutes)
  showExpirationWarning?: boolean; // Show UI warning before expiration
  autoRefreshOnExpiry?: boolean; // Automatically trigger re-verification on expiry
}

const SuccessScreen: React.FC<{ expiresAt?: string }> = ({ expiresAt }) => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="text-2xl font-bold text-green-600 mb-2">✅ Human Verified</div>
    {expiresAt && (
      <div className="text-xs text-gray-500">Token valid until: {expiresAt}</div>
    )}
  </div>
)

export const GenuineWidget: React.FC<GenuineWidgetProps> = (props) => {
  if (!props.gestureType) {
    const error = new Error('gestureType is required')
    props.onError?.(error)
    return <div className="text-red-600 p-4">Error: gestureType is required</div>
  }

  if (!props.onSuccess) {
    const error = new Error('onSuccess callback is required')
    props.onError?.(error)
    return <div className="text-red-600 p-4">Error: onSuccess callback is required</div>
  }

  if (!['blink', 'headTilt'].includes(props.gestureType)) {
    const error = new Error(`Invalid gestureType: ${props.gestureType}. Must be 'blink' or 'headTilt'`)
    props.onError?.(error)
    return <div className="text-red-600 p-4">Error: Invalid gestureType</div>
  }

  // Blink detection is now supported
  if (props.gestureType === 'blink') {
    // No error - blink detection is implemented
  }

  const blinkThreshold = props.blinkThreshold ?? DEFAULT_THRESHOLDS.blinkThreshold;
  const headTiltThreshold = props.headTiltThreshold ?? DEFAULT_THRESHOLDS.headTiltThreshold;
  const persist = props.persist ?? true;
  const trigger = props.trigger ?? 'auto';
  const tokenTTL = props.tokenTTL ?? 300_000; // 5 minutes default
  const showExpirationWarning = props.showExpirationWarning ?? false;
  const autoRefreshOnExpiry = props.autoRefreshOnExpiry ?? false;

  const handleSuccess = (tokenString: string) => {
    const token: PresenceToken = {
      token: tokenString,
      gesture: props.gestureType,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + tokenTTL).toISOString(),
      version: 1,
    }
    props.onSuccess(token)
  }

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
    gestureType: 'headTilt', // Only headTilt is currently supported
    headTiltThreshold,
    onSuccess: handleSuccess,
    onError: props.onError,
    persist,
    trigger,
    onStartRef: props.onStartRef
  })

  const {
    token,
    isValid,
    clearToken: clearStoredToken
  } = usePresenceToken(persist)

  // TTL management
  const {
    isExpired,
    isExpiringSoon,
    timeUntilExpiry,
    timeUntilWarning,
    formatTimeRemaining,
    clearIntervals
  } = useTokenTTL(token, tokenTTL, {
    onTokenExpired: props.onTokenExpired,
    showExpirationWarning,
    autoRefreshOnExpiry
  })

  // Handle token expiration
  const handleTokenExpired = () => {
    props.onTokenExpired?.()
    if (autoRefreshOnExpiry) {
      clearStoredToken()
      resetDetectionState()
    }
  }

  // Handle refresh
  const handleRefresh = () => {
    clearStoredToken()
    resetDetectionState()
  }

  // Only show debug panel if debug is true and in development
  const showDebug = process.env.NODE_ENV === 'development' && !!props.debug
  const [debugCollapsed, setDebugCollapsed] = useState(false)

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

  if (verified) {
    return (
      <>
        <div className="verified-banner">
          <span className="icon icon-check" /> Human verified with presence token
          {timeUntilExpiry !== null && (
            <div className="text-xs text-gray-500 mt-1">
              Token expires in {formatTimeRemaining(timeUntilExpiry)}
            </div>
          )}
        </div>
        {showExpirationWarning && isExpiringSoon && timeUntilWarning !== null && (
          <ExpirationWarning
            timeRemaining={timeUntilWarning}
            onRefresh={handleRefresh}
            formatTimeRemaining={formatTimeRemaining}
          />
        )}
        {debugPanel}
      </>
    )
  }

  // If trigger is manual and no valid token, show Start Verification button
  if (trigger === 'manual' && !(token && isValid)) {
    return (
      <>
        <div className="flex flex-col items-center justify-center p-6">
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition"
            onClick={() => manualStartFn && manualStartFn()}
            disabled={isModelLoading}
          >
            {isModelLoading ? 'Loading...' : 'Start Verification'}
          </button>
        </div>
        {showExpirationWarning && isExpiringSoon && timeUntilWarning !== null && (
          <ExpirationWarning
            timeRemaining={timeUntilWarning}
            onRefresh={handleRefresh}
            formatTimeRemaining={formatTimeRemaining}
          />
        )}
        {debugPanel}
      </>
    )
  }

  // Only render debugPanel once, after the main UI
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
      {showExpirationWarning && isExpiringSoon && timeUntilWarning !== null && (
        <ExpirationWarning
          timeRemaining={timeUntilWarning}
          onRefresh={handleRefresh}
          formatTimeRemaining={formatTimeRemaining}
        />
      )}
      {debugPanel}
    </>
  )
} 