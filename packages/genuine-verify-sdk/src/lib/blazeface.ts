// Dynamic imports to prevent SSR issues
let tf: any = null
let blazeface: any = null

// Initialize TensorFlow.js only on client side
const initTensorFlow = async () => {
  if (typeof window === 'undefined') {
    console.warn('TensorFlow.js cannot be initialized on server side')
    return // Skip on server side
  }
  
  if (!tf) {
    try {
      tf = await import('@tensorflow/tfjs')
      blazeface = await import('@tensorflow-models/blazeface')
      await import('@tensorflow/tfjs-backend-webgl')
    } catch (error) {
      console.error('Failed to load TensorFlow.js:', error)
      throw error
    }
  }
}

export type BlazeFaceModel = any
export type BlazeFacePrediction = any

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

export function isTensor1D(x: any): x is any {
  return x != null && typeof x === 'object' && typeof x.rank === 'number' && x.rank === 1 && typeof x.arraySync === 'function';
}
function isTensor2D(x: any): x is any {
  return x != null && typeof x === 'object' && typeof x.rank === 'number' && x.rank === 2 && typeof x.arraySync === 'function';
}
function isNumberTuple(x: any): x is [number, number] {
  return Array.isArray(x) && x.length === 2 && typeof x[0] === 'number' && typeof x[1] === 'number'
}
export function coordsFromTensor1D(t: any | [number, number]): [number, number] {
  if (isNumberTuple(t)) return t
  if (isTensor1D(t)) {
    const arr = t.arraySync() as number[]
    return [arr[0], arr[1]]
  }
  return [0, 0]
}
function landmarksToArray(landmarks: number[][] | any): number[][] {
  if (isTensor2D(landmarks)) {
    return (landmarks.arraySync() as number[][])
  }
  return landmarks
}

/**
 * Loads the BlazeFace model. Returns cached instance if already loaded.
 */
export async function loadBlazeFaceModel(): Promise<BlazeFaceModel> {
  // Prevent SSR issues
  if (typeof window === 'undefined') {
    throw new Error('BlazeFace model cannot be loaded on server side')
  }

  if (modelInstance) {
    return modelInstance
  }

  if (modelLoadPromise) {
    return modelLoadPromise
  }

  _isModelLoading = true
  modelLoadPromise = (async () => {
    try {
      // Initialize TensorFlow.js
      await initTensorFlow()
      
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
  // Prevent SSR issues
  if (typeof window === 'undefined') {
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

  // Initialize TensorFlow.js if not already done
  await initTensorFlow()
  
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
      confidence: face.probability ? Number(face.probability) : 0,
      landmarks: {
        leftEye: isNumberTuple(landmarksArr[0]) ? [landmarksArr[0][0], landmarksArr[0][1]] : null,
        rightEye: isNumberTuple(landmarksArr[1]) ? [landmarksArr[1][0], landmarksArr[1][1]] : null
      }
    }
  } catch (error) {
    // Only log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('BlazeFace detection error:', error)
    }
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