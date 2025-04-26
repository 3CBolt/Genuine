'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import * as tf from '@tensorflow/tfjs'
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'
import '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'

type DetectionState = 
  | 'idle'
  | 'camera-active'
  | 'eyes-detected'
  | 'blinking'
  | 'success'
  | 'failed'
  | 'recovering'

interface FacePosition {
  x: number
  y: number
  width: number
  height: number
}

interface DetectionMetrics {
  timestamp: number
  eyeConfidence: number
  leftEye: [number, number]
  rightEye: [number, number]
  facePosition: FacePosition
  eyesDetected: boolean
}

interface EyeState {
  left: number
  right: number
}

type FaceMeshModel = faceLandmarksDetection.FaceLandmarksDetector;
type FaceMeshPrediction = Awaited<ReturnType<FaceMeshModel['estimateFaces']>>[0];

export const GenuineWidget: React.FC = () => {
  // Core state
  const [detectionState, setDetectionState] = useState<DetectionState>('idle')
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string>('')
  
  // Detection state
  const [status, setStatus] = useState<string>('Click to start verification')
  const [blinkCount, setBlinkCount] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [countdownMessage, setCountdownMessage] = useState('')

  // Detection stability tracking
  const stableDetectionFrames = useRef<number>(0)
  const missedFrames = useRef<number>(0)
  const lastStableDetectionTime = useRef<number>(0)
  const detectionStartTime = useRef<number>(0)

  // Constants
  const REQUIRED_STABLE_FRAMES = 5
  const MAX_MISSED_FRAMES = 3
  const DETECTION_TIMEOUT = 5000
  const BLINK_THRESHOLD = 0.1
  const MIN_EYE_CONFIDENCE = 0.2
  const ALLOW_LOW_CONFIDENCE = true

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const modelRef = useRef<FaceMeshModel | null>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastEyeState = useRef<EyeState | null>(null)
  const lastBlinkTime = useRef<number>(0)

  // Add UI state
  const [facePosition, setFacePosition] = useState<FacePosition | null>(null)
  const [eyesDetected, setEyesDetected] = useState(false)
  const [positioningMessage, setPositioningMessage] = useState('')

  // Detection buffer for stable tracking
  const detectionBuffer = useRef<DetectionMetrics[]>([])
  const BUFFER_SIZE = 10 // Track last 10 frames

  // Debug configuration
  const DEBUG = true
  const DEBUG_COLORS = {
    leftEye: 'rgba(0, 255, 0, 0.8)',  // Green
    rightEye: 'rgba(0, 128, 255, 0.8)', // Blue
    face: 'rgba(255, 255, 255, 0.3)',  // White (faded)
    text: 'rgba(255, 255, 255, 0.8)'   // White (text)
  }

  // Simulation timers
  const fakeDetectionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const fakeVerificationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Load TensorFlow and MediaPipe FaceMesh model
  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('Initializing TensorFlow...')
        await tf.ready()
        console.log('Loading MediaPipe FaceMesh model...')
        const model = await faceLandmarksDetection.createDetector(
          faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
          {
            runtime: 'tfjs',
            refineLandmarks: true,
            maxFaces: 1
          }
        )
        console.log('MediaPipe FaceMesh model loaded successfully')
        modelRef.current = model
        setIsModelLoaded(true)
      } catch (err) {
        console.error('Error loading face detection model:', err)
        setError('Failed to load face detection model')
      }
    }
    loadModel()

    return () => cleanup()
  }, [])

  const cleanup = useCallback(() => {
    console.log('Cleanup triggered. Reason:', error || 'manual cleanup')
    
    // Clear all timers
    if (fakeDetectionTimerRef.current) {
      clearTimeout(fakeDetectionTimerRef.current)
      fakeDetectionTimerRef.current = null
    }
    if (fakeVerificationTimerRef.current) {
      clearTimeout(fakeVerificationTimerRef.current)
      fakeVerificationTimerRef.current = null
    }
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    
    if (videoRef.current?.srcObject) {
      console.log('Stopping camera tracks')
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => {
        try {
          console.log('Stopping track:', track.kind, track.label)
          track.stop()
        } catch (err) {
          console.error('Error stopping track:', err)
        }
      })
      videoRef.current.srcObject = null
    }

    // Reset all state
    setIsCameraActive(false)
    setError(null)
    setErrorDetails('')
    setStatus('Click to start verification')
    stableDetectionFrames.current = 0
    missedFrames.current = 0
    lastStableDetectionTime.current = 0
    detectionStartTime.current = 0
    setBlinkCount(0)
    setTimeRemaining(0)
    setCountdownMessage('')
    setFacePosition(null)
    setEyesDetected(false)
    setPositioningMessage('')
  }, [error])

  // Only cleanup on error, not on every state change
  useEffect(() => {
    if (error && !isCameraActive) {
      console.log('Error detected, triggering cleanup:', error)
      cleanup()
    }
  }, [error, cleanup, isCameraActive])

  // Improved eye validation
  const validateEyeData = useCallback((face: FaceMeshPrediction): boolean => {
    try {
      if (!face || !face.keypoints) {
        console.debug('No face or keypoints found')
        return false
      }

      const keypoints = face.keypoints
      console.debug('Face keypoints:', {
        count: keypoints.length,
        coordinates: keypoints,
        state: detectionState
      })

      // Allow detection with just one confident eye
      if (keypoints.length < 1) {
        console.debug('No eye keypoints found')
        return false
      }

      // Basic coordinate validation
      for (const keypoint of keypoints) {
        if (!keypoint || typeof keypoint.x !== 'number' || typeof keypoint.y !== 'number') {
          console.debug('Invalid keypoint format:', keypoint)
          return false
        }
      }

      // If we have at least one valid eye, consider it good enough
      return true

    } catch (err) {
      console.error('Eye validation error:', err)
      return false
    }
  }, [detectionState])

  // Safe timer clearing
  const clearDetectionInterval = useCallback(() => {
    const interval = detectionIntervalRef.current
    if (interval) {
      clearInterval(interval)
      detectionIntervalRef.current = null
    }
  }, [])

  const clearRecoveryTimeout = useCallback(() => {
    const timeout = recoveryTimeoutRef.current
    if (timeout) {
      clearTimeout(timeout)
      recoveryTimeoutRef.current = null
    }
  }, [])

  // Update verification timer handling
  const startVerification = useCallback(() => {
    console.log('Starting verification task')
    setDetectionState('blinking')
    setBlinkCount(0)
    setTimeRemaining(5)
    setCountdownMessage('Blink verification starting...')

    const startTime = Date.now()
    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const remaining = Math.max(0, 5 - elapsed)
      setTimeRemaining(remaining)

      if (remaining === 0) {
        // Simulate 80% success rate
        const isSuccess = Math.random() < 0.8
        if (isSuccess) {
          setDetectionState('success')
          setStatus('Verification successful!')
        } else {
          setDetectionState('failed')
          setStatus('Verification failed. Click Try Again.')
        }
        setCountdownMessage('')
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current)
          countdownTimerRef.current = null
        }
      }
    }

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
    }
    countdownTimerRef.current = setInterval(updateTimer, 100)
  }, [])

  // Debug drawing functions
  const drawDebugOverlay = useCallback((
    ctx: CanvasRenderingContext2D,
    metrics: DetectionMetrics,
    face: FaceMeshPrediction
  ) => {
    if (!DEBUG) return

    // Clear previous drawing
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // Draw face bounding box
    if (face.box) {
      ctx.strokeStyle = DEBUG_COLORS.face
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(
        face.box.xMin,
        face.box.yMin,
        face.box.width,
        face.box.height
      )
      ctx.setLineDash([])
    }

    // Helper function to draw eye landmark
    const drawEyeLandmark = (
      x: number,
      y: number,
      label: string,
      color: string
    ) => {
      if (x === 0 && y === 0) return // Skip invalid landmarks

      // Draw circle
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()

      // Draw label
      ctx.font = '12px monospace'
      ctx.fillStyle = DEBUG_COLORS.text
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText(label, x, y - 8)

      // Draw confidence if available
      if (metrics.eyeConfidence > 0) {
        ctx.font = '10px monospace'
        ctx.fillText(
          `${(metrics.eyeConfidence * 100).toFixed(0)}%`,
          x,
          y + 15
        )
      }
    }

    // Draw eye landmarks
    drawEyeLandmark(
      metrics.leftEye[0],
      metrics.leftEye[1],
      'L',
      DEBUG_COLORS.leftEye
    )
    drawEyeLandmark(
      metrics.rightEye[0],
      metrics.rightEye[1],
      'R',
      DEBUG_COLORS.rightEye
    )

  }, [])

  // Update detection state with debug visualization
  const updateDetectionState = useCallback((
    metrics: DetectionMetrics, 
    face: FaceMeshPrediction
  ) => {
    // Existing detection logic
    detectionBuffer.current = [
      ...detectionBuffer.current.slice(-(BUFFER_SIZE - 1)),
      metrics
    ]

    // Check for stable detection with relaxed criteria
    const recentFrames = detectionBuffer.current.slice(-REQUIRED_STABLE_FRAMES)
    const validFrames = recentFrames.filter(frame => {
      const hasValidEyes = frame.leftEye[1] > 0 || frame.rightEye[1] > 0 // Allow single eye
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
        startVerification()
      }
    } else {
      missedFrames.current++
      if (missedFrames.current > MAX_MISSED_FRAMES && detectionState !== 'blinking') {
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

    // Debug visualization
    if (DEBUG && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        drawDebugOverlay(ctx, metrics, face)
      }
    }
  }, [detectionState, clearDetectionInterval, startVerification, drawDebugOverlay])

  // Update error handling
  const handleDetectionError = useCallback((error: Error, context: string) => {
    console.error(`Detection error (${context}):`, error)
    setError(`Detection error: ${error.message}`)
    setErrorDetails(error.message)
    setStatus('Failed to detect face')
    setDetectionState('failed')
    clearDetectionInterval()
  }, [clearDetectionInterval])

  const detectBlink = useCallback(async () => {
    if (!videoRef.current || !modelRef.current || !videoRef.current.srcObject) {
      return
    }

    try {
      const predictions = await modelRef.current.estimateFaces(videoRef.current)
      
      if (!Array.isArray(predictions) || predictions.length === 0) {
        missedFrames.current++
        if (missedFrames.current > MAX_MISSED_FRAMES && detectionState !== 'blinking') {
          setDetectionState('failed')
          setStatus('Looking for your eyes...')
        }
        return
      }

      const face = predictions[0]
      console.debug('Face detection:', {
        keypoints: face.keypoints,
        box: face.box,
        state: detectionState
      })

      if (!validateEyeData(face)) {
        return
      }

      // MediaPipe FaceMesh eye landmarks
      // Left eye
      const leftEyeUpper1 = face.keypoints[159] // Upper 1
      const leftEyeUpper2 = face.keypoints[160] // Upper 2
      const leftEyeLower1 = face.keypoints[144] // Lower 1
      const leftEyeLower2 = face.keypoints[145] // Lower 2

      // Right eye
      const rightEyeUpper1 = face.keypoints[386] // Upper 1
      const rightEyeUpper2 = face.keypoints[387] // Upper 2
      const rightEyeLower1 = face.keypoints[373] // Lower 1
      const rightEyeLower2 = face.keypoints[374] // Lower 2

      if (!leftEyeUpper1 || !leftEyeUpper2 || !leftEyeLower1 || !leftEyeLower2 ||
          !rightEyeUpper1 || !rightEyeUpper2 || !rightEyeLower1 || !rightEyeLower2) {
        return
      }

      // Calculate eye openness using average vertical distance between upper and lower landmarks
      const leftEyeOpenness = (
        Math.abs(leftEyeUpper1.y - leftEyeLower1.y) +
        Math.abs(leftEyeUpper2.y - leftEyeLower2.y)
      ) / 2

      const rightEyeOpenness = (
        Math.abs(rightEyeUpper1.y - rightEyeLower1.y) +
        Math.abs(rightEyeUpper2.y - rightEyeLower2.y)
      ) / 2

      // Calculate eye center points for visualization
      const leftEyeCenter = {
        x: (leftEyeUpper1.x + leftEyeUpper2.x + leftEyeLower1.x + leftEyeLower2.x) / 4,
        y: (leftEyeUpper1.y + leftEyeUpper2.y + leftEyeLower1.y + leftEyeLower2.y) / 4
      }

      const rightEyeCenter = {
        x: (rightEyeUpper1.x + rightEyeUpper2.x + rightEyeLower1.x + rightEyeLower2.x) / 4,
        y: (rightEyeUpper1.y + rightEyeUpper2.y + rightEyeLower1.y + rightEyeLower2.y) / 4
      }

      // Update metrics with more accurate eye positions
      const metrics: DetectionMetrics = {
        timestamp: Date.now(),
        eyeConfidence: face.box ? 1.0 : 0.5,
        leftEye: [leftEyeCenter.x, leftEyeCenter.y],
        rightEye: [rightEyeCenter.x, rightEyeCenter.y],
        eyesDetected: true,
        facePosition: face.box ? {
          x: face.box.xMin,
          y: face.box.yMin,
          width: face.box.width,
          height: face.box.height
        } : { x: 0, y: 0, width: 0, height: 0 }
      }

      updateDetectionState(metrics, face)

      // Process blinks with improved accuracy
      if (detectionState === 'blinking') {
        const currentEyeState = {
          left: leftEyeOpenness,
          right: rightEyeOpenness
        }

        if (lastEyeState.current) {
          const leftDiff = Math.abs(currentEyeState.left - lastEyeState.current.left)
          const rightDiff = Math.abs(currentEyeState.right - lastEyeState.current.right)
          const now = Date.now()
          
          // Detect blink when either eye closes significantly
          const isBlinking = (leftDiff > BLINK_THRESHOLD && currentEyeState.left < lastEyeState.current.left) ||
                           (rightDiff > BLINK_THRESHOLD && currentEyeState.right < lastEyeState.current.right)
          
          if (isBlinking && now - lastBlinkTime.current > 500) {
            console.debug('Blink detected:', { 
              leftDiff, 
              rightDiff,
              leftEyeOpenness: currentEyeState.left,
              rightEyeOpenness: currentEyeState.right
            })
            lastBlinkTime.current = now
            setBlinkCount(prev => prev + 1)
          }
        }

        lastEyeState.current = currentEyeState
      }

      // Check for timeout during detection
      if (detectionState === 'eyes-detected' && 
          Date.now() - detectionStartTime.current > DETECTION_TIMEOUT) {
        setDetectionState('failed')
        setStatus('Still not seeing your eyes clearly - adjust lighting or camera')
      }

    } catch (err) {
      handleDetectionError(err as Error, 'frame-processing')
    }
  }, [detectionState, validateEyeData, updateDetectionState, handleDetectionError])

  const startCamera = useCallback(async () => {
    console.log('Starting camera initialization...')
    try {
      if (!isModelLoaded) {
        throw new Error('Face detection model not ready')
      }

      setStatus('Requesting camera access...')
      
      const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName })
      if (permissions.state === 'denied') {
        throw new Error('Camera permission denied. Please enable camera access and refresh.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          facingMode: 'user',
          width: { min: 320, ideal: 640, max: 1280 },
          height: { min: 240, ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 20 },
          aspectRatio: { ideal: 1.333333 }
        },
        audio: false 
      })

      if (!videoRef.current) {
        throw new Error('Video element not found')
      }

      videoRef.current.srcObject = stream
      await videoRef.current.play()
      
      const frameRate = (stream.getVideoTracks()[0].getSettings().frameRate || 15)
      const intervalMs = Math.max(Math.floor(1000 / frameRate), 66)

      setIsCameraActive(true)
      setError(null)
      setErrorDetails('')
      setDetectionState('camera-active')
      setStatus('Looking for your eyes...')
      detectionStartTime.current = Date.now()
      
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }

      // Simulate eye detection after 1.5s
      fakeDetectionTimerRef.current = setTimeout(() => {
        setDetectionState('eyes-detected')
        setEyesDetected(true)
        setStatus('Eyes detected')
        setPositioningMessage('')
        
        // Simulate verification ready after another 1.5s
        fakeVerificationTimerRef.current = setTimeout(() => {
          startVerification()
        }, 1500)
      }, 1500)

    } catch (err) {
      const error = err as Error
      console.error('Camera setup error:', error)
      setError(`Camera setup failed: ${error.message}`)
      setErrorDetails(error.message)
      setStatus('Failed to start camera')
      
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach(track => track.stop())
        videoRef.current.srcObject = null
      }
      setIsCameraActive(false)
    }
  }, [isModelLoaded, startVerification])

  // Update action handling
  const handleActionClick = useCallback(() => {
    if (!isCameraActive) {
      startCamera()
    } else if (['failed', 'success'].includes(detectionState)) {
      setDetectionState('eyes-detected')
      setStatus('Looking for your eyes...')
      startVerification()
    }
  }, [isCameraActive, detectionState, startCamera, startVerification])

  const drawGuidanceOverlay = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear previous drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Only show guidance during detection phases
    if (!['idle', 'eyes-detected'].includes(detectionState)) {
      return
    }

    // Draw ideal face position guide with reduced emphasis
    const idealWidth = canvas.width * 0.4
    const idealHeight = canvas.height * 0.6
    const idealX = (canvas.width - idealWidth) / 2
    const idealY = (canvas.height - idealHeight) / 2

    // Make guide very subtle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.ellipse(
      idealX + idealWidth / 2,
      idealY + idealHeight / 2,
      idealWidth / 2,
      idealHeight / 2,
      0,
      0,
      2 * Math.PI
    )
    ctx.stroke()

    // Draw detected face position if available
    if (facePosition) {
      // Use color to indicate eye detection status
      ctx.strokeStyle = eyesDetected 
        ? 'rgba(59, 130, 246, 0.8)' // Blue when eyes detected
        : 'rgba(255, 255, 255, 0.5)' // White when only face detected
      ctx.lineWidth = 2
      ctx.setLineDash([])
      ctx.strokeRect(
        facePosition.x,
        facePosition.y,
        facePosition.width,
        facePosition.height
      )
    }
  }, [detectionState, facePosition, eyesDetected])

  useEffect(() => {
    if (canvasRef.current && videoRef.current) {
      canvasRef.current.width = videoRef.current.clientWidth
      canvasRef.current.height = videoRef.current.clientHeight
      drawGuidanceOverlay()
    }
  }, [drawGuidanceOverlay])

  useEffect(() => {
    if (detectionState === 'idle') {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current)
      }
      setTimeRemaining(0)
    }
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current)
      }
    }
  }, [detectionState])

  // Cleanup effect
  useEffect(() => {
    return () => {
      clearDetectionInterval()
      clearRecoveryTimeout()
    }
  }, [clearDetectionInterval, clearRecoveryTimeout])

  // Update canvas size on mount and resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current && videoRef.current) {
        canvasRef.current.width = videoRef.current.clientWidth
        canvasRef.current.height = videoRef.current.clientHeight
      }
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)

    return () => {
      window.removeEventListener('resize', updateCanvasSize)
    }
  }, [])

  return (
    <div className="w-full max-w-md mx-auto overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <span className="text-2xl">👁️</span>
              Genuine Verify
            </h2>
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
              Demo
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-gray-500 text-lg">
              A fast, privacy-first human verification widget
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
              <p>
                <span className="font-medium">Demo Mode:</span> This is a simulated preview showcasing the intended user experience and verification flow. The actual product will use real-time face detection.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Primary Action Button */}
          {!['success', 'failed'].includes(detectionState) && (
            <button 
              className={`
                w-full py-3 px-4 text-lg font-medium rounded-xl transition-all duration-200
                ${(!isCameraActive || detectionState === 'blinking')
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow active:bg-blue-800' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
              `}
              type="button"
              onClick={handleActionClick}
              disabled={isCameraActive && !['failed', 'success'].includes(detectionState)}
            >
              {!isCameraActive 
                ? 'Start Demo Verification'
                : detectionState === 'blinking'
                  ? 'Verification in Progress'
                  : 'Verification in Progress'
              }
            </button>
          )}

          {/* Success/Failure State with Try Again */}
          {['success', 'failed'].includes(detectionState) && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg text-center space-y-3 ${
                detectionState === 'success' 
                  ? 'bg-green-50 border border-green-100'
                  : 'bg-red-50 border border-red-100'
              }`}>
                <div className={`text-2xl ${
                  detectionState === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {detectionState === 'success' ? '✓' : '✕'}
                </div>
                <p className={`font-medium ${
                  detectionState === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {detectionState === 'success' 
                    ? 'Demo Verification Successful!'
                    : 'Demo Verification Failed'
                  }
                </p>
              </div>
              
              <button 
                className="w-full py-3 px-4 text-lg font-medium rounded-xl transition-all duration-200
                  bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-sm hover:shadow active:bg-gray-300"
                type="button"
                onClick={handleActionClick}
              >
                Try Demo Again
              </button>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg space-y-2">
              <p className="text-sm text-red-600 font-medium">
                {error}
              </p>
              {errorDetails && (
                <p className="text-xs text-red-500">
                  {errorDetails}
                </p>
              )}
              {!isCameraActive && (
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs text-red-600 hover:text-red-700 font-medium underline"
                >
                  Refresh page to try again
                </button>
              )}
            </div>
          )}
          
          <div className={`
            relative aspect-video w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50
            ${!isCameraActive && 'hidden'}
            ${detectionState === 'recovering' && 'opacity-75'}
          `}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            <canvas
              ref={canvasRef}
              className="absolute inset-0 pointer-events-none"
            />

            {/* Recovery overlay */}
            {detectionState === 'recovering' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="bg-black/50 text-white text-sm px-4 py-2 rounded-full animate-pulse">
                  Recovering detection...
                </div>
              </div>
            )}

            {/* Positioning message */}
            {positioningMessage && ['idle', 'eyes-detected'].includes(detectionState) && (
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                <div className="bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                  {positioningMessage}
                </div>
              </div>
            )}

            {/* Detection state indicator */}
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

            {/* Timer overlay */}
            {timeRemaining > 0 && (
              <div className="absolute inset-x-0 top-2 flex flex-col items-center gap-1">
                <div className="bg-black/50 text-white text-lg font-mono px-4 py-1 rounded-full">
                  {timeRemaining}s
                </div>
                {countdownMessage && (
                  <div className="bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                    {countdownMessage}
                  </div>
                )}
              </div>
            )}

            {/* Simulation notice */}
            <div className="absolute top-2 right-2 bg-blue-600/90 text-white text-xs px-3 py-1.5 rounded-full font-medium">
              Demo Preview
            </div>
          </div>
        </div>

        {/* Status Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              detectionState === 'failed'
                ? 'bg-red-500'
                : detectionState === 'success'
                  ? 'bg-green-500'
                  : 'bg-gray-400'
            }`} />
            <span className="font-mono text-sm text-gray-600">
              Demo Status:
            </span>
          </div>
          <span className="font-mono text-sm text-gray-900">
            {status}
          </span>
        </div>
      </div>
    </div>
  )
} 