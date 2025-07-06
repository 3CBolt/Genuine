'use client'

import React from 'react'
import { useGenuineDetection } from '../lib/hooks/useGenuineDetection'
import { usePresenceToken } from '../lib/usePresenceToken'
import { GenuineUI } from './GenuineUI'
import { DebugPanel } from './DebugPanel'
import { DEFAULT_THRESHOLDS } from '../lib/config'
import { PresenceToken } from '../lib/presence'

export interface GenuineWidgetProps {
  gestureType: 'blink' | 'headTilt';
  onSuccess: (token: PresenceToken) => void;
  onError?: (error: Error) => void;
  debug?: boolean;
  blinkThreshold?: number;
  headTiltThreshold?: number;
  showGestureFeedback?: boolean;
  persist?: boolean;
  trigger?: 'auto' | 'manual';
  onStartRef?: (startFn: () => void) => void;
}

export const GenuineWidget: React.FC<GenuineWidgetProps> = (props) => {
  // Implementation will be moved from the main project
  return (
    <div>
      {/* SDK implementation will go here */}
    </div>
  )
} 