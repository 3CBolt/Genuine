/**
 * @jest-environment jsdom
 */
// Mock TensorFlow and MediaPipe at the very top
jest.mock('@tensorflow/tfjs', () => ({
  ready: jest.fn().mockResolvedValue(undefined),
  setBackend: jest.fn().mockResolvedValue(undefined)
}))
jest.mock('@tensorflow-models/face-landmarks-detection', () => ({
  createDetector: jest.fn().mockImplementation(() => Promise.resolve({
    estimateFaces: jest.fn()
  })),
  SupportedModels: { MediaPipeFaceMesh: 'MediaPipeFaceMesh' }
}))
// Mock camera utilities (fix path)
jest.mock('../../camera', () => ({
  startCamera: jest.fn().mockImplementation(async ({ setIsCameraActive }) => {
    // Simulate camera activation
    await act(async () => {
      if (typeof setIsCameraActive === 'function') setIsCameraActive(true)
    })
    return Promise.resolve()
  }),
  cleanup: jest.fn()
}))
// Mock setInterval globally to always provide a dummy function
beforeAll(() => {
  jest.spyOn(global, 'setInterval').mockImplementation((cb, ms) => {
    if (typeof cb === 'function') {
      cb()
    }
    return { __dummy: true } as unknown as ReturnType<typeof setInterval>
  })
})
afterAll(() => {
  jest.restoreAllMocks()
})

import { renderHook, act, waitFor } from '@testing-library/react'
import * as React from 'react'
import * as tf from '@tensorflow/tfjs'
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'
import { useGenuineDetection } from '../useGenuineDetection'
import { DetectionState } from '../../types'

// Mock MediaStream
class MockMediaStream implements MediaStream {
  active: boolean = true
  id: string = 'mock-stream'
  onaddtrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => any) | null = null
  onremovetrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => any) | null = null
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {}
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {}
  dispatchEvent(event: Event): boolean { return true }
  getAudioTracks(): MediaStreamTrack[] { return [] }
  getVideoTracks(): MediaStreamTrack[] { return [new MockMediaStreamTrack()] }
  getTracks(): MediaStreamTrack[] { return [new MockMediaStreamTrack()] }
  getTrackById(trackId: string): MediaStreamTrack | null { return new MockMediaStreamTrack() }
  addTrack(track: MediaStreamTrack): void {}
  removeTrack(track: MediaStreamTrack): void {}
  clone(): MediaStream { return new MockMediaStream() }
}

// Mock MediaStreamTrack
class MockMediaStreamTrack implements MediaStreamTrack {
  enabled: boolean = true
  id: string = 'mock-track'
  kind: string = 'video'
  label: string = 'mock-camera'
  muted: boolean = false
  onended: ((this: MediaStreamTrack, ev: Event) => any) | null = null
  onmute: ((this: MediaStreamTrack, ev: Event) => any) | null = null
  onunmute: ((this: MediaStreamTrack, ev: Event) => any) | null = null
  readyState: MediaStreamTrackState = 'live'
  contentHint: string = ''
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {}
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {}
  dispatchEvent(event: Event): boolean { return true }
  applyConstraints(constraints: MediaTrackConstraints): Promise<void> { return Promise.resolve() }
  clone(): MediaStreamTrack { return new MockMediaStreamTrack() }
  getCapabilities(): MediaTrackCapabilities { return {} }
  getConstraints(): MediaTrackConstraints { return {} }
  getSettings(): MediaTrackSettings { return { width: 640, height: 480, frameRate: 30 } }
  stop(): void {}
}

// Mock DOM elements
const createMockVideoElement = () => {
  const video = document.createElement('video')
  video.play = jest.fn().mockResolvedValue(undefined)
  video.srcObject = null
  video.addEventListener = jest.fn()
  video.removeEventListener = jest.fn()
  video.requestVideoFrameCallback = jest.fn()
  video.cancelVideoFrameCallback = jest.fn()
  video.getBoundingClientRect = jest.fn().mockReturnValue({ width: 640, height: 480 })
  Object.defineProperty(video, 'videoWidth', { get: () => 640 })
  Object.defineProperty(video, 'videoHeight', { get: () => 480 })
  return video
}

const createMockCanvasElement = () => {
  const canvas = document.createElement('canvas')
  canvas.getContext = jest.fn().mockReturnValue({
    drawImage: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn().mockReturnValue({ data: new Uint8Array(640 * 480 * 4) })
  })
  return canvas
}

