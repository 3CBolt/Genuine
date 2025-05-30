import { useState, useCallback } from 'react'

// For development only - in production, this would be handled server-side
const DEV_TOKEN_KEY = 'genuine_verify_dev_token'
const DEV_TOKEN_SECRET = 'dev_secret_key_change_in_prod'

export function usePresenceToken() {
  const [token, setToken] = useState<string | null>(null)
  const [isValid, setIsValid] = useState<boolean>(false)

  const generatePresenceToken = useCallback(() => {
    // In production, this would be a proper JWT/HMAC token
    // For now, we'll use a simple timestamp-based token for development
    const timestamp = Date.now()
    const token = `${timestamp}-${DEV_TOKEN_SECRET}`
    localStorage.setItem(DEV_TOKEN_KEY, token)
    setToken(token)
    return token
  }, [])

  const validatePresenceToken = useCallback(() => {
    const storedToken = localStorage.getItem(DEV_TOKEN_KEY)
    if (!storedToken) {
      setIsValid(false)
      return false
    }

    // In production, this would validate a proper JWT/HMAC token
    // For now, we'll just check if the token exists and is recent
    const [timestamp] = storedToken.split('-')
    const tokenAge = Date.now() - parseInt(timestamp)
    const isValid = tokenAge < 24 * 60 * 60 * 1000 // 24 hours

    setIsValid(isValid)
    return isValid
  }, [])

  const clearPresenceToken = useCallback(() => {
    localStorage.removeItem(DEV_TOKEN_KEY)
    setToken(null)
    setIsValid(false)
  }, [])

  return {
    token,
    isValid,
    generatePresenceToken,
    validatePresenceToken,
    clearPresenceToken
  }
} 