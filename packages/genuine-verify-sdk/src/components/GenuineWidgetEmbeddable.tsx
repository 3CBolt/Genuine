'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useGenuineDetection } from '../lib/hooks/useGenuineDetection'
import { usePresenceToken } from '../lib/usePresenceToken'
import { GenuineUI } from './GenuineUI'
import { DebugPanel } from './DebugPanel'
import { DEFAULT_THRESHOLDS } from '../lib/config'
import { createPresenceToken } from '../lib/tokenUtils'

export interface GenuineWidgetEmbeddableProps {
  /** Callback when a valid token is issued */
  onTokenIssued: (token: string) => void
  /** Token time-to-live in seconds (default: 300) */
  tokenTTL?: number
  /** Show debug panel in development */
  debug?: boolean
  /** Head tilt threshold in degrees (default: 15) */
  headTiltThreshold?: number
  /** Persist token in sessionStorage (default: true) */
  persist?: boolean
  /** Trigger mode: 'auto' starts immediately, 'manual' requires user action */
  trigger?: 'auto' | 'manual'
  /** Callback for manual start function */
  onStartRef?: (startFn: () => void) => void
  /** Callback for errors */
  onError?: (error: Error) => void
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