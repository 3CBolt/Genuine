import * as tf from '@tensorflow/tfjs'
import * as blazeface from '@tensorflow-models/blazeface'
import { Tensor1D, Tensor2D } from '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'

export type BlazeFaceModel = blazeface.BlazeFaceModel
export type BlazeFacePrediction = blazeface.NormalizedFace

export interface BlazeFaceDetectionResult {
  face: BlazeFacePrediction | null
  isDetected: boolean
  confidence: number
  landmarks: {
    leftEye: [number, number] | null
    rightEye: [number, number] | null
  }
}

let modelInstance: BlazeFaceModel | null = null
let _isModelLoading = false
let modelLoadPromise: Promise<BlazeFaceModel> | null = null

export function isTensor1D(x: any): x is Tensor1D {
  return x != null && typeof x === 'object' && typeof x.rank === 'number' && x.rank === 1 && typeof x.arraySync === 'function';
}
function isTensor2D(x: any): x is Tensor2D {
  return x != null && typeof x === 'object' && typeof x.rank === 'number' && x.rank === 2 && typeof x.arraySync === 'function';
}
function isNumberTuple(x: any): x is [number, number] {
  return Array.isArray(x) && x.length === 2 && typeof x[0] === 'number' && typeof x[1] === 'number'
}
export function coordsFromTensor1D(t: Tensor1D | [number, number]): [number, number] {
  if (isNumberTuple(t)) return t
  if (isTensor1D(t)) {
    const arr = t.arraySync() as number[]
    return [arr[0], arr[1]]
  }
  return [0, 0]
}
function landmarksToArray(landmarks: number[][] | Tensor2D): number[][] {
  if (isTensor2D(landmarks)) {
    return (landmarks.arraySync() as number[][])
  }
  return landmarks
}

/**
 * Loads the BlazeFace model. Returns cached instance if already loaded.
 */
export async function loadBlazeFaceModel(): Promise<BlazeFaceModel> {
  if (modelInstance) {
    return modelInstance
  }

  if (modelLoadPromise) {
    return modelLoadPromise
  }

  _isModelLoading = true
  modelLoadPromise = (async () => {
    try {
      // Initialize TensorFlow backend
      await tf.setBackend('webgl')
      await tf.ready()
      
      // Load BlazeFace model
      const model = await blazeface.load()
      modelInstance = model
      _isModelLoading = false
      modelLoadPromise = null
      
      return model
    } catch (error) {
      _isModelLoading = false
      modelLoadPromise = null
      throw error
    }
  })()

  return modelLoadPromise
}

/**
 * Detects faces using BlazeFace model
 */
export async function detectFaces(
  videoElement: HTMLVideoElement,
  model?: BlazeFaceModel
): Promise<BlazeFaceDetectionResult> {
  const detectionModel = model || modelInstance
  
  if (!detectionModel) {
    throw new Error('BlazeFace model not loaded')
  }

  if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
    return {
      face: null,
      isDetected: false,
      confidence: 0,
      landmarks: {
        leftEye: null,
        rightEye: null
      }
    }
  }

  try {
    const predictions = await detectionModel.estimateFaces(videoElement)
    
    if (predictions.length === 0) {
      return {
        face: null,
        isDetected: false,
        confidence: 0,
        landmarks: {
          leftEye: null,
          rightEye: null
        }
      }
    }

    const face = predictions[0]
    // Convert topLeft and bottomRight to [number, number] if they are Tensor1D
    const topLeft = coordsFromTensor1D(face.topLeft)
    const bottomRight = coordsFromTensor1D(face.bottomRight)
    const landmarksArr = landmarksToArray(face.landmarks ?? [])
    
    return {
      face: {
        ...face,
        topLeft,
        bottomRight,
        landmarks: landmarksArr
      },
      isDetected: true,
      confidence: face.probability || 0,
      landmarks: {
        leftEye: isNumberTuple(landmarksArr[0]) ? [landmarksArr[0][0], landmarksArr[0][1]] : null,
        rightEye: isNumberTuple(landmarksArr[1]) ? [landmarksArr[1][0], landmarksArr[1][1]] : null
      }
    }
  } catch (error) {
    console.error('BlazeFace detection error:', error)
    return {
      face: null,
      isDetected: false,
      confidence: 0,
      landmarks: {
        leftEye: null,
        rightEye: null
      }
    }
  }
}

/**
 * Calculates head tilt angle from eye landmarks
 */
export function calculateHeadTilt(leftEye: [number, number] | null, rightEye: [number, number] | null): number {
  if (!isNumberTuple(leftEye) || !isNumberTuple(rightEye)) {
    return 0;
  }
  // Only destructure if both are [number, number]
  const [leftX, leftY] = leftEye;
  const [rightX, rightY] = rightEye;
  const deltaY = rightY - leftY;
  const deltaX = rightX - leftX;
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  return angle;
}

/**
 * Checks if model is loaded
 */
export function isModelLoaded(): boolean {
  return modelInstance !== null
}

/**
 * Checks if model is currently loading
 */
export function isModelLoading(): boolean {
  return _isModelLoading
}

/**
 * Clears the cached model instance
 */
export function clearModel(): void {
  modelInstance = null
  modelLoadPromise = null
  _isModelLoading = false
} 