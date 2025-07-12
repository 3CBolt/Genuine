// src/utils/logEvent.ts

export const logEvent = async (
  event: string,
  data: Record<string, unknown> = {}
) => {
  try {
    // Generate anonymous session ID if not exists
    let sessionId = sessionStorage.getItem('genuine-session-id')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem('genuine-session-id', sessionId)
    }

    const eventData = {
      event,
      timestamp: new Date().toISOString(),
      sessionId,
      ...data,
    }

    // Log to console in development
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log('[Genuine Analytics]', eventData)
    }

    // Send to analytics endpoint if available
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      await fetch("/api/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      })
    }
  } catch (err) {
    // Silently fail - don't break user experience
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.warn("Event logging failed:", err)
    }
  }
}

// Helper functions for common events
export const logVerificationStarted = (gestureType: string) => {
  return logEvent("verification_started", {
    gesture: gestureType,
  })
}

export const logVerificationSuccess = (gestureType: string, timeToVerifyMs: number, tokenIssued: boolean) => {
  return logEvent("verification_success", {
    gesture: gestureType,
    timeToVerifyMs,
    tokenIssued,
  })
}

export const logVerificationFailed = (reason: string, gestureType?: string) => {
  return logEvent("verification_failed", {
    reason,
    gesture: gestureType,
  })
}

export const logWidgetLoaded = (gestureType: string, theme?: string) => {
  return logEvent("widget_loaded", {
    gesture: gestureType,
    theme,
  })
}
