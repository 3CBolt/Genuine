'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useGenuineDetection } from '../lib/hooks/useGenuineDetection'
import { usePresenceToken } from '../lib/usePresenceToken'
import { GenuineUI } from './GenuineUI'
import { DebugPanel } from './DebugPanel'
import { DEFAULT_THRESHOLDS } from '../lib/config'
import { createPresenceToken } from '../lib/tokenUtils'

export interface FailureContext {
  /** Reason for the failure */
  reason: 'max_attempts_reached' | 'gesture_timeout' | 'camera_error' | 'model_error' | 'unknown'
  /** Number of attempts made */
  attempts: number
  /** Maximum attempts allowed */
  maxAttempts: number
  /** Error details if available */
  error?: Error
  /** Timestamp of the failure */
  timestamp: string
}

export interface GenuineWidgetEmbeddableProps {
  /** Callback when a valid token is issued with metadata */
  onTokenIssued: (payload: {
    token: string;
    metadata: {
      issuedAt: string;
      expiresAt: string;
      gestureType: string;
    };
  }) => void
  /** Callback when gesture detection fails after max attempts */
  onFailure?: (context: FailureContext) => void
  /** Token time-to-live in seconds (default: 300) */
  tokenTTL?: number
  /** Show debug panel in development */
  debug?: boolean
  /** Head tilt threshold in degrees (default: 15) */
  headTiltThreshold?: number
  /** Persist token in sessionStorage (default: true) */
  persist?: boolean
  /** Trigger mode: 'auto' starts immediately, 'manual' requires user action, 'manualStart' requires explicit programmatic start */
  trigger?: 'auto' | 'manual' | 'manualStart'
  /** Callback for manual start function */
  onStartRef?: (startFn: () => void) => void
  /** Callback for errors */
  onError?: (error: Error) => void
  /** Maximum attempts before triggering fallback (default: 3) */
  maxAttempts?: number
  /** Custom fallback component to render when max attempts reached */
  fallback?: React.ComponentType<{
    failureContext: FailureContext
    triggerRetry: () => void
  }>
}

export const GenuineWidgetEmbeddable: React.FC<GenuineWidgetEmbeddableProps> = ({
  onTokenIssued,
  tokenTTL = 300,
  debug = false,
  headTiltThreshold = DEFAULT_THRESHOLDS.headTiltThreshold,
  persist = true,
  trigger = 'auto',
  onStartRef,
  onError
}) => {
  // Implementation will be moved from the main project
  return (
    <div>
      {/* SDK implementation will go here */}
    </div>
  )
} 