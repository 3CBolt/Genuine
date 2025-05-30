import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { GenuineUI } from '../GenuineUI'

describe('GenuineUI', () => {
  const defaultProps = {
    detectionState: 'idle' as const,
    isCameraActive: false,
    isModelLoaded: false,
    isModelLoading: true,
    error: null,
    blinkCount: 0,
    onStartCamera: jest.fn(),
    onCleanup: jest.fn(),
    onRetry: jest.fn(),
    onCancel: jest.fn(),
    onVerify: jest.fn()
  }

  it('should render loading state', () => {
    render(<GenuineUI {...defaultProps} />)
    
    expect(screen.getByText('Loading face detection model...')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should render error state', () => {
    const error = 'Test error message'
    render(<GenuineUI {...defaultProps} error={error} isModelLoading={false} />)
    
    expect(screen.getByText(error)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('should render idle state', () => {
    render(<GenuineUI {...defaultProps} isModelLoading={false} />)
    
    expect(screen.getByText('Click "Start Camera" to begin verification')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start camera/i })).toBeInTheDocument()
  })

  it('should render camera active state', () => {
    render(
      <GenuineUI
        {...defaultProps}
        isModelLoading={false}
        isCameraActive={true}
        detectionState="camera-active"
      />
    )
    
    expect(screen.getByText('Position your face in the frame')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('should render success state', () => {
    render(
      <GenuineUI
        {...defaultProps}
        isModelLoading={false}
        isCameraActive={true}
        detectionState="success"
      />
    )
    
    expect(screen.getByText('Verification successful!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument()
  })

  it('should render failed state', () => {
    render(
      <GenuineUI
        {...defaultProps}
        isModelLoading={false}
        isCameraActive={true}
        detectionState="failed"
      />
    )
    
    expect(screen.getByText('Verification failed. Please try again.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('should call onStartCamera when start button is clicked', () => {
    const onStartCamera = jest.fn()
    render(
      <GenuineUI
        {...defaultProps}
        isModelLoading={false}
        onStartCamera={onStartCamera}
      />
    )
    
    screen.getByRole('button', { name: /start camera/i }).click()
    expect(onStartCamera).toHaveBeenCalled()
  })

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn()
    render(
      <GenuineUI
        {...defaultProps}
        isModelLoading={false}
        isCameraActive={true}
        detectionState="camera-active"
        onCancel={onCancel}
      />
    )
    
    screen.getByRole('button', { name: /cancel/i }).click()
    expect(onCancel).toHaveBeenCalled()
  })
}) 