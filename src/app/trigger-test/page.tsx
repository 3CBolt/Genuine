'use client'

import { useState, useCallback } from 'react'
import { GenuineWidgetEmbeddable } from '@/components/GenuineWidgetEmbeddable'
import { useGenuineTrigger } from '@/lib/genuine-verify/hooks/useGenuineTrigger'

export default function TriggerTest() {
  const [triggerMode, setTriggerMode] = useState<'auto' | 'manual' | 'manualStart'>('manualStart')
  const [startFunction, setStartFunction] = useState<(() => void) | null>(null)
  const [isDetectionActive, setIsDetectionActive] = useState(false)
  const [isModelReady, setIsModelReady] = useState(false)
  const [triggerHistory, setTriggerHistory] = useState<string[]>([])

  const handleTokenIssued = (payload: {
    token: string;
    metadata: {
      issuedAt: string;
      expiresAt: string;
      gestureType: string;
    };
  }) => {
    console.log('✅ Token issued:', payload)
    addToHistory('Token issued successfully')
  }

  const handleFailure = (context: any) => {
    console.log('❌ Failure occurred:', context)
    addToHistory(`Failure: ${context.reason} after ${context.attempts} attempts`)
  }

  const handleError = (error: Error) => {
    console.error('Error:', error)
    addToHistory(`Error: ${error.message}`)
  }

  const addToHistory = (message: string) => {
    setTriggerHistory(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const handleStartRef = useCallback((startFn: () => void) => {
    setStartFunction(() => startFn)
    setIsModelReady(true)
    addToHistory('Start function received')
  }, [])

  // Trigger controls for programmatic control
  const triggerControls = useGenuineTrigger(
    startFunction,
    null, // stopFn - we'll implement this later
    null, // resetFn - we'll implement this later
    isDetectionActive,
    isModelReady,
    {
      onStart: () => {
        setIsDetectionActive(true)
        addToHistory('Detection started programmatically')
      },
      onStop: () => {
        setIsDetectionActive(false)
        addToHistory('Detection stopped programmatically')
      },
      onReset: () => {
        addToHistory('Detection reset programmatically')
      }
    }
  )

  const handleProgrammaticStart = () => {
    if (triggerControls.startDetection) {
      triggerControls.startDetection()
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addToHistory('Form submitted - triggering verification')
    handleProgrammaticStart()
  }

  const handleSuspiciousActivity = () => {
    addToHistory('Suspicious activity detected - triggering verification')
    handleProgrammaticStart()
  }

  const handleRouteChange = () => {
    addToHistory('Route changed - triggering verification')
    handleProgrammaticStart()
  }

  const clearHistory = () => {
    setTriggerHistory([])
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">Trigger Control Demo</h1>
        
        {/* Configuration Panel */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Trigger Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trigger Mode
              </label>
              <select
                value={triggerMode}
                onChange={(e) => setTriggerMode(e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="auto">Auto - Start immediately</option>
                <option value="manual">Manual - User clicks button</option>
                <option value="manualStart">Manual Start - Programmatic control</option>
              </select>
              <p className="text-xs text-gray-600 mt-1">
                {triggerMode === 'auto' && 'Widget starts detection automatically'}
                {triggerMode === 'manual' && 'User must click "Start Verification" button'}
                {triggerMode === 'manualStart' && 'Detection only starts when called programmatically'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="space-y-1 text-sm">
                <div>Model Ready: <span className={isModelReady ? 'text-green-600' : 'text-red-600'}>{isModelReady ? '✅' : '❌'}</span></div>
                <div>Detection Active: <span className={isDetectionActive ? 'text-green-600' : 'text-red-600'}>{isDetectionActive ? '✅' : '❌'}</span></div>
                <div>Start Function: <span className={startFunction ? 'text-green-600' : 'text-red-600'}>{startFunction ? '✅' : '❌'}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Trigger Buttons */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Programmatic Triggers</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={handleProgrammaticStart}
              disabled={!startFunction || isDetectionActive}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              🚀 Start Detection
            </button>
            
            <button
              onClick={handleFormSubmit}
              disabled={!startFunction || isDetectionActive}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              📝 Form Submit
            </button>
            
            <button
              onClick={handleSuspiciousActivity}
              disabled={!startFunction || isDetectionActive}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ⚠️ Suspicious Activity
            </button>
            
            <button
              onClick={handleRouteChange}
              disabled={!startFunction || isDetectionActive}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              🛣️ Route Change
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mt-4">
            These buttons simulate different scenarios where you might want to trigger verification programmatically.
          </p>
        </div>

        {/* Widget */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Verification Widget</h2>
          <GenuineWidgetEmbeddable
            onTokenIssued={handleTokenIssued}
            onFailure={handleFailure}
            onError={handleError}
            onStartRef={handleStartRef}
            tokenTTL={300}
            debug={true}
            trigger={triggerMode}
            maxAttempts={3}
          />
        </div>

        {/* Trigger History */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Trigger History</h2>
            <button
              onClick={clearHistory}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear History
            </button>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md max-h-64 overflow-y-auto">
            {triggerHistory.length === 0 ? (
              <p className="text-gray-500 text-sm">No trigger events yet...</p>
            ) : (
              <div className="space-y-1">
                {triggerHistory.map((event, index) => (
                  <div key={index} className="text-sm font-mono text-gray-700">
                    {event}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Usage Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Usage */}
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Basic Usage</h3>
            <pre className="text-sm bg-gray-100 p-4 rounded-md overflow-x-auto">
{`// Auto-start (default)
<GenuineWidgetEmbeddable
  onTokenIssued={handleTokenIssued}
  trigger="auto"
/>

// Manual button
<GenuineWidgetEmbeddable
  onTokenIssued={handleTokenIssued}
  trigger="manual"
/>

// Programmatic control
<GenuineWidgetEmbeddable
  onTokenIssued={handleTokenIssued}
  trigger="manualStart"
  onStartRef={setStartFunction}
/>`}
            </pre>
          </div>

          {/* Advanced Usage */}
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Advanced Usage</h3>
            <pre className="text-sm bg-gray-100 p-4 rounded-md overflow-x-auto">
{`// Form submit trigger
const handleSubmit = (e) => {
  e.preventDefault()
  startDetection() // Trigger verification
}

// Suspicious activity
const handleSuspiciousActivity = () => {
  startDetection() // Trigger verification
}

// Route change
useEffect(() => {
  startDetection() // Trigger on route change
}, [route])`}
            </pre>
          </div>
        </div>

        {/* Features List */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Trigger Features</h2>
          <ul className="space-y-2 text-gray-700">
            <li>✅ <strong>Auto trigger:</strong> Start detection immediately when widget loads</li>
            <li>✅ <strong>Manual trigger:</strong> User clicks button to start detection</li>
            <li>✅ <strong>Manual start:</strong> Programmatic control via start function</li>
            <li>✅ <strong>useGenuineTrigger hook:</strong> Provides programmatic control methods</li>
            <li>✅ <strong>Status tracking:</strong> Know when detection is active and model is ready</li>
            <li>✅ <strong>Event callbacks:</strong> onStart, onStop, onReset callbacks</li>
            <li>✅ <strong>Flexible integration:</strong> Trigger on form submit, route change, suspicious activity, etc.</li>
          </ul>
        </div>
      </div>
    </main>
  )
} 