import { useState, useRef, useCallback, useEffect } from 'react'
import { DetectionState, DetectionMetrics, FaceDetectionModel, FaceDetectionPrediction, EyeState, FacePosition, HeadTiltMetrics, UnifiedDetectionState } from '../types'
import { cleanup, startCamera } from '../camera'
import { loadBlazeFaceModel, detectFaces, calculateHeadTilt, isModelLoaded, isModelLoading, clearModel, coordsFromTensor1D, isTensor1D } from '../blazeface'
import { usePresenceToken } from '../usePresenceToken'
import { getPresenceToken, isTokenExpired } from '../presence'

const REQUIRED_STABLE_FRAMES = 5
const MAX_MISSED_FRAMES = 3
const DETECTION_TIMEOUT = 5000
const HEAD_TILT_THRESHOLD = 15 // degrees
const HEAD_TILT_DURATION = 1500 // ms
const MIN_EYE_CONFIDENCE = 0.2
const ALLOW_LOW_CONFIDENCE = true
const BUFFER_SIZE = 10
const TILT_BUFFER_SIZE = 5
const TILT_ANGLE_THRESHOLD = 15
const TILT_DIRECTION_THRESHOLD = 0.7 // 70% of frames must agree on direction

// Interface for tilt buffer
interface TiltBuffer {
  angles: number[]
  directions: ('left' | 'right' | 'none')[]
  timestamps: number[]
}

interface GenuineDetectionOptions {
  videoElement?: HTMLVideoElement
  canvasElement?: HTMLCanvasElement
}

