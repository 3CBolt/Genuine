import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'

export type DetectionState = 
  | 'idle'
  | 'camera-active'
  | 'eyes-detected'
  | 'head-tilt-left'
  | 'head-tilt-right'
  | 'head-tilt-success'
  | 'success'
  | 'failed'
  | 'recovering'

export interface FacePosition {
  x: number
  y: number
  width: number
  height: number
}

export interface HeadTiltMetrics {
  leftEyeY: number
  rightEyeY: number
  noseBridgeY: number
  chinY: number
  tiltAngle: number
  tiltDirection: 'left' | 'right' | 'none'
  isTilted: boolean
  tiltStartTime: number | null
  smoothedAngle: number
  confidence: number
  isStable: boolean
  faceAlignment: number
}

export interface DetectionMetrics {
  timestamp: number
  eyeConfidence: number
  leftEye: [number, number]
  rightEye: [number, number]
  facePosition: FacePosition
  eyesDetected: boolean
  headTilt?: HeadTiltMetrics
}

export interface EyeState {
  left: number
  right: number
}

export type FaceMeshModel = faceLandmarksDetection.FaceLandmarksDetector
export type FaceMeshPrediction = Awaited<ReturnType<FaceMeshModel['estimateFaces']>>[0]

export interface CameraState {
  isCameraActive: boolean
  isModelLoaded: boolean
  isModelLoading: boolean
  error: string | null
  errorDetails: string
}

export interface DetectionConfig {
  REQUIRED_STABLE_FRAMES: number
  MAX_MISSED_FRAMES: number
  DETECTION_TIMEOUT: number
  BLINK_THRESHOLD: number
  MIN_EYE_CONFIDENCE: number
  ALLOW_LOW_CONFIDENCE: boolean
  DEBUG: boolean
}

export interface DetectionStateData {
  stableDetectionFrames: number
  missedFrames: number
  lastStableDetectionTime: number
  detectionStartTime: number
  lastEyeState: EyeState | null
  lastBlinkTime: number
  detectionBuffer: DetectionMetrics[]
}

export interface DetectionCallbacks {
  onStateChange: (state: DetectionState) => void
  onBlinkDetected: () => void
  onError: (error: Error, context: string) => void
  onMetricsUpdate: (metrics: DetectionMetrics, face: FaceMeshPrediction) => void
} 