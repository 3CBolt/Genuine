'use client'

import React from 'react'
import { useGenuineDetection } from '@/lib/genuine-verify/hooks/useGenuineDetection'
import { usePresenceToken } from '@/lib/genuine-verify/usePresenceToken'
import { GenuineUI } from './GenuineUI'
import { DebugPanel } from './DebugPanel'
import { DEFAULT_THRESHOLDS } from '@/lib/genuine-verify/config'
import { PresenceToken } from '@/lib/genuine-verify/presence'

export interface GenuineWidgetProps {
  gestureType: 'blink' | 'headTilt';
  onSuccess: (token: PresenceToken) => void;
  onError?: (error: Error) => void;
  debug?: boolean;
  blinkThreshold?: number;
  headTiltThreshold?: number;
  showGestureFeedback?: boolean;
  persist?: boolean;
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

  if (props.gestureType === 'blink') {
    const error = new Error('Blink detection is not yet implemented. Please use headTilt for now.')
    props.onError?.(error)
    return <div className="text-yellow-600 p-4">⚠️ Blink detection coming soon. Please use headTilt for now.</div>
  }

  const blinkThreshold = props.blinkThreshold ?? DEFAULT_THRESHOLDS.blinkThreshold;
  const headTiltThreshold = props.headTiltThreshold ?? DEFAULT_THRESHOLDS.headTiltThreshold;
  const persist = props.persist ?? true;

  const handleSuccess = (tokenString: string) => {
    const token: PresenceToken = {
      token: tokenString,
      gesture: props.gestureType,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 300000).toISOString(),
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
    tokenStatus,
    resetDetectionState,
    clearToken,
    unifiedDetectionState
  } = useGenuineDetection({
    gestureType: props.gestureType,
    blinkThreshold,
    headTiltThreshold,
    onSuccess: handleSuccess,
    onError: props.onError,
    persist
  })

  const {
    token,
    isValid,
    clearToken: clearStoredToken
  } = usePresenceToken(persist)

  const showDebug = process.env.NODE_ENV === 'development' && !!props.debug
  const debugPanel = showDebug ? (
    <DebugPanel
      gestureMatched={gestureMatched}
      confidenceScore={confidenceScore}
      fps={fps}
      unifiedDetectionState={unifiedDetectionState}
      tokenStatus={{
        token: tokenStatus.token || undefined,
        expiresAt: tokenStatus.expiresAt
      }}
      resetDetectionState={resetDetectionState}
      clearToken={clearStoredToken}
    />
  ) : null

  if (verified) {
    return <>
      <SuccessScreen expiresAt={token?.expiresAt} />
      {debugPanel}
    </>
  }

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