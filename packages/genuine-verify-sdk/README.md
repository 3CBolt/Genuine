# Genuine Verify SDK

[![npm version](https://badge.fury.io/js/genuine-verify-sdk.svg)](https://badge.fury.io/js/genuine-verify-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A privacy-first, real-time human verification widget (anti-bot) for React apps. Uses TensorFlow.js and BlazeFace for gesture-based verification—no CAPTCHAs, no user friction.

---

## 📦 Installation

```bash
npm install genuine-verify-sdk
# or
yarn add genuine-verify-sdk
```

**Peer dependencies:**  
- React 18+
- react-dom 18+

---

## 🚀 Quick Start

```tsx
import { GenuineWidgetEmbeddable } from 'genuine-verify-sdk';

function MyApp() {
  const handleTokenIssued = (payload: {
    token: string;
    metadata: {
      issuedAt: string;
      expiresAt: string;
      gestureType: string;
    };
  }) => {
    // Send token to your backend or validate client-side
    console.log('Token:', payload.token);
    console.log('Metadata:', payload.metadata);
  };

  return (
    <GenuineWidgetEmbeddable
      onTokenIssued={handleTokenIssued}
      tokenTTL={300}
      debug={true}
    />
  );
}
```

---

## 📚 Documentation

- [**Widget Usage**](#-widget-usage) - Main component and props
- [**API / Presence Token**](#-utility-functions) - Token validation and utilities
- [**Fallback Configuration**](#️-fallback-strategy) - Handle detection failures
- [**Custom Trigger Support**](#-trigger-control) - Programmatic control
- [**Verification Status**](#-verification-status-hook) - Real-time status tracking
- [**Analytics (Dev Only)**](#-analytics-dev-only) - Development debugging

---

## 🔍 Overview

- **Purpose:** Prevent bots and ensure genuine human interaction with a privacy-first, client-side widget.
- **How it works:** User completes a gesture (e.g., head tilt). The widget issues a signed presence token. You can validate this token client-side or send it to your backend for verification.

---

## 🎨 Visual Features

The widget provides real-time visual feedback during verification:

### Status Indicators
- **🔴 Red badge:** No face detected
- **🟡 Yellow badge:** Face detected, looking for eyes
- **🔵 Blue badge:** Eyes detected, waiting for gesture
- **🟢 Green badge:** Gesture verified!

### Detection Overlays
- **Lime green bounding boxes:** Real-time face detection
- **Cyan eye landmarks:** Detected eye positions
- **Blue framing guide:** Optimal face positioning area

### Real-time Feedback
- **Status messages:** Clear text instructions
- **Positioning guidance:** Help users position their face
- **Error overlays:** Graceful error handling with retry options
- **Loading states:** Model loading indicators

### Debug Panel (Development Only)
- **Live FPS tracking:** Performance monitoring
- **Confidence scores:** Detection accuracy metrics
- **Detection state:** Face, eyes, gesture, stability status
- **Token information:** Expiration and validation status

---

## ⚙️ Widget Usage

### Basic Example

```tsx
import { GenuineWidgetEmbeddable } from 'genuine-verify-sdk';

function MyApp() {
  const handleTokenIssued = (payload: {
    token: string;
    metadata: {
      issuedAt: string;
      expiresAt: string;
      gestureType: string;
    };
  }) => {
    // Send token to your backend or validate client-side
    console.log('Token:', payload.token);
    console.log('Metadata:', payload.metadata);
  };

  return (
    <GenuineWidgetEmbeddable
      onTokenIssued={handleTokenIssued}
      tokenTTL={300}
      debug={true}
    />
  );
}
```

### Props

| Prop               | Type                              | Default   | Description                                 |
|--------------------|-----------------------------------|-----------|---------------------------------------------|
| `onTokenIssued`    | `(payload: { token: string; metadata: { issuedAt: string; expiresAt: string; gestureType: string; } }) => void` | —         | **Required.** Called when token is issued with metadata   |
| `onFailure`        | `(context: FailureContext) => void`                                                                        | —         | Called when gesture detection fails after max attempts     |
| `maxAttempts`      | `number`                                                                                                    | `3`       | Maximum attempts before triggering fallback                |
| `fallback`         | `React.ComponentType<{ failureContext: FailureContext; triggerRetry: () => void }>`                        | —         | Custom fallback component to render on failure            |
| `tokenTTL`         | `number`                          | `300`     | Token time-to-live (seconds)                |
| `debug`            | `boolean`                         | `false`   | Show debug panel                            |
| `headTiltThreshold`| `number`                          | `15`      | Head tilt angle threshold (degrees)         |
| `persist`          | `boolean`                         | `true`    | Persist token in sessionStorage             |
| `trigger`          | `'auto' \| 'manual'`              | `'auto'`  | When to start detection                     |
| `onStartRef`       | `(startFn: () => void) => void`   | —         | Get manual start function                   |
| `onError`          | `(error: Error) => void`          | —         | Error callback                              |

---

## 🔑 Utility Functions

All utilities are available as named exports:

```ts
import {
  verifyToken,
  createPresenceToken,
  getStoredToken,
  storeToken,
  clearStoredToken,
  isStoredTokenValid,
  createMockToken
} from 'genuine-verify-sdk';
```

### Example: Token Validation

```ts
const result = await verifyToken(token);
if (result.valid) {
  // Token is valid!
} else {
  // Token is invalid or expired
}
```

---

## 🔍 Verification Status Hook

Check human verification status with real-time updates:

```ts
import { useVerificationStatus } from 'genuine-verify-sdk'

function MyApp() {
  const { isVerified, token, expiresIn, timeRemaining, clearToken } = useVerificationStatus()

  return (
    <div>
      {isVerified ? (
        <div>
          <p>✅ Human verified! Expires in {timeRemaining}</p>
          <button onClick={clearToken}>Clear Verification</button>
        </div>
      ) : (
        <p>❌ Human not verified</p>
      )}
    </div>
  )
}
```

**Hook Features:**
- ✅ **Real-time updates:** Auto-updates every second when verified
- ✅ **Live countdown:** Shows time remaining until expiration  
- ✅ **Expiration warning:** Detects when token expires soon (≤60s)
- ✅ **Token management:** Clear stored tokens
- ✅ **Manual refresh:** Force status update
- ✅ **TypeScript support:** Full type safety

---

## 🛡️ Fallback Handling

The SDK automatically handles gesture failures and edge cases.

Reasons for fallback include:
- `gesture_timeout`: User didn’t complete gesture in time
- `camera_error`: Camera blocked or inaccessible
- `model_error`: Face detection failed
- `max_attempts_reached`: Too many failed tries
- `unknown`: Unexpected error

Developers can pass an `onFailure` callback to capture detailed failure context.
You can provide a custom fallback component via the `fallback` prop.
If no fallback is provided, the SDK shows a default UI with retry.
Fallbacks also expose a `triggerRetry()` helper to restart verification.

**Usage Example:**
```tsx
<GenuineWidgetEmbeddable
  onTokenIssued={handleToken}
  onFailure={handleFailure}
  maxAttempts={3}
  fallback={MyCustomFallback}
/>
```

---

## 🎯 Trigger Control

Control when verification starts with flexible trigger modes:

```tsx
import { GenuineWidgetEmbeddable, useGenuineTrigger } from 'genuine-verify-sdk'

function MyApp() {
  const [startFunction, setStartFunction] = useState(null)

  // Auto-start (default)
  return (
    <GenuineWidgetEmbeddable
      onTokenIssued={handleTokenIssued}
      trigger="auto"
    />
  )

  // Manual button
  return (
    <GenuineWidgetEmbeddable
      onTokenIssued={handleTokenIssued}
      trigger="manual"
    />
  )

  // Programmatic control
  return (
    <GenuineWidgetEmbeddable
      onTokenIssued={handleTokenIssued}
      trigger="manualStart"
      onStartRef={setStartFunction}
    />
  )
}
```

**Advanced Programmatic Control:**

```tsx
import { useGenuineTrigger } from 'genuine-verify-sdk'

function MyApp() {
  const [startFunction, setStartFunction] = useState(null)
  const [isDetectionActive, setIsDetectionActive] = useState(false)
  const [isModelReady, setIsModelReady] = useState(false)

  const triggerControls = useGenuineTrigger(
    startFunction,
    null, // stopFn
    null, // resetFn
    isDetectionActive,
    isModelReady,
    {
      onStart: () => setIsDetectionActive(true),
      onStop: () => setIsDetectionActive(false)
    }
  )

  const handleFormSubmit = (e) => {
    e.preventDefault()
    triggerControls.startDetection() // Trigger on form submit
  }

  return (
    <form onSubmit={handleFormSubmit}>
      <GenuineWidgetEmbeddable
        onTokenIssued={handleTokenIssued}
        trigger="manualStart"
        onStartRef={setStartFunction}
      />
      <button type="submit">Submit Form</button>
    </form>
  )
}
```

**Trigger Features:**
- ✅ **Auto trigger:** Start detection immediately when widget loads
- ✅ **Manual trigger:** User clicks button to start detection
- ✅ **Manual start:** Programmatic control via start function
- ✅ **useGenuineTrigger hook:** Provides programmatic control methods
- ✅ **Status tracking:** Know when detection is active and model is ready
- ✅ **Event callbacks:** onStart, onStop, onReset callbacks
- ✅ **Flexible integration:** Trigger on form submit, route change, suspicious activity, etc.

---

## 📤 Token Endpoint (Optional)

**POST /api/verify-human**

- **Header:** `Authorization: Bearer <token>`
- **Body:** `{ "token": "<token>" }`

Returns:
```json
{
  "valid": true,
  "reason": null,
  "gestureType": "headTilt",
  "expiresIn": 299,
  "issuedAt": "2025-01-06T20:00:00.000Z"
}
```

---

## 🔧 Example Integration

```tsx
import { GenuineWidgetEmbeddable, verifyToken } from 'genuine-verify-sdk';

function Demo() {
  const [status, setStatus] = useState<string | null>(null);

  const handleTokenIssued = async (payload: {
    token: string;
    metadata: {
      issuedAt: string;
      expiresAt: string;
      gestureType: string;
    };
  }) => {
    const result = await verifyToken(payload.token);
    setStatus(result.valid ? '✅ Valid' : '❌ Invalid');
  };

  return (
    <>
      <GenuineWidgetEmbeddable onTokenIssued={handleTokenIssued} />
      {status && <div>{status}</div>}
    </>
  );
}
```

---

## 📝 Exports

### Components
- `GenuineWidgetEmbeddable` (main widget)

### Utilities
- `verifyToken`, `