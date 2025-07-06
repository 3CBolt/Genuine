'use client'

import React, { useState } from 'react'

export default function ApiTestPage() {
  const [token, setToken] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [method, setMethod] = useState<'header' | 'body'>('header')
  const [oneTimeUse, setOneTimeUse] = useState(false)

  const testApi = async () => {
    if (!token.trim()) {
      alert('Please enter a token')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const url = `/api/verify-human${oneTimeUse ? '?oneTimeUse=true' : ''}`
      
      let response: Response
      
      if (method === 'header') {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      } else {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token })
        })
      }

      const data = await response.json()
      setResult({
        status: response.status,
        data
      })
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test /api/verify-human</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token (JSON string)
              </label>
              <textarea
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder='{"token":"uuid","gesture":"headTilt","issuedAt":"2025-01-06T20:00:00.000Z","expiresAt":"2025-01-06T20:05:00.000Z","version":1}'
                className="w-full h-32 p-3 border border-gray-300 rounded-md font-mono text-sm"
              />
            </div>

            <div className="flex space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Method
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as 'header' | 'body')}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="header">Authorization Header</option>
                  <option value="body">JSON Body</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="oneTimeUse"
                  checked={oneTimeUse}
                  onChange={(e) => setOneTimeUse(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="oneTimeUse" className="text-sm font-medium text-gray-700">
                  One-time use
                </label>
              </div>
            </div>

            <button
              onClick={testApi}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test API'}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Result</h3>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Example Usage</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">cURL Examples:</h4>
              <div className="bg-gray-100 p-4 rounded-md">
                <p className="text-sm font-mono mb-2">
                  # Authorization Header
                </p>
                <p className="text-sm font-mono text-gray-600">
                  curl -X POST http://localhost:3000/api/verify-human \
                  <br />
                  &nbsp;&nbsp;-H "Authorization: Bearer {"{token}"}" \
                  <br />
                  &nbsp;&nbsp;-H "Content-Type: application/json"
                </p>
              </div>
            </div>

            <div>
              <div className="bg-gray-100 p-4 rounded-md">
                <p className="text-sm font-mono mb-2">
                  # JSON Body
                </p>
                <p className="text-sm font-mono text-gray-600">
                  curl -X POST http://localhost:3000/api/verify-human \
                  <br />
                  &nbsp;&nbsp;-H "Content-Type: application/json" \
                  <br />
                  &nbsp;&nbsp;-d '{"token": "your-token-here"}'
                </p>
              </div>
            </div>

            <div>
              <div className="bg-gray-100 p-4 rounded-md">
                <p className="text-sm font-mono mb-2">
                  # One-time use
                </p>
                <p className="text-sm font-mono text-gray-600">
                  curl -X POST "http://localhost:3000/api/verify-human?oneTimeUse=true" \
                  <br />
                  &nbsp;&nbsp;-H "Authorization: Bearer {"{token}"}"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 