'use client'

import React, { useState } from 'react'
import { PresenceToken } from '@/lib/genuine-verify/presence'
import { UnifiedDetectionState } from '@/lib/genuine-verify/types'

interface DebugPanelProps {
  // Debug values
  gestureMatched: boolean
  confidenceScore: number
  fps: number
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
  unifiedDetectionState,
  tokenStatus,
  resetDetectionState,
  clearToken,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const handleReset = () => {
    resetDetectionState()
    clearToken()
  }

  // Get status indicator
  const getStatusIndicator = () => {
    if (gestureMatched) return '🟢 Verified'
    if (confidenceScore > 0) return '🟡 Tracking'
    return '🔴 Not Detected'
  }

  // Format confidence score
  const formatConfidence = () => {
    if (confidenceScore === 0) return '0.00'
    return confidenceScore.toFixed(2)
  }

  // Format FPS
  const formatFps = () => {
    return `${fps} FPS`
  }

  // Format token status
  const getTokenStatus = () => {
    if (tokenStatus.token) {
      return '✅ Found'
    }
    return '❌ None'
  }

  // Format expiration time
  const formatExpiration = () => {
    if (!tokenStatus.expiresAt) return 'N/A'
    return new Date(tokenStatus.expiresAt).toLocaleTimeString()
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
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="text-gray-500 hover:text-gray-700 text-xs"
            >
              {isCollapsed ? '🔽' : '🔼'}
            </button>
          )}
          <button
            onClick={handleToggleExpand}
            className="text-gray-500 hover:text-gray-700 text-xs"
          >
            {isExpanded ? '📄' : '📋'}
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className={`p-3 space-y-2 ${isExpanded ? 'max-h-96 overflow-y-auto' : ''}`}>
          {/* Status */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Status:</span>
            <span className="font-mono text-xs">{getStatusIndicator()}</span>
          </div>

          {/* Confidence Score */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Confidence:</span>
            <span className="font-mono text-xs">{formatConfidence()}</span>
          </div>

          {/* FPS */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">FPS:</span>
            <span className="font-mono text-xs">{formatFps()}</span>
          </div>

          {/* Unified Detection State */}
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Detection State:</div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-xs">Face:</span>
                <span className={`font-mono text-xs ${unifiedDetectionState.hasFace ? 'text-green-600' : 'text-red-600'}`}>
                  {unifiedDetectionState.hasFace ? '✅' : '❌'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-xs">Eyes:</span>
                <span className={`font-mono text-xs ${unifiedDetectionState.hasEyes ? 'text-green-600' : 'text-red-600'}`}>
                  {unifiedDetectionState.hasEyes ? '✅' : '❌'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-xs">Gesture:</span>
                <span className={`font-mono text-xs ${unifiedDetectionState.gestureMatched ? 'text-green-600' : 'text-red-600'}`}>
                  {unifiedDetectionState.gestureMatched ? '✅' : '❌'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-xs">Stable:</span>
                <span className={`font-mono text-xs ${unifiedDetectionState.isStable ? 'text-green-600' : 'text-red-600'}`}>
                  {unifiedDetectionState.isStable ? '✅' : '❌'}
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
            <span className="text-gray-600">Token:</span>
            <span className="font-mono text-xs">{getTokenStatus()}</span>
          </div>

          {/* Expiration */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Expires:</span>
            <span className="font-mono text-xs">{formatExpiration()}</span>
          </div>

          {/* Reset Button */}
          <div className="pt-2 border-t border-gray-200">
            <button
              onClick={handleReset}
              className="w-full bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2 rounded transition-colors"
            >
              Reset State + Clear Token
            </button>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="pt-2 border-t border-gray-200 space-y-1">
              <div className="text-xs text-gray-500">
                <div>Token ID: {tokenStatus.token?.token?.slice(0, 8) || 'N/A'}...</div>
                <div>Gesture: {tokenStatus.token?.gesture || 'N/A'}</div>
                <div>Version: {tokenStatus.token?.version || 'N/A'}</div>
                <div>Issued: {tokenStatus.token?.issuedAt ? new Date(tokenStatus.token.issuedAt).toLocaleTimeString() : 'N/A'}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 