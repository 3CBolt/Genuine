// @jest-environment jsdom
import { cleanup } from '../camera'

describe('camera module', () => {
  let videoRef: any;
  let detectionIntervalRef: any;
  let setIsCameraActive: jest.Mock;
  let setError: jest.Mock;
  let setErrorDetails: jest.Mock;
  let setStatus: jest.Mock;
  let stableDetectionFrames: any;
  let missedFrames: any;
  let lastStableDetectionTime: any;
  let detectionStartTime: any;
  let setTimeRemaining: jest.Mock;
  let setCountdownMessage: jest.Mock;
  let setFacePosition: jest.Mock;
  let setEyesDetected: jest.Mock;
  let setPositioningMessage: jest.Mock;
  let setDetectionState: jest.Mock;

  beforeEach(() => {
    videoRef = { current: { srcObject: { getTracks: jest.fn(() => [{ stop: jest.fn() }]) } } };
    detectionIntervalRef = { current: 123 };
    setIsCameraActive = jest.fn();
    setError = jest.fn();
    setErrorDetails = jest.fn();
    setStatus = jest.fn();
    stableDetectionFrames = { current: 1 };
    missedFrames = { current: 1 };
    lastStableDetectionTime = { current: 1 };
    detectionStartTime = { current: 1 };
    setTimeRemaining = jest.fn();
    setCountdownMessage = jest.fn();
    setFacePosition = jest.fn();
    setEyesDetected = jest.fn();
    setPositioningMessage = jest.fn();
    setDetectionState = jest.fn();
  });

  it('should cleanup camera and reset state', () => {
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
      error: null
    });
    expect(setIsCameraActive).toHaveBeenCalledWith(false);
    expect(setError).toHaveBeenCalledWith(null);
    expect(setErrorDetails).toHaveBeenCalledWith('');
    expect(setStatus).toHaveBeenCalledWith('Click to start verification');
    expect(setDetectionState).toHaveBeenCalledWith('idle');
    expect(setTimeRemaining).toHaveBeenCalledWith(0);
    expect(setCountdownMessage).toHaveBeenCalledWith('');
    expect(setFacePosition).toHaveBeenCalledWith(null);
    expect(setEyesDetected).toHaveBeenCalledWith(false);
    expect(setPositioningMessage).toHaveBeenCalledWith('');
    expect(detectionIntervalRef.current).toBeNull();
    expect(videoRef.current.srcObject).toBeNull();
  });
}); 