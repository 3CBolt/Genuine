'use client'

import { useState } from 'react'
import { GenuineWidgetEmbeddable } from '@/components/GenuineWidgetEmbeddable'
import { verifyToken } from '@/lib/genuine-verify/tokenUtils'

export default function EmbedTest() {
  const [issuedToken, setIssuedToken] = useState<string | null>(null)
  const [tokenMetadata, setTokenMetadata] = useState<{
    issuedAt: string;
    expiresAt: string;
    gestureType: string;
  } | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'valid' | 'invalid' | 'pending' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTokenIssued = async (payload: {
    token: string;
    metadata: {
      issuedAt: string;
      expiresAt: string;
      gestureType: string;
    };
  }) => {
    console.log('[✅ Token Issued]', payload)
    setIssuedToken(payload.token)
    setTokenMetadata(payload.metadata)
    setError(null)
    setVerificationStatus('pending')

    try {
      const result = await verifyToken(payload.token)
      if (result.valid) {
        console.log('[🎉 Token is valid]', result)
        setVerificationStatus('valid')
      } else {
        console.warn('[❌ Token is invalid]', result)
        setVerificationStatus('invalid')
      }
    } catch (verifyError) {
      console.error('[❌ Token verification failed]', verifyError)
      setVerificationStatus('invalid')
      setError(`Token verification failed: ${verifyError instanceof Error ? verifyError.message : 'Unknown error'}`)
    }
  }

  const handleError = (error: Error) => {
    console.error('Verification error:', error)
    setError(error.message)
    setIssuedToken(null)
    setVerificationStatus(null)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">Embeddable Widget Test</h1>
        
        {/* Token Display */}
        {issuedToken && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h2 className="text-lg font-semibold text-green-800 mb-2">✅ Token Issued</h2>
            <div className="text-sm text-green-700 break-all mb-2">{issuedToken}</div>
            
            {/* Token Metadata */}
            {tokenMetadata && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <h3 className="text-sm font-semibold text-green-800 mb-2">📋 Token Metadata</h3>
                <div className="text-xs text-green-700 space-y-1">
                  <div><strong>Gesture:</strong> {tokenMetadata.gestureType}</div>
                  <div><strong>Issued:</strong> {new Date(tokenMetadata.issuedAt).toLocaleString()}</div>
                  <div><strong>Expires:</strong> {new Date(tokenMetadata.expiresAt).toLocaleString()}</div>
                </div>
              </div>
            )}
            
            {/* Verification Status */}
            {verificationStatus && (
              <div className="mt-3 pt-3 border-t border-green-200">
                {verificationStatus === 'pending' && (
                  <div className="text-sm text-blue-600">⏳ Verifying token...</div>
                )}
                {verificationStatus === 'valid' && (
                  <div className="text-sm text-green-600">✅ Token is valid</div>
                )}
                {verificationStatus === 'invalid' && (
                  <div className="text-sm text-red-600">❌ Token is invalid or expired</div>
                )}
              </div>
            )}
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
  onTokenIssued={(payload) => {
    console.log('Token:', payload.token)
    console.log('Metadata:', payload.metadata)
  }}
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