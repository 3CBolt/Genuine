'use client'

import { GenuineWidget } from '@/components/GenuineWidget'

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <GenuineWidget />
      </div>
    </main>
  )
}

// Remove edge runtime configuration since it's not compatible with TensorFlow.js
export const dynamic = 'force-dynamic'
