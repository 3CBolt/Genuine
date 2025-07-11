
import React, { useState, useEffect } from 'react'
import { PresenceToken, UnifiedDetectionState, HeadTiltMetrics } from 'genuine-verify-sdk'

interface DebugPanelProps {
  // Debug values
  gestureMatched: boolean
  confidenceScore: number
  fps: number
  tiltMetrics?: HeadTiltMetrics
  unifiedDetectionState: UnifiedDetectionState
  tokenStatus: {
    token?: PresenceToken
    expiresAt?: string
  }
  
  // Actions
  resetDetectionState: () => void
  clearToken: () => void
  
  // Optional collapse state
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  gestureMatched,
  confidenceScore,
  fps,
  tiltMetrics,
  unifiedDetectionState,
  tokenStatus,
  resetDetectionState,
  clearToken,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Don't render until client-side to prevent hydration mismatch
  if (!isMounted) {
    return null
  }

  const handleReset = () => {
    resetDetectionState()
    clearToken()
  }

  // Get status indicator
  const getStatusIndicator = () => {
    if (gestureMatched) return '✓ Verified'
    if (confidenceScore > 0) return '! Tracking'
    return '× Not Detected'
  }

  // Format FPS
  const formatFps = () => {
    if (fps === 0) return '— FPS'
    return `${fps} FPS`
  }

  // Get FPS color indicator
  const getFpsColor = () => {
    if (fps === 0) return 'text-gray-500'
    if (fps >= 25) return 'text-green-600'
    if (fps >= 15) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Format confidence score
  const formatConfidence = () => {
    if (confidenceScore === 0) return '0%'
    return `${confidenceScore}%`
  }

  // Get confidence color indicator
  const getConfidenceColor = () => {
    if (confidenceScore === 0) return 'text-gray-500'
    if (confidenceScore >= 80) return 'text-green-600'
    if (confidenceScore >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Format token status
  const getTokenStatus = () => {
    if (tokenStatus.token) {
      return '✓ Valid Token'
    }
    return '× No Valid Token'
  }

  // Format expiration time
  const formatExpiration = () => {
    if (!tokenStatus.expiresAt) return 'N/A'
    return new Date(tokenStatus.expiresAt).toLocaleTimeString() + ' (local)'
  }

  // Calculate countdown
  const getCountdown = () => {
    if (!tokenStatus.expiresAt) return 'N/A'
    const now = new Date()
    const expires = new Date(tokenStatus.expiresAt)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  // Format token preview
  const getTokenPreview = () => {
    if (!tokenStatus.token?.token) return 'N/A'
    return `${tokenStatus.token.token.slice(0, 4)}...${tokenStatus.token.token.slice(-4)}`
  }

  // Check if detection is active
  const isDetectionActive = () => {
    return fps > 0 || confidenceScore > 0 || unifiedDetectionState.hasFace
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg text-sm text-black z-50 max-w-xs">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-gray-700">🔧 Debug Panel</span>
          {process.env.NODE_ENV === 'development' && (
            <span className="text-xs text-green-600 bg-green-100 px-1 rounded">DEV</span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onToggleCollapse}
            className="text-gray-500 hover:text-gray-700 text-xs"
            aria-label="Toggle Debug Info"
          >
            {isCollapsed ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-3 space-y-2">
          {/* Status */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Status:</span>
            <span className="font-mono text-xs">{getStatusIndicator()}</span>
          </div>

          {/* Detection Activity */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Detection:</span>
            <span className={`font-mono text-xs ${isDetectionActive() ? 'text-green-600' : 'text-gray-500'}`}>
              {isDetectionActive() ? '✓ Active' : '— Idle'}
            </span>
          </div>

          {/* Performance Indicators */}
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Performance:</div>
            <div className="space-y-1">
              {/* FPS */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-xs">FPS:</span>
                <span className={`font-mono text-xs ${getFpsColor()}`}>{formatFps()}</span>
              </div>

              {/* Confidence Score */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-xs">Confidence:</span>
                <span className={`font-mono text-xs ${getConfidenceColor()}`}>{formatConfidence()}</span>
              </div>

              {/* Confidence Bar */}
              {confidenceScore > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      confidenceScore >= 80 ? 'bg-green-500' : 
                      confidenceScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${confidenceScore}%` }}
                  />
                </div>
              )}

              {/* Performance Tips */}
              {fps > 0 && fps < 15 && (
                <div className="text-xs text-red-500 bg-red-50 p-1 rounded">
                  ⚠️ Low FPS - Consider closing other apps
                </div>
              )}
              {confidenceScore > 0 && confidenceScore < 50 && (
                <div className="text-xs text-yellow-500 bg-yellow-50 p-1 rounded">
                  💡 Tilt your head more for better detection
                </div>
              )}
            </div>
          </div>

          {/* Unified Detection State */}
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Detection State:</div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-xs">Face:</span>
                <span className={`font-mono text-xs ${unifiedDetectionState.hasFace ? 'text-green-600' : 'text-red-600'}`}>
                  {unifiedDetectionState.hasFace ? '✓' : '×'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-xs">Eyes:</span>
                <span className={`font-mono text-xs ${unifiedDetectionState.hasEyes ? 'text-green-600' : 'text-red-600'}`}>
                  {unifiedDetectionState.hasEyes ? '✓' : '×'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-xs">Gesture:</span>
                <span className={`font-mono text-xs ${unifiedDetectionState.gestureMatched ? 'text-green-600' : 'text-red-600'}`}>
                  {unifiedDetectionState.gestureMatched ? '✓' : '×'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-xs">Stable:</span>
                <span className={`font-mono text-xs ${unifiedDetectionState.isStable ? 'text-green-600' : 'text-red-600'}`}>
                  {unifiedDetectionState.isStable ? '✓' : '×'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-xs">Confidence:</span>
                <span className="font-mono text-xs">{unifiedDetectionState.confidence.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Token Status */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Token Status:</span>
            <span className="font-mono text-xs">{getTokenStatus()}</span>
          </div>

          {/* Expiration Time */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Expires at:</span>
            <span className="font-mono text-xs">{formatExpiration()}</span>
          </div>

          {/* Countdown */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Expires in:</span>
            <span className="font-mono text-xs">{getCountdown()}</span>
          </div>

          {/* Token Preview */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Token ID:</span>
            <span className="font-mono text-xs">{getTokenPreview()}</span>
          </div>

          {/* Clear Token Button */}
          <div className="pt-2 border-t border-gray-200">
            <button
              onClick={() => {
                clearToken()
                location.reload()
              }}
              className="w-full bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2 rounded transition-colors"
            >
              Clear Token
            </button>
          </div>

          {/* Expanded Details */}
          <div className="pt-2 border-t border-gray-200 space-y-1">
            <div className="text-xs text-gray-500">
              <div>Token ID: {tokenStatus.token?.token?.slice(0, 8) || 'N/A'}...</div>
              <div>Gesture: {tokenStatus.token?.gesture || 'N/A'}</div>
              <div>Version: {tokenStatus.token?.version || 'N/A'}</div>
              <div>Issued: {tokenStatus.token?.issuedAt ? new Date(tokenStatus.token.issuedAt).toLocaleTimeString() : 'N/A'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 