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
}

export const GenuineWidget: React.FC<GenuineWidgetProps> = (props) => {
  // Implementation will be moved from the main project
  return (
    <div>
      {/* SDK implementation will go here */}
    </div>
  )
} 