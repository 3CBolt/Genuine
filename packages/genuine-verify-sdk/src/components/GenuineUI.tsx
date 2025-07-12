'use client'

import React from 'react'
import { DetectionState, UnifiedDetectionState, FacePosition } from '@/lib/types'

interface GenuineUIProps {
  detectionState: DetectionState
  unifiedDetectionState: UnifiedDetectionState
  isCameraActive: boolean
  isModelLoading: boolean
  error: string | null
  errorDetails: string
  status: string
  timeRemaining: number
  countdownMessage: string
  facePosition: FacePosition | null
  eyesDetected: boolean
  positioningMessage: string
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  onStart: () => void
  onReset: () => void
  theme?: 'light' | 'dark'
  instructionalText?: string
  instructionalTextStyle?: React.CSSProperties
}

export const GenuineUI: React.FC<GenuineUIProps> = ({
  detectionState,
  unifiedDetectionState,
  isCameraActive,
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
  onStart,
  onReset,
  theme = 'light',
  instructionalText,
  instructionalTextStyle
}) => {
  // Get visual indicator based on unified detection state
  const getVisualIndicator = () => {
    if (!unifiedDetectionState.hasFace) {
      return { color: 'bg-red-500', text: '🔴 No face detected' }
    }
    if (!unifiedDetectionState.hasEyes) {
      return { color: 'bg-yellow-500', text: '🟡 Face detected, looking for eyes' }
    }
    if (!unifiedDetectionState.gestureMatched) {
      return { color: 'bg-blue-500', text: '🔵 Eyes detected, waiting for gesture' }
    }
    return { color: 'bg-green-500', text: '🟢 Gesture verified!' }
  }

  const visualIndicator = getVisualIndicator()

  // Theme-based styling
  const getThemeStyles = () => {
    if (theme === 'dark') {
      return {
        container: 'p-4 bg-[#18181B] rounded-lg border border-[#232323] shadow-none flex flex-col items-center w-full max-w-md mx-auto relative',
        text: 'text-[#EAEAEA]',
        textSecondary: 'text-[#999]',
        button: 'bg-[#6366F1] hover:bg-[#818CF8] text-white',
        buttonSecondary: 'bg-[#232323] hover:bg-[#333] text-[#EAEAEA]',
        errorContainer: 'bg-red-900/20 border-red-500 text-red-200',
        loadingContainer: 'bg-[#18181B]/90',
        startContainer: 'bg-[#232323]/90 border-[#333]',
        debugContainer: 'bg-[#232323] text-[#999]'
      }
    }
    return {
      container: 'p-4 bg-white rounded-lg border shadow flex flex-col items-center w-full max-w-md mx-auto relative',
      text: 'text-gray-800',
      textSecondary: 'text-gray-600',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      buttonSecondary: 'bg-gray-500 hover:bg-gray-600 text-white',
      errorContainer: 'bg-red-50 border-red-200 text-red-800',
      loadingContainer: 'bg-white bg-opacity-90',
      startContainer: 'bg-gray-50 bg-opacity-90 border-gray-200',
      debugContainer: 'bg-gray-100 text-black'
    }
  }

  const styles = getThemeStyles()

  // Restore embedded widget card layout
  return (
    <div className={styles.container}>
      {/* Video and Canvas Container - Always rendered */}
      <div className="relative mb-4 flex flex-col items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-80 h-60 object-cover rounded-lg border-2 border-gray-300 bg-black"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-80 h-60 pointer-events-none"
        />
        {/* Visual Indicator - Only show when camera is active */}
        {isCameraActive && (
          <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs text-white ${visualIndicator.color}`}>
            {visualIndicator.text}
          </div>
        )}
      </div>

      {/* Overlay for error */}
      {error && (
        <div className={`absolute inset-0 flex items-center justify-center ${styles.errorContainer} rounded-lg p-8 z-10`}>
          <div className="text-center">
            <div className="text-red-600 text-lg font-semibold mb-2">❌ Error</div>
            <div className="text-red-500 text-sm mb-4">{error}</div>
            {errorDetails && (
              <details className="text-xs text-red-400 mb-4">
                <summary className="cursor-pointer">Error Details</summary>
                <pre className="mt-2 whitespace-pre-wrap">{errorDetails}</pre>
              </details>
            )}
            <button
              onClick={onReset}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Overlay for loading */}
      {isModelLoading && (
        <div className={`absolute inset-0 flex items-center justify-center ${styles.loadingContainer} rounded-lg z-10`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4 mx-auto"></div>
            <div className={styles.textSecondary}>Loading face detection model...</div>
          </div>
        </div>
      )}

      {/* Overlay for start */}
      {!isCameraActive && !isModelLoading && !error && (
        <div className={`absolute inset-0 flex items-center justify-center ${styles.startContainer} rounded-lg z-10`}>
          <div className="text-center">
            <div className={`${styles.text} text-lg font-semibold mb-4`}>Human Verification</div>
            <div
              className={`${styles.textSecondary} text-base font-semibold mb-6 text-center px-4 py-2 rounded-lg`}
              style={{
                background: theme === 'dark' ? 'rgba(40,40,50,0.85)' : '#f3f4f6',
                color: theme === 'dark' ? '#fff' : '#222',
                border: theme === 'dark' ? '1.5px solid #6366F1' : '1.5px solid #6366F1',
                boxShadow: '0 2px 8px rgba(99,102,241,0.10)',
                fontWeight: 600,
                fontSize: '1.1rem',
                ...instructionalTextStyle
              }}
            >
              {instructionalText || 'Click the button below to start verification using head tilt gesture'}
            </div>
            <button
              onClick={onStart}
              className={`${styles.button} px-6 py-3 rounded-lg transition-colors font-medium`}
            >
              Start Verification
            </button>
          </div>
        </div>
      )}

      {/* Status Information - Only show when camera is active */}
      {isCameraActive && (
        <div className="text-center mb-4">
          <div className={`text-lg font-semibold ${styles.text} mb-2`}>{status}</div>
          {countdownMessage && (
            <div className={`text-sm ${styles.textSecondary}`}>{countdownMessage}</div>
          )}
          {positioningMessage && (
            <div className="text-sm text-blue-600 mt-2">{positioningMessage}</div>
          )}
        </div>
      )}

      {/* Controls - Only show when camera is active */}
      {isCameraActive && (
        <div className="flex space-x-4">
          <button
            onClick={onReset}
            className={`${styles.buttonSecondary} px-4 py-2 rounded transition-colors`}
          >
            Reset
          </button>
        </div>
      )}

      {/* Detection State Info - Only show in development when camera is active */}
      {process.env.NODE_ENV === 'development' && isCameraActive && (
        <div className={`mt-4 p-3 ${styles.debugContainer} rounded text-xs`}>
          <div>State: {detectionState}</div>
          <div>Face: {unifiedDetectionState.hasFace ? '✓' : '×'}</div>
          <div>Eyes: {unifiedDetectionState.hasEyes ? '✓' : '×'}</div>
          <div>Gesture: {unifiedDetectionState.gestureMatched ? '✓' : '×'}</div>
          <div>Stable: {unifiedDetectionState.isStable ? '✓' : '×'}</div>
          <div>Confidence: {unifiedDetectionState.confidence.toFixed(2)}</div>
        </div>
      )}
    </div>
  )
}