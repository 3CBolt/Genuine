'use client'

import React, { useCallback } from 'react'
import { useGenuineDetection } from '@/lib/genuine-verify/hooks/useGenuineDetection'
import { usePresenceToken } from '@/lib/genuine-verify/usePresenceToken'
import { GenuineUI } from './GenuineUI'
import { DEFAULT_THRESHOLDS } from '@/lib/genuine-verify/config'

export interface GenuineWidgetProps {
  gestureType: 'blink' | 'headTilt';
  blinkThreshold?: number;
  headTiltThreshold?: number;
  onSuccess: (token: string) => void;
  onError?: (error: Error) => void;
  debug?: boolean;
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
  const blinkThreshold = props.blinkThreshold ?? DEFAULT_THRESHOLDS.blinkThreshold;
  const headTiltThreshold = props.headTiltThreshold ?? DEFAULT_THRESHOLDS.headTiltThreshold;

  const {
    detectionState,
    isCameraActive,
    isModelLoaded,
    isModelLoading,
    error,
    errorDetails,
    status,
    blinkCount,
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
    verified
  } = useGenuineDetection({
    gestureType: props.gestureType,
    blinkThreshold,
    headTiltThreshold,
    onSuccess: props.onSuccess,
    persist: props.persist
  })

  const {
    token,
    isValid,
    clearToken
  } = usePresenceToken(props.persist)

  // Debug panel
  const showDebug = !!props.debug
  const debugPanel = showDebug ? (
    <div className="fixed bottom-4 right-4 bg-white border text-sm text-black p-3 shadow-md rounded-md z-50">
      <p>Token: {isValid ? '✅ Found' : '🔄 None'}</p>
      {token && (
        <p>Expires: {new Date(token.expiresAt).toLocaleTimeString()}</p>
      )}
      <button
        onClick={clearToken}
        className="mt-2 text-red-600 underline text-xs"
      >
        Clear Token
      </button>
    </div>
  ) : null

  // If verified, show success UI and skip camera/detection
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