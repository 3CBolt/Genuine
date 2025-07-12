'use client'

import React, { useState } from 'react'
import { GenuineWidget } from 'genuine-verify-sdk'
import { PresenceToken } from 'genuine-verify-sdk'

export default function TTLTestPage() {
  const [token, setToken] = useState<PresenceToken | null>(null)
  const [expiredCount, setExpiredCount] = useState(0)
  const [refreshCount, setRefreshCount] = useState(0)

  const handleSuccess = (newToken: PresenceToken) => {
    setToken(newToken)
    console.log('Token issued:', newToken)
  }

  const handleTokenExpired = () => {
    setExpiredCount(prev => prev + 1)
    console.log('Token expired! Count:', expiredCount + 1)
  }

  const handleRefresh = () => {
    setRefreshCount(prev => prev + 1)
    setToken(null)
    console.log('Manual refresh triggered! Count:', refreshCount + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">TTL Management Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
            <div className="space-y-2 text-sm">
              <div><strong>Token TTL:</strong> 30 seconds (for testing)</div>
              <div><strong>Expiration Warning:</strong> 10 seconds before expiry</div>
              <div><strong>Auto-refresh:</strong> Enabled</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Statistics</h2>
            <div className="space-y-2 text-sm">
              <div><strong>Expirations:</strong> {expiredCount}</div>
              <div><strong>Manual Refreshes:</strong> {refreshCount}</div>
              <div><strong>Current Token:</strong> {token ? 'Active' : 'None'}</div>
              {token && (
                <div><strong>Expires:</strong> {new Date(token.expiresAt).toLocaleTimeString()}</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Widget</h2>
          <div className="max-w-md">
            <GenuineWidget
              gestureType="headTilt"
              onSuccess={handleSuccess}
              onTokenExpired={handleTokenExpired}
              tokenTTL={30_000} // 30 seconds for testing
              showExpirationWarning={true}
              autoRefreshOnExpiry={true}
              debug={true}
            />
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Manual Controls</h2>
          <div className="space-x-4">
            <button
              onClick={handleRefresh}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Manual Refresh
            </button>
            <button
              onClick={() => setToken(null)}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Clear Token
            </button>
          </div>
        </div>

        {token && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Current Token</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(token, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
} 