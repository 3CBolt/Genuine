'use client'

import { GenuineWidget } from "@/components/GenuineWidget"
import { PresenceToken } from "@/lib/genuine-verify/presence"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">Genuine Verify</h1>
        <div className="p-4 border rounded-lg bg-white shadow-sm">
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
      </div>
    </main>
  )
}

// Remove edge runtime configuration since it's not compatible with TensorFlow.js
export const dynamic = 'force-dynamic'
