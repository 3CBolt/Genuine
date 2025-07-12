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

// Theme-based styling utilities
const getThemeStyles = (theme: 'light' | 'dark') => {
  if (theme === 'dark') {
    return {
      container: 'bg-[#18181B] border-[#232323] text-[#EAEAEA]',
      card: 'bg-[#18181B] border-[#232323] text-[#EAEAEA]',
      successText: 'text-[#10B981]', // Green for success
      button: 'bg-[#6366F1] hover:bg-[#818CF8] text-white',
      buttonSecondary: 'bg-[#232323] hover:bg-[#333] text-[#EAEAEA]',
      input: 'bg-[#232323] border-[#333] text-[#EAEAEA]',
      text: 'text-[#EAEAEA]',
      textSecondary: 'text-[#999]',
      border: 'border-[#232323]',
      shadow: 'shadow-none',
      debugPanel: 'bg-[#18181B] border-[#232323] text-[#999]',
      debugPanelHeader: 'bg-[#232323] border-[#333] text-[#EAEAEA]',
      tokenContainer: 'bg-[#232323] border-[#333] text-[#EAEAEA]',
      copyButton: 'bg-[#6366F1] hover:bg-[#818CF8] text-white',
      copySuccess: 'bg-[#10B981] text-white'
    }
  }
  
  // Light theme (default)
  return {
    container: 'bg-white border-gray-200 text-gray-900',
    card: 'bg-white border-blue-200 text-gray-900',
    successText: 'text-green-600',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    buttonSecondary: 'bg-gray-500 hover:bg-gray-600 text-white',
    input: 'bg-white border-gray-300 text-gray-900',
    text: 'text-gray-900',
    textSecondary: 'text-gray-500',
    border: 'border-gray-200',
    shadow: 'shadow',
    debugPanel: 'bg-white border-gray-300 text-black',
    debugPanelHeader: 'bg-gray-50 border-gray-200 text-gray-700',
    tokenContainer: 'bg-gray-100 border-gray-300 text-gray-700',
    copyButton: 'bg-gray-800 hover:bg-gray-700 text-white',
    copySuccess: 'bg-green-600 text-white'
  }
}

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
  theme?: 'light' | 'dark'; // Optional theme prop, defaults to 'light'
  instructionalText?: string; // Optional instructional text override
  instructionalTextStyle?: React.CSSProperties; // Optional style for instructional text
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
  const theme = props.theme ?? 'light'; // Default to light theme

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

  const handleCleanupWithCanvasClear = () => {
    if (canvasRef && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    handleCleanup();
  };

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
      theme={theme}
    />
  ) : null

  if (verified) {
    const styles = getThemeStyles(theme);
    
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[320px]">
          <div className={`${styles.card} border rounded-xl ${styles.shadow} p-8 max-w-md w-full flex flex-col items-center relative sm:max-w-lg md:max-w-xl`}>
            <div className={`text-3xl font-bold ${styles.successText} mb-2 flex items-center gap-2`}>
              <span>✅</span> <span>Human Verified</span>
            </div>
            {timeUntilExpiry !== null && (
              <div className={`text-xs ${styles.textSecondary} mb-4`}>Token expires in {formatTimeRemaining(timeUntilExpiry)}</div>
            )}
            {/* Show and Copy Presence Token: always show after verification */}
            {tokenStatus.token?.token && (
              <div className="flex flex-col items-center w-full">
                <div className={`flex items-center gap-2 text-xs mt-2 mb-1 break-all ${styles.tokenContainer} border rounded px-3 py-2 w-full justify-between`}>
                  <span className="truncate max-w-[220px] sm:max-w-[320px]" style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>Token: {tokenStatus.token.token}</span>
                  <button
                    className={`min-w-[56px] h-8 px-3 py-1 ${styles.copyButton} text-xs rounded transition ml-2 whitespace-nowrap`}
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
                  <div className={`absolute top-2 right-2 ${styles.copySuccess} text-xs rounded px-3 py-1 shadow animate-fade-in-out z-10`}>
                    Copied!
                  </div>
                )}
              </div>
            )}
            {/* Move the debug panel here, inside the card, below the token UI */}
            {debugPanel && (
              <div style={{ width: '100%', marginTop: 16, position: 'static' }}>
                {debugPanel}
              </div>
            )}
          </div>
        </div>
        {showExpirationWarning && isExpiringSoon && timeUntilWarning !== null && (
          <ExpirationWarning
            timeRemaining={timeUntilWarning}
            onRefresh={handleRefresh}
            formatTimeRemaining={formatTimeRemaining}
            theme={theme}
          />
        )}
      </>
    )
  }

  // If trigger is manual and no valid token, show Start Verification button
  if (trigger === 'manual' && !(token && isValid)) {
    const styles = getThemeStyles(theme);
    
    return (
      <>
        <div className="flex flex-col items-center justify-center p-6">
          <button
            className={`${styles.button} px-6 py-2 rounded ${styles.shadow} transition`}
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
            theme={theme}
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
        onReset={handleCleanupWithCanvasClear}
        theme={theme}
        instructionalText={props.instructionalText}
        instructionalTextStyle={props.instructionalTextStyle}
      />
      {showExpirationWarning && isExpiringSoon && timeUntilWarning !== null && (
        <ExpirationWarning
          timeRemaining={timeUntilWarning}
          onRefresh={handleRefresh}
          formatTimeRemaining={formatTimeRemaining}
          theme={theme}
        />
      )}
      {debugPanel}
    </>
  )
} 