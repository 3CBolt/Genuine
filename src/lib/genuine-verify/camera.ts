import { CameraState, DetectionState, FaceDetectionModel } from './types'

// Camera setup, permissions, and cleanup logic will be implemented here.
// Functions: startCamera, handleResetPermissions, cleanup, etc.

/**
 * Cleans up camera and detection intervals.
 */
export function cleanup({
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
}: any) {
  if (detectionIntervalRef.current) {
    clearInterval(detectionIntervalRef.current)
    detectionIntervalRef.current = null
  }
  if (videoRef.current?.srcObject) {
    const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
    tracks.forEach(track => {
      try { track.stop() } catch {}
    })
    videoRef.current.srcObject = null
  }
  setIsCameraActive(false)
  setError(null)
  setErrorDetails('')
  setStatus('Click to start verification')
  setDetectionState('idle')
  stableDetectionFrames.current = 0
  missedFrames.current = 0
  lastStableDetectionTime.current = 0
  detectionStartTime.current = 0
  setTimeRemaining(0)
  setCountdownMessage('')
  setFacePosition(null)
  setEyesDetected(false)
  setPositioningMessage('')
}

/**
 * Starts the camera and handles permissions.
 */
export async function startCamera({
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
  detectBlink,
  setFacePosition,
  setEyesDetected
}: any) {
  if (isModelLoading) throw new Error('Face detection model is still loading. Please wait...')
  if (!isModelLoaded || !modelRef.current) throw new Error('Face detection model failed to load. Please refresh the page.')
  setStatus('Requesting camera access...')
  let permissionStatus: PermissionStatus
  try {
    permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName })
    if (permissionStatus.state === 'denied') {
      const browserName = navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : navigator.userAgent.includes('Safari') ? 'Safari' : 'your browser'
      const instructions = browserName === 'Chrome' ? '1. Click the camera icon 🎥 in the address bar\n2. Select "Allow"\n3. Refresh this page' : browserName === 'Firefox' ? '1. Click the camera icon 🎥 in the address bar\n2. Click "Remove Block"\n3. Refresh this page' : browserName === 'Safari' ? '1. Open Safari Preferences\n2. Go to Websites > Camera\n3. Find this website and select "Allow"\n4. Refresh this page' : '1. Check your browser settings\n2. Allow camera access for this website\n3. Refresh this page'
      throw new Error(`Camera access is blocked. Here's how to enable it in ${browserName}:\n\n${instructions}\n\nIf you don't see these options, try:\n1. Clear your browser settings for this site\n2. Refresh the page\n3. Try again with "Allow" when prompted`)
    }
  } catch (err) {
    if ((err as Error).name !== 'TypeError') throw err
  }
  if (videoRef.current?.srcObject) {
    const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
    tracks.forEach(track => track.stop())
    videoRef.current.srcObject = null
  }
  try {
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
    // Wait for video element to be available
    let attempts = 0
    const maxAttempts = 10
    while (!videoRef.current && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }
    
    if (!videoRef.current) {
      throw new Error('Video element not found after multiple attempts. Please ensure the video element is properly rendered.')
    }
    
    videoRef.current.srcObject = stream
    try {
      await videoRef.current.play()
    } catch (err) {
      // Handle video play error silently in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to play video:', err)
      }
    }
    const frameRate = (stream.getVideoTracks()[0].getSettings().frameRate || 15)
    const intervalMs = Math.max(Math.floor(1000 / frameRate), 66)
    setIsCameraActive(true)
    setError(null)
    setErrorDetails('')
    setDetectionState('camera-active')
    setStatus('Looking for your eyes...')
    detectionStartTime.current = Date.now()
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current)
    detectionIntervalRef.current = setInterval(detectBlink, intervalMs)
    setDetectionState('eyes-detected')
  } catch (err) {
    const error = err as Error
    setError(error.message)
    setErrorDetails(error.name)
    setStatus('Camera access failed')
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
    throw err
  }
}

/**
 * Handles resetting camera permissions.
 */
export async function handleResetPermissions({ videoRef, cleanup, setError }: any) {
  if (videoRef.current?.srcObject) {
    const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
    tracks.forEach(track => track.stop())
    videoRef.current.srcObject = null
  }
  cleanup()
  const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName })
  if (permissions.state === 'denied') {
    setError('Camera access is blocked. Please follow these steps:\n\n1. Click the camera icon in your browser\'s address bar\n2. Select "Always allow" for this site\n3. Refresh the page\n\nIf you don\'t see the camera icon:\n1. Open browser Settings\n2. Go to Privacy & Security > Site Settings > Camera\n3. Find this site and allow access\n4. Return here and refresh the page')
    return
  }
  try {
    const tempStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: 'user' }, width: { exact: 640 }, height: { exact: 480 } }
    })
    tempStream.getTracks().forEach(track => track.stop())
  } catch (err) {
    const basicStream = await navigator.mediaDevices.getUserMedia({ video: true })
    basicStream.getTracks().forEach(track => track.stop())
  }
  setTimeout(() => { window.location.reload() }, 500)
} 