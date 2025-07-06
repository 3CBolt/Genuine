'use client'

import { useState } from 'react'
import { GenuineWidgetEmbeddable } from '@/components/GenuineWidgetEmbeddable'

export default function EmbedTest() {
  const [issuedToken, setIssuedToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTokenIssued = (token: string) => {
    console.log('Token issued:', token)
    setIssuedToken(token)
    setError(null)
  }

  const handleError = (error: Error) => {
    console.error('Verification error:', error)
    setError(error.message)
    setIssuedToken(null)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">Embeddable Widget Test</h1>
        
        {/* Token Display */}
        {issuedToken && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h2 className="text-lg font-semibold text-green-800 mb-2">✅ Token Issued</h2>
            <div className="text-sm text-green-700 break-all">{issuedToken}</div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-lg font-semibold text-red-800 mb-2">❌ Error</h2>
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Widget */}
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <GenuineWidgetEmbeddable
            onTokenIssued={handleTokenIssued}
            onError={handleError}
            tokenTTL={300}
            debug={true}
            trigger="auto"
          />
        </div>

        {/* Usage Example */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Usage Example</h2>
          <pre className="text-xs text-blue-700 overflow-x-auto">
{`<GenuineWidgetEmbeddable
  onTokenIssued={(token) => console.log(token)}
  tokenTTL={300}
  debug={false}
  trigger="auto"
/>`}
          </pre>
        </div>
      </div>
    </main>
  )
} 