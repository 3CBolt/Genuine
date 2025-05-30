'use client'

import React, { useCallback } from 'react'
import { useGenuineDetection } from '@/lib/genuine-verify/hooks/useGenuineDetection'
import { usePresenceToken } from '@/lib/genuine-verify/hooks/usePresenceToken'
import { GenuineUI } from './GenuineUI'

export const GenuineWidget: React.FC = () => {
  const {
    // State
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

    // Refs
    videoRef,
    canvasRef,

    // Actions
    handleStartCamera,
    handleCleanup,
    clearDetectionInterval
  } = useGenuineDetection()

  const {
    isValid: isTokenValid,
    validatePresenceToken,
    generatePresenceToken,
    clearPresenceToken
  } = usePresenceToken()

  const handleStart = useCallback(async () => {
    try {
      // Check for valid presence token first
      if (validatePresenceToken()) {
        // Token is valid, skip verification
        return
      }

      // No valid token, start verification
      await handleStartCamera()
    } catch (err) {
      console.error('Failed to start verification:', err)
    }
  }, [validatePresenceToken, handleStartCamera])

  const handleReset = useCallback(() => {
    handleCleanup()
    clearPresenceToken()
  }, [handleCleanup, clearPresenceToken])

  return (
    <GenuineUI
      detectionState={detectionState}
      isCameraActive={isCameraActive}
      isModelLoading={isModelLoading}
      error={error}
      errorDetails={errorDetails}
      status={status}
      blinkCount={blinkCount}
      timeRemaining={timeRemaining}
      countdownMessage={countdownMessage}
      facePosition={facePosition}
      eyesDetected={eyesDetected}
      positioningMessage={positioningMessage}
      videoRef={videoRef}
      canvasRef={canvasRef}
      onStart={handleStart}
      onReset={handleReset}
    />
  )
} 