'use client'

import { GenuineWidget } from "@/components/GenuineWidget"
import { PresenceToken } from "@/lib/genuine-verify/presence"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md mb-8">
        <h1 className="text-2xl font-bold text-center mb-4">Genuine Verify - Ticket 1.7 Debug Test</h1>
        
        {/* Test 1: Debug panel enabled */}
        <div className="mb-8 p-4 border rounded-lg bg-white">
          <h2 className="text-lg font-semibold mb-2">🔧 Debug Panel Test</h2>
          <p className="text-sm text-gray-600 mb-4">
            This widget has debug mode enabled. You should see a debug panel in the bottom-right corner.
          </p>
          <GenuineWidget
            gestureType="headTilt" 
            persist={true}
            debug={true}
            headTiltThreshold={0.15}
            onSuccess={(token: PresenceToken) => {
              // Handle successful verification
            }}
            onError={(error: Error) => {
              // Handle verification errors
            }}
          />
        </div>

        {/* Test 2: Debug panel disabled */}
        <div className="mb-8 p-4 border rounded-lg bg-white">
          <h2 className="text-lg font-semibold mb-2">🚫 Debug Panel Disabled</h2>
          <p className="text-sm text-gray-600 mb-4">
            This widget has debug mode disabled. No debug panel should appear.
          </p>
          <GenuineWidget
            gestureType="headTilt" 
            persist={true}
            debug={false}
            headTiltThreshold={0.15}
            onSuccess={(token: PresenceToken) => {
              // Handle successful verification
            }}
            onError={(error: Error) => {
              // Handle verification errors
            }}
          />
        </div>

        {/* Test 3: One-line usage with debug */}
        <div className="mb-8 p-4 border rounded-lg bg-white">
          <h2 className="text-lg font-semibold mb-2">📋 One-Line Debug Usage</h2>
          <GenuineWidget
            gestureType="headTilt"
            onSuccess={(token: PresenceToken) => {
              // Handle successful verification
            }}
            onError={(err: Error) => {
              // Handle verification errors
            }}
            debug={true}
            headTiltThreshold={0.15}
          />
        </div>
      </div>
    </main>
  )
}

// Remove edge runtime configuration since it's not compatible with TensorFlow.js
export const dynamic = 'force-dynamic'
