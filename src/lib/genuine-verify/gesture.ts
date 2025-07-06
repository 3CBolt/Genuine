// Define a local type for BlazeFace keypoints if not exported
export type NormalizedKeypoint = {
  name: string;
  x: number;
  y: number;
};

// Approximates head tilt using angle between eyes
export function isHeadTilted(
  keypoints: NormalizedKeypoint[],
  thresholdDegrees: number = 15
): boolean {
  const leftEye = keypoints.find((pt) => pt.name === 'leftEye');
  const rightEye = keypoints.find((pt) => pt.name === 'rightEye');
  if (!leftEye || !rightEye) return false;

  const dy = rightEye.y - leftEye.y;
  const dx = rightEye.x - leftEye.x;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return Math.abs(angle) > thresholdDegrees;
}

// Approximates blink using vertical eye-nose distance
export function isBlinking(
  keypoints: NormalizedKeypoint[],
  blinkThreshold: number = 0.2
): boolean {
  const leftEye = keypoints.find((pt) => pt.name === 'leftEye');
  const rightEye = keypoints.find((pt) => pt.name === 'rightEye');
  const nose = keypoints.find((pt) => pt.name === 'nose');

  if (!leftEye || !rightEye || !nose) return false;

  const leftOpen = Math.abs(leftEye.y - nose.y);
  const rightOpen = Math.abs(rightEye.y - nose.y);
  const avgOpen = (leftOpen + rightOpen) / 2;

  return avgOpen < blinkThreshold;
} 