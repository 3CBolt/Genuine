import { useState, useRef, useCallback, useEffect } from 'react'
import * as tf from '@tensorflow/tfjs'
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'
import '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'
import { DetectionState, DetectionMetrics, FaceMeshModel, FaceMeshPrediction, EyeState, FacePosition, HeadTiltMetrics } from '../types'
import { cleanup, startCamera } from '../camera'
import * as blazeface from '@tensorflow-models/blazeface'

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

// MediaPipe FaceMesh landmarks for head tilt detection
const LANDMARKS = {
  LEFT_EYE_OUTER: 33,
  RIGHT_EYE_OUTER: 263,
  NOSE_BRIDGE: 168,
  CHIN: 152,
  LEFT_EYE_INNER: 133,
  RIGHT_EYE_INNER: 362,
  LEFT_EAR: 234,
  RIGHT_EAR: 454,
  FOREHEAD: 10
}

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

export function useGenuineDetection(options?: GenuineDetectionOptions) {
  // Core state
  const [detectionState, setDetectionState] = useState<DetectionState>('idle')
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string>('')
  const [isModelLoading, setIsModelLoading] = useState(true)
  
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

  // Refs - use injected elements if provided, otherwise use refs
  const videoRef = useRef<HTMLVideoElement | null>(options?.videoElement || null)
  const canvasRef = useRef<HTMLCanvasElement | null>(options?.canvasElement || null)
  const modelRef = useRef<FaceMeshModel | null>(null)
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

  // Framing box config
  const FRAMING_BOX_COLOR = 'rgba(0,200,255,0.3)'
  const FRAMING_BOX_BORDER = 'rgba(0,200,255,0.8)'
  const FRAMING_BOX_WIDTH_RATIO = 0.5
  const FRAMING_BOX_HEIGHT_RATIO = 0.6
  const NO_FACE_GUIDE_TIMEOUT = 3000
  const [framingGuideMessage, setFramingGuideMessage] = useState('')
  const lastFaceDetectedTime = useRef(Date.now())

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

    // Log validation details in debug mode
    if (process.env.NODE_ENV === 'development') {
      console.debug('Tilt validation:', {
        avgAngle,
        dominantDirection,
        directionConfidence,
        currentDirection: currentTilt.tiltDirection,
        isStable: Math.abs(avgAngle) > TILT_ANGLE_THRESHOLD &&
          directionConfidence > TILT_DIRECTION_THRESHOLD &&
          currentTilt.tiltDirection === dominantDirection
      })
    }

    return (
      Math.abs(avgAngle) > TILT_ANGLE_THRESHOLD &&
      directionConfidence > TILT_DIRECTION_THRESHOLD &&
      currentTilt.tiltDirection === dominantDirection
    )
  }, [])

  // Get the current video element, preferring the injected one if available
  const getVideoElement = useCallback((): HTMLVideoElement | null => {
    return options?.videoElement || videoRef.current
  }, [options?.videoElement])

  // Get the current canvas element, preferring the injected one if available
  const getCanvasElement = useCallback((): HTMLCanvasElement | null => {
    return options?.canvasElement || canvasRef.current
  }, [options?.canvasElement])

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

  const calculateHeadTilt = useCallback((face: FaceMeshPrediction): HeadTiltMetrics => {
    const keypoints = face.keypoints
    const leftEye = keypoints[LANDMARKS.LEFT_EYE_OUTER]
    const rightEye = keypoints[LANDMARKS.RIGHT_EYE_OUTER]
    const noseBridge = keypoints[LANDMARKS.NOSE_BRIDGE]
    const chin = keypoints[LANDMARKS.CHIN]

    if (!leftEye || !rightEye || !noseBridge || !chin) {
      return {
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
      }
    }

    // Calculate vertical difference between eyes
    const eyeDeltaY = Math.abs(leftEye.y - rightEye.y)
    const faceHeight = Math.abs(noseBridge.y - chin.y)
    const tiltAngle = Math.atan2(eyeDeltaY, faceHeight) * (180 / Math.PI)
    
    // Determine tilt direction
    const tiltDirection = leftEye.y < rightEye.y ? 'left' : 'right'
    const isTilted = tiltAngle > HEAD_TILT_THRESHOLD

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
      leftEyeY: leftEye.y,
      rightEyeY: rightEye.y,
      noseBridgeY: noseBridge.y,
      chinY: chin.y,
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
      leftEyeY: leftEye.y,
      rightEyeY: rightEye.y,
      noseBridgeY: noseBridge.y,
      chinY: chin.y,
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

  const updateDetectionState = useCallback((metrics: DetectionMetrics, face: FaceMeshPrediction) => {
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
          console.debug('Proceeding with low confidence detection')
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
    console.error(`Detection error (${context}):`, error)
    setError(`Detection error: ${error.message}`)
    setErrorDetails(`Context: ${context}\nStack: ${error.stack || 'No stack trace'}`)
    setDetectionState('failed')
    setStatus('An error occurred during detection')
    clearDetectionInterval()
  }, [clearDetectionInterval])

  const validateFaceData = useCallback((face: FaceMeshPrediction): boolean => {
    try {
      if (!face || !face.keypoints) {
        console.debug('No face or keypoints found')
        return false
      }

      const keypoints = face.keypoints
      if (keypoints.length < 1) {
        console.debug('No face keypoints found')
        return false
      }

      // Check if we have all required landmarks
      const requiredLandmarks = [
        LANDMARKS.LEFT_EYE_OUTER,
        LANDMARKS.RIGHT_EYE_OUTER,
        LANDMARKS.NOSE_BRIDGE,
        LANDMARKS.CHIN
      ]

      for (const landmark of requiredLandmarks) {
        const keypoint = keypoints[landmark]
        if (!keypoint || typeof keypoint.x !== 'number' || typeof keypoint.y !== 'number') {
          console.debug('Invalid keypoint format:', keypoint)
          return false
        }
      }

      return true
    } catch (err) {
      console.error('Face validation error:', err)
      return false
    }
  }, [])

  // Draw dynamic overlays for face detection and framing guide
  const drawDebugOverlay = useCallback((face: FaceMeshPrediction | null) => {
    const canvas = getCanvasElement()
    const video = getVideoElement()
    if (!canvas || !video) {
      console.warn('drawDebugOverlay: canvas or video ref is null', { canvas, video })
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
    if (face.box) {
      ctx.strokeStyle = 'lime'
      ctx.lineWidth = 2
      ctx.strokeRect(face.box.xMin, face.box.yMin, face.box.width, face.box.height)
    }

    // Draw eyes and key landmarks
    ctx.fillStyle = 'cyan'
    const keypoints = face.keypoints
    const landmarkIndices = [
      LANDMARKS.LEFT_EYE_OUTER,
      LANDMARKS.RIGHT_EYE_OUTER,
      LANDMARKS.NOSE_BRIDGE,
      LANDMARKS.CHIN,
      LANDMARKS.LEFT_EYE_INNER,
      LANDMARKS.RIGHT_EYE_INNER,
      LANDMARKS.LEFT_EAR,
      LANDMARKS.RIGHT_EAR,
      LANDMARKS.FOREHEAD
    ]
    landmarkIndices.forEach(idx => {
      const pt = keypoints[idx]
      if (pt) {
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 4, 0, 2 * Math.PI)
        ctx.fill()
      }
    })
  }, [getCanvasElement, getVideoElement])

  // Detection loop using requestAnimationFrame
  const detectionLoopRef = useRef<number | null>(null)
  const runDetectionLoop = useCallback(async () => {
    const videoElement = getVideoElement()
    if (!videoElement || !modelRef.current || !videoElement.srcObject) {
      console.error('Video not ready or webcam feed unavailable')
      detectionLoopRef.current = requestAnimationFrame(runDetectionLoop)
      return
    }
    try {
      console.log('Running model prediction')
      const predictions = await modelRef.current.estimateFaces(videoElement)
      console.log('Predictions result:', predictions)
      if (!Array.isArray(predictions) || predictions.length === 0) {
        console.warn('No faces detected this frame')
        drawDebugOverlay(null)
      } else {
        drawDebugOverlay(predictions[0])
      }
    } catch (err) {
      console.error('Detection error in loop:', err)
    }
    detectionLoopRef.current = requestAnimationFrame(runDetectionLoop)
  }, [getVideoElement, drawDebugOverlay])

  // Start detection loop after model and video are ready
  useEffect(() => {
    if (isModelLoaded && isCameraActive) {
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
  }, [isModelLoaded, isCameraActive, runDetectionLoop])

  // Load TensorFlow and MediaPipe FaceMesh model
  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsModelLoading(true)
        setError(null)
        setErrorDetails('')
        // Use createDetector with tfjs runtime for MediaPipeFaceMesh
        const model = await faceLandmarksDetection.createDetector(
          faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
          {
            runtime: 'tfjs',
            refineLandmarks: true,
            maxFaces: 1
          }
        )
        modelRef.current = model
        setIsModelLoaded(true)
        setIsModelLoading(false)
        console.log('Model loaded successfully')
        console.log('Using model: MediaPipeFaceMesh')
      } catch (err) {
        console.error('Error loading face detection model:', err)
        setError('Failed to load face detection model. Please try refreshing the page.')
        setErrorDetails((err as Error).message)
        setIsModelLoading(false)
        setIsModelLoaded(false)
      }
    }
    loadModel()
    return () => handleCleanup()
  }, [])

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
      isModelLoading,
      isModelLoaded,
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
  }, [isModelLoading, isModelLoaded, startCamera])

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

  // Load BlazeFace model after video is ready
  const blazeModelRef = useRef<any>(null)
  useEffect(() => {
    async function loadBlazeFaceModel() {
      await tf.setBackend('webgl')
      await tf.ready()
      blazeModelRef.current = await blazeface.load()
      console.log('BlazeFace model loaded successfully')
    }
    loadBlazeFaceModel()
  }, [])

  // Helper: update status
  const updateStatus = useCallback((msg: string) => {
    setStatus(msg)
    // Optionally update a status element in the DOM
    const el = document.getElementById('status')
    if (el) el.innerText = msg
  }, [])

  // Helper: trigger success state
  const triggerSuccessState = useCallback(() => {
    setDetectionState('success')
    updateStatus('Human Verified')
    console.log('Human Verified — Proceeding to next step')
  }, [updateStatus])

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

  // BlazeFace detection loop
  const detectWithBlazeFace = useCallback(async () => {
    const videoElement = videoRef.current
    const canvasElement = canvasRef.current
    const model = blazeModelRef.current
    if (
      !model ||
      !videoElement ||
      !canvasElement ||
      videoElement.videoWidth === 0 ||
      videoElement.videoHeight === 0 ||
      canvasElement.width === 0 ||
      canvasElement.height === 0
    ) {
      requestAnimationFrame(detectWithBlazeFace)
      return
    }
    const predictions = await model.estimateFaces(videoElement)
    console.log('BlazeFace predictions:', predictions)
    const ctx = canvasElement.getContext('2d')
    if (!ctx) {
      requestAnimationFrame(detectWithBlazeFace)
      return
    }
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)
    if (predictions.length > 0) {
      const face = predictions[0] as any
      if (face.landmarks && face.topLeft && face.bottomRight) {
        const leftEye = face.landmarks[0]
        const rightEye = face.landmarks[1]
        // Draw box
        const [x, y] = face.topLeft
        const [x2, y2] = face.bottomRight
        ctx.strokeStyle = 'lime'
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, x2 - x, y2 - y)
        // Calculate head tilt
        const tiltAngle = Math.atan2(
          rightEye[1] - leftEye[1],
          rightEye[0] - leftEye[0]
        ) * (180 / Math.PI)
        console.log('Head Tilt Angle:', tiltAngle)
        if (Math.abs(tiltAngle) > 15) {
          console.log('Head tilt detected — verification complete')
          updateStatus('Human Verified')
          triggerSuccessState()
        } else {
          updateStatus('Face detected. Please tilt your head slightly.')
        }
      }
    } else {
      updateStatus('Looking for your face...')
      console.warn('No faces detected this frame')
    }
    requestAnimationFrame(detectWithBlazeFace)
  }, [updateStatus, triggerSuccessState])

  // Start detection loop after model and video are ready
  useEffect(() => {
    if (modelRef.current && videoRef.current && canvasRef.current) {
      detectWithBlazeFace()
    }
  }, [modelRef.current, detectWithBlazeFace])

  return {
    // State
    detectionState,
    isCameraActive,
    isModelLoaded,
    isModelLoading,
    error,
    errorDetails,
    status,
    timeRemaining,
    countdownMessage,
    facePosition,
    eyesDetected,
    positioningMessage,

    // Refs - only return refs if no elements were injected
    videoRef: options?.videoElement ? { current: options.videoElement } : videoRef,
    canvasRef: options?.canvasElement ? { current: options.canvasElement } : canvasRef,

    // Actions
    handleStartCamera,
    handleCleanup,
    clearDetectionInterval
  }
} 