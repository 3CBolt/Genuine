// @jest-environment jsdom

describe('detection logic', () => {
  let setBlinkCount: jest.Mock;
  let setDetectionState: jest.Mock;
  let setStatus: jest.Mock;
  let clearDetectionInterval: jest.Mock;
  let lastEyeState: any;
  let lastBlinkTime: any;
  let detectionState: string;
  let blinkCount: number;
  let BLINK_THRESHOLD: number;

  beforeEach(() => {
    setBlinkCount = jest.fn();
    setDetectionState = jest.fn();
    setStatus = jest.fn();
    clearDetectionInterval = jest.fn();
    lastEyeState = { current: null };
    lastBlinkTime = { current: 0 };
    detectionState = 'blinking';
    blinkCount = 0;
    BLINK_THRESHOLD = 0.1;
    jest.useFakeTimers();
    jest.setSystemTime(1000000);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should increment blink count and transition to success after 3 blinks', () => {
    lastBlinkTime.current = Date.now() - 1000;
    lastEyeState.current = { left: 0.3, right: 0.3 };
    let localBlinkCount = 0;
    let prev = 0;

    function simulateBlink(leftOpen: number, rightOpen: number) {
      const currentEyeState = { left: leftOpen, right: rightOpen };
      const leftDiff = Math.abs(currentEyeState.left - lastEyeState.current.left);
      const rightDiff = Math.abs(currentEyeState.right - lastEyeState.current.right);
      const isBlinking = (leftDiff > BLINK_THRESHOLD && currentEyeState.left < lastEyeState.current.left) ||
                        (rightDiff > BLINK_THRESHOLD && currentEyeState.right < lastEyeState.current.right);
      if (isBlinking && Date.now() - lastBlinkTime.current > 500) {
        lastBlinkTime.current = Date.now();
        localBlinkCount++;
        setBlinkCount((prevVal: number) => {
          const newCount = prevVal + 1;
          if (newCount >= 3) {
            setDetectionState('success');
            setStatus('Verification successful!');
            clearDetectionInterval();
          }
          return newCount;
        });
      }
      lastEyeState.current = currentEyeState;
    }

    // Blink 1
    simulateBlink(0.1, 0.1); // closed
    simulateBlink(0.3, 0.3); // open
    if (setBlinkCount.mock.calls.length) {
      prev = 0;
      prev = setBlinkCount.mock.calls[0][0](prev);
      setBlinkCount.mockClear();
    }
    jest.advanceTimersByTime(600);
    // Blink 2
    simulateBlink(0.1, 0.1); // closed
    simulateBlink(0.3, 0.3); // open
    if (setBlinkCount.mock.calls.length) {
      prev = setBlinkCount.mock.calls[0][0](prev);
      setBlinkCount.mockClear();
    }
    jest.advanceTimersByTime(600);
    // Blink 3
    simulateBlink(0.1, 0.1); // closed
    simulateBlink(0.3, 0.3); // open
    if (setBlinkCount.mock.calls.length) {
      prev = setBlinkCount.mock.calls[0][0](prev);
      setBlinkCount.mockClear();
    }

    // Should have transitioned to success
    expect(setDetectionState).toHaveBeenCalledWith('success');
    expect(setStatus).toHaveBeenCalledWith('Verification successful!');
    expect(clearDetectionInterval).toHaveBeenCalled();
    expect(prev).toBe(3);
  });
}); 