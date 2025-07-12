'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useGenuineDetection } from '@/lib/hooks/useGenuineDetection'
import { usePresenceToken } from '@/lib/usePresenceToken'
import { useTokenTTL } from '@/lib/hooks/useTokenTTL'
import { GenuineUI } from './GenuineUI'
import { DebugPanel } from './DebugPanel'
import { ExpirationWarning } from './ExpirationWarning'
import { DEFAULT_THRESHOLDS } from '@/lib/config'
import { PresenceToken } from '@/lib/presence'
import { DebugPanelMini } from './DebugPanelMini'

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
    onStartRef: props.onStartRef,
    debug: props.debug
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
  // Add state for copy confirmation
  const [copied, setCopied] = useState(false)

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
        <div className="flex flex-col items-center justify-center min-h-[320px]">
          <div className="bg-white border border-blue-200 rounded-xl shadow p-8 max-w-md w-full flex flex-col items-center relative sm:max-w-lg md:max-w-xl">
            <div className="text-3xl font-bold text-green-600 mb-2 flex items-center gap-2">
              <span>✅</span> <span>Human Verified</span>
            </div>
            {timeUntilExpiry !== null && (
              <div className="text-xs text-gray-500 mb-4">Token expires in {formatTimeRemaining(timeUntilExpiry)}</div>
            )}
            {/* Debug: Show and Copy Presence Token */}
            {props.debug && tokenStatus.token?.token && (
              <div className="flex flex-col items-center w-full">
                <div className="flex items-center gap-2 text-xs mt-2 mb-1 break-all text-gray-700 bg-gray-100 border border-gray-300 rounded px-3 py-2 w-full justify-between">
                  <span className="truncate max-w-[220px] sm:max-w-[320px]" style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>Token: {tokenStatus.token.token}</span>
                  <button
                    className="min-w-[56px] h-8 px-3 py-1 bg-gray-800 text-white text-xs rounded hover:bg-gray-700 transition ml-2 whitespace-nowrap"
                    style={{fontWeight: 500, letterSpacing: '0.5px'}}
                    onClick={() => {
                      if (tokenStatus.token?.token) {
                        navigator.clipboard.writeText(tokenStatus.token.token)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 1500)
                      }
                    }}
                  >
                    Copy
                  </button>
                </div>
                {copied && (
                  <div className="absolute top-2 right-2 bg-green-600 text-white text-xs rounded px-3 py-1 shadow animate-fade-in-out z-10">
                    Copied!
                  </div>
                )}
                {/* Minimal Debug Panel */}
                <DebugPanelMini
                  status={status}
                  confidence={confidenceScore}
                  token={tokenStatus.token.token}
                />
              </div>
            )}
          </div>
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