describe('useGenuineDetection', () => {
  let mockVideoElement: HTMLVideoElement
  let mockCanvasElement: HTMLCanvasElement
  let mockModel: { estimateFaces: jest.Mock }

  beforeEach(() => {
    jest.clearAllMocks()

    // Initialize mock elements
    mockVideoElement = createMockVideoElement()
    mockCanvasElement = createMockCanvasElement()

    // Initialize mockModel
    mockModel = {
      estimateFaces: jest.fn()
    }

    // Setup MediaPipe mock
    const faceLandmarksDetection = jest.requireMock('@tensorflow-models/face-landmarks-detection')
    faceLandmarksDetection.createDetector.mockImplementation(() => Promise.resolve(mockModel))

    // Mock MediaStream
    global.MediaStream = MockMediaStream as any
    global.MediaStreamTrack = MockMediaStreamTrack as any

    // Mock navigator.mediaDevices
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockResolvedValue(new MockMediaStream())
      },
      writable: true
    })

    // Mock TensorFlow initialization
    ;(tf.ready as jest.Mock).mockResolvedValue(undefined)
    ;(tf.setBackend as jest.Mock).mockResolvedValue(undefined)

    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useGenuineDetection({
      videoElement: mockVideoElement,
      canvasElement: mockCanvasElement
    }))

    expect(result.current.detectionState).toBe('idle')
    expect(result.current.isCameraActive).toBe(false)
    expect(result.current.isModelLoaded).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.status).toBe('Click to start verification')
  })

  it('should load model successfully', async () => {
    const { result } = renderHook(() => useGenuineDetection({
      videoElement: mockVideoElement,
      canvasElement: mockCanvasElement
    }))

    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(result.current.isModelLoaded).toBe(true)
      expect(result.current.isModelLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  it('should handle model loading error', async () => {
    const faceLandmarksDetection = jest.requireMock('@tensorflow-models/face-landmarks-detection')
    faceLandmarksDetection.createDetector.mockRejectedValueOnce(new Error('Model loading failed'))
    const { result } = renderHook(() => useGenuineDetection({
      videoElement: mockVideoElement,
      canvasElement: mockCanvasElement
    }))
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })
    await waitFor(() => {
      expect(result.current.isModelLoaded).toBe(false)
      expect(result.current.isModelLoading).toBe(false)
      expect(result.current.error).toBeTruthy()
      expect(result.current.errorDetails).toContain('Model loading failed')
    })
  })

  it('should start camera and detect face', async () => {
    mockModel.estimateFaces.mockResolvedValue([{
      keypoints: {
        33: { x: 100, y: 150 }, // Left eye
        263: { x: 200, y: 150 }, // Right eye
        168: { x: 150, y: 200 }, // Nose bridge
        152: { x: 150, y: 300 }  // Chin
      },
      box: { xMin: 50, yMin: 50, width: 200, height: 300 }
    }])

    const { result } = renderHook(() => useGenuineDetection({
      videoElement: mockVideoElement,
      canvasElement: mockCanvasElement
    }))

    // Wait for model to load
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(result.current.isModelLoaded).toBe(true)
    })

    // Start camera
    await act(async () => {
      await result.current.handleStartCamera()
    })
    // Simulate repeated detection interval for stable frames
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await result.current.detectHeadTilt?.()
      })
    }

    await waitFor(() => {
      expect(result.current.isCameraActive).toBe(true)
      expect(result.current.detectionState).toBe('eyes-detected')
      expect(result.current.eyesDetected).toBe(true)
    })
  })

  it('should detect head tilt and transition states', async () => {
    // First, eyes detected
    mockModel.estimateFaces.mockResolvedValue([{
      keypoints: {
        33: { x: 100, y: 150 }, // Left eye
        263: { x: 200, y: 150 }, // Right eye
        168: { x: 150, y: 200 }, // Nose bridge
        152: { x: 150, y: 300 }  // Chin
      },
      box: { xMin: 50, yMin: 50, width: 200, height: 300 }
    }])
    const { result } = renderHook(() => useGenuineDetection({
      videoElement: mockVideoElement,
      canvasElement: mockCanvasElement
    }))
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })
    await act(async () => {
      await result.current.handleStartCamera()
    })
    // Simulate repeated detection interval for stable frames
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await result.current.detectHeadTilt?.()
      })
    }
    await waitFor(() => {
      expect(result.current.detectionState).toBe('eyes-detected')
    })
    // Now, simulate head tilt
    mockModel.estimateFaces.mockResolvedValue([{
      keypoints: {
        33: { x: 100, y: 150 },
        263: { x: 200, y: 170 }, // Right eye (tilted)
        168: { x: 150, y: 200 },
        152: { x: 150, y: 300 }
      },
      box: { xMin: 50, yMin: 50, width: 200, height: 300 }
    }])
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await result.current.detectHeadTilt?.()
      })
    }
    await waitFor(() => {
      expect(result.current.detectionState).toBe('head-tilt-left')
      expect(result.current.status).toContain('Tilt your head')
    })
    // Simulate head tilt duration
    await act(async () => {
      jest.advanceTimersByTime(1500)
    })
    await waitFor(() => {
      expect(result.current.detectionState).toBe('success')
    })
  })

  it('should handle detection errors gracefully', async () => {
    mockModel.estimateFaces.mockRejectedValue(new Error('Detection failed'))
    const { result } = renderHook(() => useGenuineDetection({
      videoElement: mockVideoElement,
      canvasElement: mockCanvasElement
    }))
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })
    await act(async () => {
      await result.current.handleStartCamera()
    })
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        await result.current.detectHeadTilt?.()
      })
    }
    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
      expect(result.current.detectionState).toBe('failed')
      expect(result.current.status).toContain('error')
    })
  })

  it('should cleanup resources on unmount', async () => {
    const { result, unmount } = renderHook(() => useGenuineDetection({
      videoElement: mockVideoElement,
      canvasElement: mockCanvasElement
    }))
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })
    await act(async () => {
      await result.current.handleStartCamera()
    })
    await act(async () => {
      unmount()
    })
    await waitFor(() => {
      expect(result.current.isCameraActive).toBe(false)
    })
  })
}) 