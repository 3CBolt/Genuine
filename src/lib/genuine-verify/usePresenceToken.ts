import { useState, useCallback } from 'react'
import { PresenceToken } from './presence'
import { isTokenExpired } from './presence'

const TOKEN_KEY = 'genuine-presence-token'

export function saveTokenToStorage(token: PresenceToken): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token))
}

export function getStoredToken(): PresenceToken | null {
  const raw = localStorage.getItem(TOKEN_KEY)
  if (!raw) return null
  try {
    const token: PresenceToken = JSON.parse(raw)
    if (isTokenExpired(token)) {
      clearStoredToken()
      return null
    }
    return token
  } catch {
    clearStoredToken()
    return null
  }
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function usePresenceToken(persist?: boolean) {
  const [token, setToken] = useState<PresenceToken | null>(() => {
    if (persist) {
      return getStoredToken()
    }
    return null
  })
  const [isValid, setIsValid] = useState<boolean>(() => {
    if (persist) {
      const stored = getStoredToken()
      return !!stored && !isTokenExpired(stored)
    }
    return false
  })

  const save = useCallback((token: PresenceToken) => {
    if (persist) {
      saveTokenToStorage(token)
    }
    setToken(token)
    setIsValid(!isTokenExpired(token))
  }, [persist])

  const clear = useCallback(() => {
    if (persist) {
      clearStoredToken()
    }
    setToken(null)
    setIsValid(false)
  }, [persist])

  return {
    token,
    isValid,
    saveToken: save,
    clearToken: clear,
    getStoredToken: persist ? getStoredToken : undefined
  }
} 