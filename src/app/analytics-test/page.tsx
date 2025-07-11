'use client'

import { useState } from 'react'
import { GenuineWidgetEmbeddable } from '@/components/GenuineWidgetEmbeddable'
import { useGenuineAnalytics } from 'genuine-verify-sdk'

export default function AnalyticsTest() {
  const [showAnalytics, setShowAnalytics] = useState(true)
  
  // Mock detection state for testing analytics
  const mockDetectionState = {
    isCameraActive: false,
    gestureMatched: false,
    detectionState: 'idle',
    fps: 0
  }
  
  const analytics = useGenuineAnalytics(mockDetectionState, {
    persist: true,
    logToConsole: true
  })

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

  const handleFailure = (context: any) => {
    console.log('❌ Failure occurred:', context)
  }

  const handleError = (error: Error) => {
    console.error('Error:', error)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">Analytics Test</h1>
        
        {/* Analytics Panel */}
        {showAnalytics && (
          <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">📊 Analytics (Dev Only)</h2>
              <button
                onClick={() => setShowAnalytics(false)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Hide
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{analytics.successCount}</div>
                <div className="text-sm text-gray-600">Successes</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{analytics.failureCount}</div>
                <div className="text-sm text-gray-600">Failures</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{analytics.attemptCount}</div>
                <div className="text-sm text-gray-600">Attempts</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{analytics.fps}</div>
                <div className="text-sm text-gray-600">FPS</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-lg font-bold text-yellow-600">
                  {analytics.lastEvent || 'None'}
                </div>
                <div className="text-sm text-gray-600">Last Event</div>
              </div>
            </div>
            
            <div className="mt-4 flex gap-2">
              <button
                onClick={analytics.clear}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Clear Analytics
              </button>
              
              <button
                onClick={() => analytics.log('Manual test log entry')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Test Log
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-gray-100 rounded-md">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> Analytics are only active in development mode. 
                Check the browser console for real-time logs.
              </p>
            </div>
          </div>
        )}

        {/* Widget */}
        <div className="p-6 bg-white rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Verification Widget</h2>
          <GenuineWidgetEmbeddable
            onTokenIssued={handleTokenIssued}
            onFailure={handleFailure}
            onError={handleError}
            tokenTTL={300}
            debug={true}
            maxAttempts={3}
          />
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">How to Test Analytics</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Start verification by clicking the widget</li>
            <li>Watch the analytics panel update in real-time</li>
            <li>Check browser console for detailed logs</li>
            <li>Try the "Test Log" button to add custom entries</li>
            <li>Use "Clear Analytics" to reset counters</li>
          </ol>
        </div>
      </div>
    </main>
  )
} 