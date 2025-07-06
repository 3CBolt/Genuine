/**
 * @jest-environment jsdom
 */
// Mock TensorFlow and BlazeFace at the very top
jest.mock('@tensorflow/tfjs', () => ({
  ready: jest.fn().mockResolvedValue(undefined),
  setBackend: jest.fn().mockResolvedValue(undefined)
}))
jest.mock('@tensorflow-models/blazeface', () => ({
  load: jest.fn().mockImplementation(() => Promise.resolve({
    estimateFaces: jest.fn()
  }))
}))
// Mock BlazeFace utility
jest.mock('../../blazeface', () => ({
  loadBlazeFaceModel: jest.fn().mockImplementation(() => Promise.resolve({
    estimateFaces: jest.fn()
  })),
  detectFaces: jest.fn(),
  calculateHeadTilt: jest.fn(),
  isModelLoaded: jest.fn(),
  isModelLoading: jest.fn(),
  clearModel: jest.fn()
}))
// Mock camera utilities
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
import * as blazeface from '@tensorflow-models/blazeface'
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

    // Setup BlazeFace mock
    const blazefaceModule = jest.requireMock('@tensorflow-models/blazeface')
    blazefaceModule.load.mockImplementation(() => Promise.resolve(mockModel))

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
    const blazefaceModule = jest.requireMock('@tensorflow-models/blazeface')
    blazefaceModule.load.mockRejectedValueOnce(new Error('Model loading failed'))
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
    })
  })

  it('should handle camera start', async () => {
    const { result } = renderHook(() => useGenuineDetection({
      videoElement: mockVideoElement,
      canvasElement: mockCanvasElement
    }))

    await act(async () => {
      await result.current.handleStartCamera()
    })

    expect(result.current.isCameraActive).toBe(true)
    expect(result.current.detectionState).toBe('eyes-detected')
  })

  it('should handle cleanup', async () => {
    const { result } = renderHook(() => useGenuineDetection({
      videoElement: mockVideoElement,
      canvasElement: mockCanvasElement
    }))

    await act(async () => {
      result.current.handleCleanup()
    })

    expect(result.current.isCameraActive).toBe(false)
    expect(result.current.detectionState).toBe('idle')
  })
}) 
}) 