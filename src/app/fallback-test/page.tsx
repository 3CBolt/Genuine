'use client'

import { useState } from 'react'
import { GenuineWidgetEmbeddable, FailureContext } from '@/components/GenuineWidgetEmbeddable'
import { createPresenceToken } from 'genuine-verify-sdk'

// Custom fallback component example
const CustomFallback: React.FC<{
  failureContext: FailureContext
  triggerRetry: () => void
}> = ({ failureContext, triggerRetry }) => {
  const getFailureMessage = (reason: string) => {
    switch (reason) {
      case 'max_attempts_reached':
        return 'Too many failed attempts. Please try a different approach.'
      case 'gesture_timeout':
        return 'Gesture detection timed out. Please try again.'
      case 'camera_error':
        return 'Camera access issue. Please check permissions.'
      case 'model_error':
        return 'Face detection model error. Please refresh and try again.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  return (
    <div className="p-6 bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-lg">
      <div className="text-center">
        <div className="text-4xl mb-4">😔</div>
        <h2 className="text-xl font-bold text-red-800 mb-2">Verification Failed</h2>
        <p className="text-red-700 mb-4">{getFailureMessage(failureContext.reason)}</p>
        
        <div className="bg-white p-4 rounded-lg mb-4 text-sm">
          <div className="grid grid-cols-2 gap-2 text-gray-600">
            <div><strong>Attempts:</strong> {failureContext.attempts}/{failureContext.maxAttempts}</div>
            <div><strong>Reason:</strong> {failureContext.reason}</div>
            <div><strong>Time:</strong> {new Date(failureContext.timestamp).toLocaleTimeString()}</div>
            {failureContext.error && (
              <div><strong>Error:</strong> {failureContext.error.message}</div>
            )}
          </div>
        </div>
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={triggerRetry}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            🔄 Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            🔄 Refresh Page
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FallbackTest() {
  const [failureHistory, setFailureHistory] = useState<FailureContext[]>([])
  const [showCustomFallback, setShowCustomFallback] = useState(false)
  const [maxAttempts, setMaxAttempts] = useState(3)
  const [useCustomFallback, setUseCustomFallback] = useState(false)

  const handleTokenIssued = (payload: {
    token: string;
    metadata: {
      issuedAt: string;
      expiresAt: string;
      gestureType: string;
    };
  }) => {
    console.log('✅ Token issued:', payload)
  }

  const handleFailure = (context: FailureContext) => {
    console.log('❌ Failure occurred:', context)
    setFailureHistory(prev => [...prev, context])
  }

  const handleError = (error: Error) => {
    console.error('Error:', error)
  }

  const clearHistory = () => {
    setFailureHistory([])
  }

  const createTestFailure = () => {
    const testContext: FailureContext = {
      reason: 'max_attempts_reached',
      attempts: 3,
      maxAttempts: 3,
      error: new Error('Test failure'),
      timestamp: new Date().toISOString()
    }
    setFailureHistory(prev => [...prev, testContext])
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">Fallback Strategy Demo</h1>
        
        {/* Configuration Panel */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Attempts
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 3)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="customFallback"
                checked={useCustomFallback}
                onChange={(e) => setUseCustomFallback(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="customFallback" className="text-sm font-medium text-gray-700">
                Use Custom Fallback
              </label>
            </div>
            
            <div>
              <button
                onClick={createTestFailure}
                className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
              >
                🧪 Create Test Failure
              </button>
            </div>
          </div>
        </div>

        {/* Widget */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Verification Widget</h2>
          <GenuineWidgetEmbeddable
            onTokenIssued={handleTokenIssued}
            onFailure={handleFailure}
            onError={handleError}
            tokenTTL={300}
            debug={true}
            trigger="manual"
            maxAttempts={maxAttempts}
            fallback={useCustomFallback ? CustomFallback : undefined}
          />
        </div>

        {/* Failure History */}
        {failureHistory.length > 0 && (
          <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Failure History</h2>
              <button
                onClick={clearHistory}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear History
              </button>
            </div>
            
            <div className="space-y-3">
              {failureHistory.map((failure, index) => (
                <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-red-800">
                        {failure.reason.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm text-red-600">
                        Attempts: {failure.attempts}/{failure.maxAttempts} • 
                        Time: {new Date(failure.timestamp).toLocaleTimeString()}
                      </div>
                      {failure.error && (
                        <div className="text-xs text-red-500 mt-1">
                          Error: {failure.error.message}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      #{index + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Usage */}
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Basic Usage</h3>
            <pre className="text-sm bg-gray-100 p-4 rounded-md overflow-x-auto">
{`<GenuineWidgetEmbeddable
  onTokenIssued={handleTokenIssued}
  onFailure={handleFailure}
  maxAttempts={3}
/>`}
            </pre>
          </div>

          {/* Custom Fallback */}
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Custom Fallback</h3>
            <pre className="text-sm bg-gray-100 p-4 rounded-md overflow-x-auto">
{`const CustomFallback = ({ failureContext, triggerRetry }) => (
  <div>
    <h2>Custom Error UI</h2>
    <button onClick={triggerRetry}>
      Try Again
    </button>
  </div>
)

<GenuineWidgetEmbeddable
  onTokenIssued={handleTokenIssued}
  onFailure={handleFailure}
  maxAttempts={5}
  fallback={CustomFallback}
/>`}
            </pre>
          </div>
        </div>

        {/* Features List */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Fallback Features</h2>
          <ul className="space-y-2 text-gray-700">
            <li>✅ <strong>onFailure callback:</strong> Get structured failure context with reason, attempts, and error details</li>
            <li>✅ <strong>maxAttempts prop:</strong> Configure how many attempts before triggering fallback (default: 3)</li>
            <li>✅ <strong>Custom fallback component:</strong> Pass your own React component for custom error UI</li>
            <li>✅ <strong>triggerRetry function:</strong> Exposed retry handler for "Try Again" buttons</li>
            <li>✅ <strong>Default fallback UI:</strong> Built-in error display when no custom component provided</li>
            <li>✅ <strong>Failure tracking:</strong> Track attempt count and failure reasons</li>
            <li>✅ <strong>Error context:</strong> Detailed error information for debugging</li>
          </ul>
        </div>
      </div>
    </main>
  )
} 