export function useGenuineDetection(options?: GenuineDetectionOptions & {
  gestureType?: 'headTilt',
  headTiltThreshold?: number,
  onSuccess?: (token: string) => void,
  onError?: (error: Error) => void,
  persist?: boolean,
  trigger?: 'auto' | 'manual',
  onStartRef?: (startFn: () => void) => void
}) {
  const gestureType = options?.gestureType || 'headTilt';
  const headTiltThreshold = options?.headTiltThreshold ?? 15;
  const onSuccess = options?.onSuccess;
  const onError = options?.onError;
  const persist = options?.persist;
  const { token: storedToken, isValid: isStoredTokenValid, saveToken, clearToken, getStoredToken } = usePresenceToken(persist);
  const [verified, setVerified] = useState<boolean>(false);
  const trigger = options?.trigger ?? 'auto';
  const onStartRef = options?.onStartRef;

  // Track manual start state
  const [manualStarted, setManualStarted] = useState(trigger === 'auto');

  // Track last head tilt metrics for debug
  const [headTiltMetrics, setHeadTiltMetrics] = useState<HeadTiltMetrics | null>(null);

  // Core state
  const [detectionState, setDetectionState] = useState<DetectionState>('idle')
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [modelLoading, setModelLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string>('')
  
  // Unified detection state for real-time UI updates
  const [unifiedDetectionState, setUnifiedDetectionState] = useState<UnifiedDetectionState>({
    hasFace: false,
    hasEyes: false,
    gestureMatched: false,
    isStable: false,
    confidence: 0,
    lastUpdate: 0
  })
  
  // Debug state
  const [gestureMatched, setGestureMatched] = useState<boolean>(false)
  const [confidenceScore, setConfidenceScore] = useState<number>(0)
  const [fps, setFps] = useState<number>(0)
  const [lastFrameTime, setLastFrameTime] = useState<number>(0)
  
  // Detection state
  const [status, setStatus] = useState<string>('Click to start verification')
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [countdownMessage, setCountdownMessage] = useState('')

  // Detection stability tracking
  const stableDetectionFrames = useRef<number>(0)
  const missedFrames = useRef<number>(0)
  const lastStableDetectionTime = useRef<number>(0)
  const detectionStartTime = useRef<number>(0)
  const tiltStartTime = useRef<number | null>(null)
  const lastTiltDirection = useRef<'left' | 'right' | 'none'>('none')

  // Refs - create independent refs
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const modelRef = useRef<FaceDetectionModel | null>(null)
  const detectionIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recoveryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Add tilt buffer ref
  const tiltBuffer = useRef<TiltBuffer>({
    angles: [],
    directions: [],
    timestamps: []
  })

  // Throttle log state
  const lastLogTime = useRef(0)
  const LOG_THROTTLE_MS = 500
  
  // Track reset state to prevent immediate onSuccess calls
  const isResetting = useRef(false)

  // Framing box config
  const FRAMING_BOX_COLOR = 'rgba(0,200,255,0.3)'
  const FRAMING_BOX_BORDER = 'rgba(0,200,255,0.8)'
  const FRAMING_BOX_WIDTH_RATIO = 0.5
  const FRAMING_BOX_HEIGHT_RATIO = 0.6
  const NO_FACE_GUIDE_TIMEOUT = 3000
  const [framingGuideMessage, setFramingGuideMessage] = useState('')
  const lastFaceDetectedTime = useRef(Date.now())

  // Enhanced FPS tracking with frame counting
  const frameCount = useRef<number>(0)
  const fpsStartTime = useRef<number>(0)
  const fpsUpdateTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Throttled FPS updates (every 200ms)
  const updateFpsThrottled = useCallback((newFps: number) => {
    if (fpsUpdateTimeout.current) {
      clearTimeout(fpsUpdateTimeout.current)
    }
    
    fpsUpdateTimeout.current = setTimeout(() => {
      setFps(newFps)
    }, 200)
  }, [])

  // Calculate FPS over 1-second intervals
  const calculateFps = useCallback(() => {
    const now = performance.now()
    
    if (fpsStartTime.current === 0) {
      fpsStartTime.current = now
      frameCount.current = 0
      return
    }
    
    frameCount.current++
    
    const elapsed = now - fpsStartTime.current
    if (elapsed >= 1000) { // 1 second interval
      const calculatedFps = Math.round((frameCount.current * 1000) / elapsed)
      updateFpsThrottled(calculatedFps)
      
      // Reset for next interval
      fpsStartTime.current = now
      frameCount.current = 0
    }
  }, [updateFpsThrottled])

  // Calculate confidence based on head tilt proximity to threshold
  const calculateHeadTiltConfidence = useCallback((tiltAngle: number, threshold: number): number => {
    if (Math.abs(tiltAngle) === 0) return 0
    
    // Normalize to 0-1 scale based on proximity to threshold
    const normalizedAngle = Math.abs(tiltAngle) / threshold
    const confidence = Math.min(normalizedAngle, 1.0) // Cap at 100%
    
    // Apply smoothing curve for better UX
    return Math.round(confidence * 100)
  }, [])

  // Add tilt validation function
  const validateTilt = useCallback((
    currentTilt: HeadTiltMetrics,
    buffer: TiltBuffer
  ): boolean => {
    // Check if we have enough samples
    if (buffer.angles.length < TILT_BUFFER_SIZE) {
      return false
    }

    // Calculate average angle
    const avgAngle = buffer.angles.reduce((a, b) => a + b) / buffer.angles.length
    
    // Check direction consistency
    const directionCounts = buffer.directions.reduce((acc, dir) => {
      acc[dir] = (acc[dir] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const dominantDirection = Object.entries(directionCounts)
      .sort(([,a], [,b]) => b - a)[0][0] as 'left' | 'right' | 'none'
    
    const directionConfidence = directionCounts[dominantDirection] / TILT_BUFFER_SIZE

    return (
      Math.abs(avgAngle) > TILT_ANGLE_THRESHOLD &&
      directionConfidence > TILT_DIRECTION_THRESHOLD &&
      currentTilt.tiltDirection === dominantDirection
    )
  }, [])

  // Get the current video element
  const getVideoElement = useCallback((): HTMLVideoElement | null => {
    return videoRef.current
  }, [])

  // Get the current canvas element
  const getCanvasElement = useCallback((): HTMLCanvasElement | null => {
    return canvasRef.current
  }, [])

  // UI state
  const [facePosition, setFacePosition] = useState<FacePosition | null>(null)
  const [eyesDetected, setEyesDetected] = useState(false)
  const [positioningMessage, setPositioningMessage] = useState('')

  // Detection buffer for stable tracking
  const detectionBuffer = useRef<DetectionMetrics[]>([])

  const clearDetectionInterval = useCallback(() => {
    const interval = detectionIntervalRef.current
    if (interval) {
      clearInterval(interval)
      detectionIntervalRef.current = null
    }
  }, [])

  // Enhanced reset function that clears all internal state
  const resetDetectionState = useCallback(() => {
    // Set reset flag to prevent immediate onSuccess calls
    isResetting.current = true
    
    // Reset all UI state
    setDetectionState('idle')
    setStatus('Click to start verification')
    setGestureMatched(false)
    setConfidenceScore(0)
    setTimeRemaining(0)
    setCountdownMessage('')
    setFacePosition(null)
    setEyesDetected(false)
    setPositioningMessage('')
    setFramingGuideMessage('')
    
    // Reset verified state - this is crucial for token clearing
    setVerified(false)
    
    // Reset unified detection state
    setUnifiedDetectionState({
      hasFace: false,
      hasEyes: false,
      gestureMatched: false,
      isStable: false,
      confidence: 0,
      lastUpdate: 0
    })
    
    // Reset debug state
    setFps(0)
    setLastFrameTime(0)
    
    // Reset FPS tracking
    frameCount.current = 0
    fpsStartTime.current = 0
    if (fpsUpdateTimeout.current) {
      clearTimeout(fpsUpdateTimeout.current)
      fpsUpdateTimeout.current = null
    }
    
    // Reset all refs
    stableDetectionFrames.current = 0
    missedFrames.current = 0
    lastStableDetectionTime.current = 0
    detectionStartTime.current = 0
    tiltStartTime.current = null
    lastTiltDirection.current = 'none'
    tiltBuffer.current = {
      angles: [],
      directions: [],
      timestamps: []
    }

    detectionBuffer.current = []
    lastFaceDetectedTime.current = Date.now()
    
    // Clear intervals and timeouts
    clearDetectionInterval()
    if (recoveryTimeoutRef.current) {
      clearTimeout(recoveryTimeoutRef.current)
      recoveryTimeoutRef.current = null
    }
    if (detectionLoopRef.current) {
      cancelAnimationFrame(detectionLoopRef.current)
      detectionLoopRef.current = null
    }
    
    // Clear reset flag after a short delay to allow fresh detection
    setTimeout(() => {
      isResetting.current = false
    }, 1000)
  }, [clearDetectionInterval])

  const calculateHeadTiltMetrics = useCallback((leftEyeRaw: any, rightEyeRaw: any): HeadTiltMetrics => {
    let leftEye: [number, number] | null = null;
    let rightEye: [number, number] | null = null;
    if (isTensor1D(leftEyeRaw)) leftEye = coordsFromTensor1D(leftEyeRaw);
    else if (Array.isArray(leftEyeRaw) && leftEyeRaw.length === 2) leftEye = leftEyeRaw as [number, number];
    if (isTensor1D(rightEyeRaw)) rightEye = coordsFromTensor1D(rightEyeRaw);
    else if (Array.isArray(rightEyeRaw) && rightEyeRaw.length === 2) rightEye = rightEyeRaw as [number, number];
    if (!leftEye || !rightEye) return {
      leftEyeY: 0,
      rightEyeY: 0,
      noseBridgeY: 0,
      chinY: 0,
      tiltAngle: 0,
      tiltDirection: 'none',
      isTilted: false,
      tiltStartTime: null,
      smoothedAngle: 0,
      confidence: 0,
      isStable: false,
      faceAlignment: 0
    };
    const tiltAngle = calculateHeadTilt(leftEye, rightEye);
    
    // Determine tilt direction
    const tiltDirection = leftEye[1] < rightEye[1] ? 'left' : 'right'
    const isTilted = Math.abs(tiltAngle) > HEAD_TILT_THRESHOLD

    // Update tilt buffer
    tiltBuffer.current = {
      angles: [...tiltBuffer.current.angles.slice(-TILT_BUFFER_SIZE), tiltAngle],
      directions: [...tiltBuffer.current.directions.slice(-TILT_BUFFER_SIZE), tiltDirection],
      timestamps: [...tiltBuffer.current.timestamps.slice(-TILT_BUFFER_SIZE), Date.now()]
    }

    // Calculate smoothed angle and confidence
    const smoothedAngle = tiltBuffer.current.angles.length > 0 
      ? tiltBuffer.current.angles.reduce((a, b) => a + b) / tiltBuffer.current.angles.length 
      : tiltAngle

    const confidence = tiltBuffer.current.directions.length > 0
      ? tiltBuffer.current.directions.filter(d => d === tiltDirection).length / tiltBuffer.current.directions.length
      : 0

    // Calculate face alignment (-1 to 1, where 0 is perfectly aligned)
    const faceAlignment = Math.min(Math.max((tiltAngle / HEAD_TILT_THRESHOLD) * -1, -1), 1)

    // Validate tilt stability
    const isStable = validateTilt({
      leftEyeY: leftEye[1],
      rightEyeY: rightEye[1],
      noseBridgeY: 0, // Not available in BlazeFace
      chinY: 0, // Not available in BlazeFace
      tiltAngle,
      tiltDirection,
      isTilted,
      tiltStartTime: isTilted ? tiltStartTime.current : null,
      smoothedAngle,
      confidence,
      isStable: false,
      faceAlignment
    }, tiltBuffer.current)

    return {
      leftEyeY: leftEye[1],
      rightEyeY: rightEye[1],
      noseBridgeY: 0,
      chinY: 0,
      tiltAngle,
      tiltDirection,
      isTilted,
      tiltStartTime: isTilted ? tiltStartTime.current : null,
      smoothedAngle,
      confidence,
      isStable,
      faceAlignment
    }
  }, [validateTilt])

  const updateDetectionState = useCallback((metrics: DetectionMetrics) => {
    detectionBuffer.current = [
      ...detectionBuffer.current.slice(-(BUFFER_SIZE - 1)),
      metrics
    ]

    // Check for stable detection with relaxed criteria
    const recentFrames = detectionBuffer.current.slice(-REQUIRED_STABLE_FRAMES)
    const validFrames = recentFrames.filter((frame: DetectionMetrics) => {
      const hasValidEyes = frame.leftEye[1] > 0 || frame.rightEye[1] > 0
      const hasMinConfidence = frame.eyeConfidence > MIN_EYE_CONFIDENCE
      return hasValidEyes && (hasMinConfidence || ALLOW_LOW_CONFIDENCE)
    }).length

    const isStableDetection = validFrames >= REQUIRED_STABLE_FRAMES
    const isLowConfidence = metrics.eyeConfidence <= 0.3

    if (isStableDetection) {
      stableDetectionFrames.current++
      missedFrames.current = 0
      lastStableDetectionTime.current = Date.now()

      if (stableDetectionFrames.current >= REQUIRED_STABLE_FRAMES && detectionState === 'eyes-detected') {
        if (isLowConfidence) {
          setStatus('Eyes detected (low confidence)')
        }
        setDetectionState('head-tilt-left')
        setStatus("Tilt your head slightly left or right to verify you're human")
      }
    } else {
      missedFrames.current++
      if (missedFrames.current > MAX_MISSED_FRAMES && !detectionState.includes('head-tilt')) {
        setDetectionState('failed')
        setStatus('Detection failed. Click Try Again.')
        setCountdownMessage('')
        clearDetectionInterval()
      }
    }

    // Update UI state
    setFacePosition(metrics.facePosition)
    setEyesDetected(isStableDetection)
    setPositioningMessage(isStableDetection ? '' : 'Look straight at the screen')
  }, [detectionState, clearDetectionInterval])

  const handleDetectionError = useCallback((error: Error, context: string) => {
    setError(`Detection error: ${error.message}`)
    setErrorDetails(`Context: ${context}\nStack: ${error.stack || 'No stack trace'}`)
    setDetectionState('failed')
    setStatus('An error occurred during detection')
    clearDetectionInterval()
    
    // Call the onError callback if provided
    onError?.(new Error(`Detection error: ${error.message}`))
  }, [clearDetectionInterval, onError])

  // Draw dynamic overlays for face detection and framing guide
  const drawDebugOverlay = useCallback((face: FaceDetectionPrediction | null) => {
    const canvas = getCanvasElement()
    const video = getVideoElement()
    if (!canvas || !video) {
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw framing box (centered)
    const boxW = canvas.width * FRAMING_BOX_WIDTH_RATIO
    const boxH = canvas.height * FRAMING_BOX_HEIGHT_RATIO
    const boxX = (canvas.width - boxW) / 2
    const boxY = (canvas.height - boxH) / 2
    ctx.save()
    ctx.strokeStyle = FRAMING_BOX_BORDER
    ctx.lineWidth = 3
    ctx.globalAlpha = 1
    ctx.strokeRect(boxX, boxY, boxW, boxH)
    ctx.globalAlpha = 0.2
    ctx.fillStyle = FRAMING_BOX_COLOR
    ctx.fillRect(boxX, boxY, boxW, boxH)
    ctx.restore()

    if (!face) return
    // Draw bounding box
    const topLeft = Array.isArray(face.topLeft) ? face.topLeft : face.topLeft.arraySync()
    const bottomRight = Array.isArray(face.bottomRight) ? face.bottomRight : face.bottomRight.arraySync()
    const [x, y] = topLeft
    const [x2, y2] = bottomRight
    ctx.strokeStyle = 'lime'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, x2 - x, y2 - y)
    // Draw eye landmarks
    const landmarks = face.landmarks ? (Array.isArray(face.landmarks) ? face.landmarks : face.landmarks.arraySync()) : undefined
    if (landmarks && landmarks.length >= 2) {
      ctx.fillStyle = 'cyan'
      landmarks.slice(0, 2).forEach((landmark: number[]) => {
        if (landmark && landmark.length >= 2) {
          ctx.beginPath()
          ctx.arc(landmark[0], landmark[1], 4, 0, 2 * Math.PI)
          ctx.fill()
        }
      })
    }
  }, [getCanvasElement, getVideoElement])

  // Main detection loop using BlazeFace
  const detectionLoopRef = useRef<number | null>(null)
  const runDetectionLoop = useCallback(async () => {
    const videoElement = getVideoElement()
    if (!videoElement || !modelRef.current || !videoElement.srcObject) {
      detectionLoopRef.current = requestAnimationFrame(runDetectionLoop)
      return
    }

    // Enhanced FPS calculation
    calculateFps()
    setLastFrameTime(performance.now())

    try {
      const result = await detectFaces(videoElement, modelRef.current)
      
      if (!result.isDetected) {
        drawDebugOverlay(null)
        lastFaceDetectedTime.current = Date.now()
        
        // Update unified detection state
        setUnifiedDetectionState(prev => ({
          ...prev,
          hasFace: false,
          hasEyes: false,
          gestureMatched: false,
          isStable: false,
          confidence: 0,
          lastUpdate: Date.now()
        }))
        
        setStatus(getStatusMessage({
          hasFace: false,
          hasEyes: false,
          gestureMatched: false,
          isStable: false,
          confidence: 0,
          lastUpdate: Date.now()
        }))
        setGestureMatched(false)
        setConfidenceScore(0)
      } else {
        drawDebugOverlay(result.face)
        lastFaceDetectedTime.current = Date.now()

        // Create detection metrics
        const metrics: DetectionMetrics = {
          timestamp: Date.now(),
          eyeConfidence: result.confidence,
          leftEye: result.landmarks.leftEye || [0, 0],
          rightEye: result.landmarks.rightEye || [0, 0],
          facePosition: result.face ? {
            x: Array.isArray(result.face.topLeft) ? result.face.topLeft[0] : result.face.topLeft.arraySync()[0],
            y: Array.isArray(result.face.topLeft) ? result.face.topLeft[1] : result.face.topLeft.arraySync()[1],
            width: (Array.isArray(result.face.bottomRight) ? result.face.bottomRight[0] : result.face.bottomRight.arraySync()[0]) - 
                  (Array.isArray(result.face.topLeft) ? result.face.topLeft[0] : result.face.topLeft.arraySync()[0]),
            height: (Array.isArray(result.face.bottomRight) ? result.face.bottomRight[1] : result.face.bottomRight.arraySync()[1]) -
                   (Array.isArray(result.face.topLeft) ? result.face.topLeft[1] : result.face.topLeft.arraySync()[1])
          } : { x: 0, y: 0, width: 0, height: 0 },
          eyesDetected: !!(result.landmarks.leftEye && result.landmarks.rightEye)
        }

        // Calculate gesture detection based on gestureType
        let leftEye = result.landmarks.leftEye;
        let rightEye = result.landmarks.rightEye;
        if (isTensor1D(leftEye)) leftEye = coordsFromTensor1D(leftEye);
        if (isTensor1D(rightEye)) rightEye = coordsFromTensor1D(rightEye);
        
        const hasEyes = Array.isArray(leftEye) && Array.isArray(rightEye) && 
                       (leftEye[0] > 0 || leftEye[1] > 0) && (rightEye[0] > 0 || rightEye[1] > 0);
        
        let gestureMatched = false;
        let confidence = result.confidence;
        let isStable = false;
        
        if (hasEyes) {
          // Head tilt detection (only supported gesture)
          const headTilt = calculateHeadTiltMetrics(leftEye, rightEye);
          metrics.headTilt = headTilt;
          setHeadTiltMetrics(headTilt);

          // Enhanced confidence calculation based on tilt proximity
          const tiltConfidence = calculateHeadTiltConfidence(headTilt.tiltAngle, headTiltThreshold)
          setConfidenceScore(tiltConfidence)
          
          gestureMatched = headTilt.isTilted && headTilt.isStable;
          confidence = headTilt.confidence;
          isStable = headTilt.isStable;
          setGestureMatched(gestureMatched)

          // Check for successful head tilt
          if (gestureMatched) {
            if (detectionState === 'head-tilt-left' || detectionState === 'head-tilt-right') {
              setDetectionState('success');
              setStatus('Human Verified');
              const presenceToken = getPresenceToken(gestureType);
              if (persist) saveToken(presenceToken);
              setVerified(true);
              
              // Only call onSuccess if we're not in a reset state
              if (!isResetting.current) {
                onSuccess?.(presenceToken.token);
              }
            }
          }
        } else {
          setConfidenceScore(0)
          setGestureMatched(false)
        }

        // Update unified detection state
        const newUnifiedState = {
          hasFace: true,
          hasEyes,
          gestureMatched,
          isStable,
          confidence,
          lastUpdate: Date.now()
        };
        
        setUnifiedDetectionState(newUnifiedState);
        setStatus(getStatusMessage(newUnifiedState));

        updateDetectionState(metrics)
      }
    } catch (err) {
      handleDetectionError(err as Error, 'detection loop')
    }

    detectionLoopRef.current = requestAnimationFrame(runDetectionLoop)
  }, [getVideoElement, drawDebugOverlay, updateDetectionState, handleDetectionError, detectionState, onSuccess, persist, calculateFps, calculateHeadTiltConfidence, headTiltThreshold])

  // On mount, check for valid token if persist: true
  useEffect(() => {
    if (persist && storedToken && !isTokenExpired(storedToken)) {
      setVerified(true)
      // Only call onSuccess if we're not in a reset state
      if (!isResetting.current) {
        onSuccess?.(storedToken.token)
      }
      // Skip detection/model/camera logic
      return
    }
  }, [persist, storedToken, onSuccess])

  // Enhanced clearToken function that resets all state
  const enhancedClearToken = useCallback(() => {
    // Clear the stored token
    clearToken()
    
    // Reset all internal state immediately
    resetDetectionState()
    
    // Ensure camera and detection are ready to restart
    if (modelLoaded && !isCameraActive) {
      setStatus('Click to start verification')
    }
  }, [clearToken, resetDetectionState, modelLoaded, isCameraActive])

  // Watch for token changes and handle state transitions
  useEffect(() => {
    // If token was cleared and we were verified, ensure we restart detection
    if (!storedToken && verified) {
      setVerified(false)
      setStatus('Click to start verification')
      
      // If camera was active, restart it
      if (modelLoaded && !isCameraActive) {
        setDetectionState('idle')
      }
    }
  }, [storedToken, verified, modelLoaded, isCameraActive])

  // Manual start function
  const manualStartFn = useCallback(() => {
    setManualStarted(true);
  }, []);

  // Expose manualStartFn via onStartRef
  useEffect(() => {
    if (onStartRef) {
      onStartRef(manualStartFn);
    }
  }, [onStartRef, manualStartFn]);

  // Only run detection/model/camera logic if not verified and (auto or manualStarted)
  useEffect(() => {
    if (verified) return;
    if ((trigger === 'auto' || manualStarted) && modelLoaded && isCameraActive) {
      if (detectionLoopRef.current) {
        cancelAnimationFrame(detectionLoopRef.current)
      }
      detectionLoopRef.current = requestAnimationFrame(runDetectionLoop)
      return () => {
        if (detectionLoopRef.current) {
          cancelAnimationFrame(detectionLoopRef.current)
        }
      }
    }
  }, [modelLoaded, isCameraActive, runDetectionLoop, verified, trigger, manualStarted])

  // Load BlazeFace model
  useEffect(() => {
    const loadModel = async () => {
      try {
        setModelLoading(true)
        setError(null)
        setErrorDetails('')
        
        const model = await loadBlazeFaceModel()
        modelRef.current = model
        setModelLoaded(true)
        setModelLoading(false)
      } catch (err) {
        const error = new Error('Failed to load face detection model. Please try refreshing the page.')
        setError(error.message)
        setErrorDetails((err as Error).message)
        setModelLoading(false)
        setModelLoaded(false)
        
        // Call the onError callback if provided
        onError?.(error)
      }
    }
    loadModel()
    return () => {
      clearModel()
    }
  }, [onError])

  const handleCleanup = useCallback(() => {
    cleanup({
      videoRef,
      detectionIntervalRef,
      setIsCameraActive,
      setError,
      setErrorDetails,
      setStatus,
      stableDetectionFrames,
      missedFrames,
      lastStableDetectionTime,
      detectionStartTime,
      setTimeRemaining,
      setCountdownMessage,
      setFacePosition,
      setEyesDetected,
      setPositioningMessage,
      setDetectionState,
      error
    })
  }, [error])

  const handleStartCamera = useCallback(async () => {
    await startCamera({
      isModelLoading: modelLoading,
      isModelLoaded: modelLoaded,
      modelRef,
      videoRef,
      setStatus,
      setIsCameraActive,
      setError,
      setErrorDetails,
      setDetectionState,
      detectionStartTime,
      detectionIntervalRef,
      setFacePosition,
      setEyesDetected
    })
  }, [modelLoading, modelLoaded])

  useEffect(() => {
    // Remove static test box on mount
    const canvas = getCanvasElement()
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [getCanvasElement])

  // Set canvas size to match video when video is ready
  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const setCanvasSize = () => {
      if (video.videoWidth && video.videoHeight) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
      }
    }
    video.addEventListener('loadedmetadata', setCanvasSize)
    setCanvasSize()
    return () => {
      video.removeEventListener('loadedmetadata', setCanvasSize)
    }
  }, [videoRef, canvasRef])

  // Auto-reset logic after success
  useEffect(() => {
    if (unifiedDetectionState.gestureMatched) {
      const timeout = setTimeout(() => {
        setUnifiedDetectionState(prev => ({
          ...prev,
          hasFace: false,
          hasEyes: false,
          gestureMatched: false
        }))
      }, 5000) // Reset after 5 seconds
      return () => clearTimeout(timeout)
    }
  }, [unifiedDetectionState.gestureMatched])

  // Status message function based on unified detection state
  const getStatusMessage = useCallback((state: UnifiedDetectionState): string => {
    if (!state.hasFace) return "Looking for your face..."
    if (!state.hasEyes) return "Looking for your eyes..."
    if (!state.gestureMatched) return "Tilt your head slightly left or right to verify you're human."
    return "✅ Gesture verified!"
  }, [])

  return {
    // State
    detectionState,
    isCameraActive,
    isModelLoaded: modelLoaded,
    isModelLoading: modelLoading,
    error,
    errorDetails,
    status,
    timeRemaining,
    countdownMessage,
    facePosition,
    eyesDetected,
    positioningMessage,
    verified,

    // Unified detection state for real-time UI
    unifiedDetectionState,

    // Debug values
    gestureMatched,
    confidenceScore,
    fps,
    tokenStatus: {
      token: storedToken,
      expiresAt: storedToken?.expiresAt
    },

    // Refs - only return refs if no elements were injected
    videoRef: options?.videoElement ? { current: options.videoElement } : videoRef,
    canvasRef: options?.canvasElement ? { current: options.canvasElement } : canvasRef,

    // Actions
    handleStartCamera,
    handleCleanup,
    clearDetectionInterval,
    resetDetectionState,
    clearToken: enhancedClearToken,
    headTiltMetrics,
    manualStartFn
  }
} 