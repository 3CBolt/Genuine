'use client'

import { useState } from 'react'
import { useVerificationStatus } from '@/lib/genuine-verify/hooks/useVerificationStatus'
import { GenuineWidgetEmbeddable } from '@/components/GenuineWidgetEmbeddable'
import { createPresenceToken } from '@/lib/genuine-verify/tokenUtils'

export default function VerificationStatusDemo() {
  const { isVerified, token, expiresIn, isExpiringSoon, timeRemaining, clearToken, refresh } = useVerificationStatus()
  const [showWidget, setShowWidget] = useState(false)

  const handleTokenIssued = (payload: {
    token: string;
    metadata: {
      issuedAt: string;
      expiresAt: string;
      gestureType: string;
    };
  }) => {
    console.log('Token issued with metadata:', payload)
    // The hook will automatically detect the new token
  }

  const handleError = (error: Error) => {
    console.error('Verification error:', error)
  }

  const createTestToken = () => {
    // Create a test token that expires in 2 minutes
    const testToken = createPresenceToken('headTilt', 120000) // 2 minutes
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('genuine_verify_token', testToken.token)
      refresh() // Trigger hook update
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-8">Verification Status Hook Demo</h1>
        
        {/* Status Display */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Current Verification Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-2">Verification Status</div>
              <div className={`text-lg font-semibold ${isVerified ? 'text-green-600' : 'text-red-600'}`}>
                {isVerified ? '✅ Verified' : '❌ Not Verified'}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-2">Time Remaining</div>
              <div className="text-lg font-semibold">
                {timeRemaining || 'N/A'}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-2">Expires In (seconds)</div>
              <div className="text-lg font-semibold">
                {expiresIn !== null ? expiresIn : 'N/A'}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-2">Expiring Soon</div>
              <div className={`text-lg font-semibold ${isExpiringSoon ? 'text-orange-600' : 'text-gray-600'}`}>
                {isExpiringSoon ? '⚠️ Yes' : 'No'}
              </div>
            </div>
          </div>
          
          {/* Token Display */}
          {token && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-2">Current Token</div>
              <div className="text-xs text-blue-700 break-all font-mono">
                {token.substring(0, 50)}...
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={refresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              🔄 Refresh Status
            </button>
            
            <button
              onClick={clearToken}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              🗑️ Clear Token
            </button>
            
            <button
              onClick={createTestToken}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            >
              🧪 Create Test Token
            </button>
            
            <button
              onClick={() => setShowWidget(!showWidget)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
            >
              {showWidget ? '🙈 Hide Widget' : '👁️ Show Widget'}
            </button>
          </div>
        </div>

        {/* Widget */}
        {showWidget && (
          <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Verification Widget</h2>
            <GenuineWidgetEmbeddable
              onTokenIssued={handleTokenIssued}
              onError={handleError}
              tokenTTL={300}
              debug={true}
              trigger="manual"
            />
          </div>
        )}

        {/* Usage Example */}
        <div className="p-6 bg-white rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Usage Example</h2>
          <pre className="text-sm bg-gray-100 p-4 rounded-md overflow-x-auto">
{`import { useVerificationStatus } from 'genuine-verify-sdk'

function MyApp() {
  const { isVerified, token, expiresIn, timeRemaining, clearToken } = useVerificationStatus()

  return (
    <div>
      {isVerified ? (
        <div>
          <p>✅ Human verified! Expires in {timeRemaining}</p>
          <button onClick={clearToken}>Clear Verification</button>
        </div>
      ) : (
        <p>❌ Human not verified</p>
      )}
    </div>
  )
}`}
          </pre>
        </div>

        {/* Hook Features */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Hook Features</h2>
          <ul className="space-y-2 text-gray-700">
            <li>✅ <strong>Real-time updates:</strong> Auto-updates every second when verified</li>
            <li>✅ <strong>Live countdown:</strong> Shows time remaining until expiration</li>
            <li>✅ <strong>Expiration warning:</strong> Detects when token expires soon (≤60s)</li>
            <li>✅ <strong>Token management:</strong> Clear stored tokens</li>
            <li>✅ <strong>Manual refresh:</strong> Force status update</li>
            <li>✅ <strong>TypeScript support:</strong> Full type safety</li>
          </ul>
        </div>
      </div>
    </main>
  )
} 