import React from 'react';
import { DetectionState } from '../types';

interface GenuineUIProps {
  detectionState: DetectionState;
  isCameraActive: boolean;
  isModelLoaded: boolean;
  isModelLoading: boolean;
  error: string | null;
  blinkCount: number;
  onStartCamera: () => void;
  onCleanup: () => void;
  onRetry: () => void;
  onCancel: () => void;
  onVerify: () => void;
}

export const GenuineUI: React.FC<GenuineUIProps> = ({
  detectionState,
  isCameraActive,
  isModelLoaded,
  isModelLoading,
  error,
  blinkCount,
  onStartCamera,
  onCleanup,
  onRetry,
  onCancel,
  onVerify
}) => {
  if (isModelLoading) {
    return (
      <div>
        <p>Loading face detection model...</p>
        <div role="progressbar" aria-label="Loading progress" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <p>{error}</p>
        <button onClick={onRetry}>Retry</button>
      </div>
    );
  }

  if (!isCameraActive) {
    return (
      <div>
        <p>Click "Start Camera" to begin verification</p>
        <button onClick={onStartCamera}>Start Camera</button>
      </div>
    );
  }

  if (detectionState === 'camera-active') {
    return (
      <div>
        <p>Position your face in the frame</p>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  }

  if (detectionState === 'success') {
    return (
      <div>
        <p>Verification successful!</p>
        <button onClick={onVerify}>Verify</button>
      </div>
    );
  }

  if (detectionState === 'failed') {
    return (
      <div>
        <p>Verification failed. Please try again.</p>
        <button onClick={onRetry}>Retry</button>
      </div>
    );
  }

  return null;
}; 