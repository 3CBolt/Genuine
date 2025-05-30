import React from 'react'
import { DetectionState } from '@/lib/genuine-verify/types'

interface GenuineUIProps {
  detectionState: DetectionState
  isCameraActive: boolean
  isModelLoading: boolean
  error: string | null
  errorDetails: string
  status: string
  blinkCount: number
  timeRemaining: number
  countdownMessage: string
  facePosition: { x: number; y: number; width: number; height: number } | null
  eyesDetected: boolean
  positioningMessage: string
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  onStart: () => void
  onReset: () => void
}

export const GenuineUI: React.FC<GenuineUIProps> = ({
  detectionState,
  isCameraActive,
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
  onStart,
  onReset
}) => {
  return (
    <div className="relative w-full max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Video Container */}
      <div className="relative aspect-video bg-gray-900">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />

        {/* Status Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isModelLoading && (
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
              <p>Loading face detection...</p>
            </div>
          )}

          {error && (
            <div className="text-white text-center p-4 bg-red-500/80 rounded-lg">
              <p className="font-bold">{error}</p>
              {errorDetails && (
                <p className="text-sm mt-1">{errorDetails}</p>
              )}
            </div>
          )}

          {!isCameraActive && !error && !isModelLoading && (
            <button
              onClick={onStart}
              className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              Start Verification
            </button>
          )}

          {detectionState === 'failed' && (
            <button
              onClick={onReset}
              className="px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          )}

          {positioningMessage && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full">
              {positioningMessage}
            </div>
          )}

          {/* Status Indicator */}
          <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            <div className={`w-2 h-2 rounded-full ${
              detectionState === 'failed'
                ? 'bg-red-400'
                : detectionState === 'success'
                  ? 'bg-green-400'
                  : 'bg-gray-400'
            }`} />
            <span>
              {detectionState === 'failed'
                ? 'Failed'
                : detectionState === 'success'
                  ? 'Verified'
                  : 'Looking for eyes...'
              }
            </span>
          </div>

          {/* Blink Counter */}
          {detectionState === 'blinking' && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-1">
              <div className="bg-black/50 text-white text-lg font-mono px-4 py-1 rounded-full">
                Blinks: {blinkCount}/3
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Footer */}
      <div className="flex items-center justify-between p-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            detectionState === 'failed'
              ? 'bg-red-500'
              : detectionState === 'success'
                ? 'bg-green-500'
                : 'bg-gray-400'
          }`} />
          <span className="font-mono text-sm text-gray-600">
            Status:
          </span>
        </div>
        <span className="font-mono text-sm text-gray-900">
          {status}
        </span>
      </div>
    </div>
  )
} 