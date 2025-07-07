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

## 🛡️ Fallback Strategy

Handle gesture detection failures gracefully:

```tsx
import { GenuineWidgetEmbeddable } from 'genuine-verify-sdk'

// Custom fallback component
const CustomFallback = ({ failureContext, triggerRetry }) => (
  <div>
    <h2>Verification Failed</h2>
    <p>Attempts: {failureContext.attempts}/{failureContext.maxAttempts}</p>
    <button onClick={triggerRetry}>Try Again</button>
  </div>
)

function MyApp() {
  const handleFailure = (context) => {
    console.log('Failed after', context.attempts, 'attempts')
    console.log('Reason:', context.reason)
  }

  return (
    <GenuineWidgetEmbeddable
      onTokenIssued={handleTokenIssued}
      onFailure={handleFailure}
      maxAttempts={5}
      fallback={CustomFallback}
    />
  )
}
```

**Fallback Features:**
- ✅ **onFailure callback:** Get structured failure context with reason, attempts, and error details
- ✅ **maxAttempts prop:** Configure attempts before fallback (default: 3)
- ✅ **Custom fallback component:** Pass your own React component for custom error UI
- ✅ **triggerRetry function:** Exposed retry handler for "Try Again" buttons
- ✅ **Default fallback UI:** Built-in error display when no custom component provided

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
- `verifyToken`, `createPresenceToken`, `getStoredToken`, `storeToken`, `clearStoredToken`, `isStoredTokenValid`, `createMockToken`

### Hooks
- `useVerificationStatus` - Real-time verification status
- `useGenuineTrigger` - Programmatic trigger control
- `useGenuineAnalytics` - Development analytics
- `useTokenTTL` - Token expiration management
- `usePresenceToken` - Token management
- `useGenuineDetection` - Detection state management

### Types
- `PresenceToken`, `TokenValidationResult`, `FailureContext`, etc.

---

## ⏱️ Get Started in <10 Minutes

1. Install the SDK: `npm install genuine-verify-sdk`
2. Add `<GenuineWidgetEmbeddable />` to your app
3. Handle the token in `onTokenIssued`
4. Validate the token with `verifyToken()`

---

## 🛠️ TypeScript Configuration Notes

If you use TypeScript and want to avoid React import warnings, make sure your `tsconfig.json` includes these settings:

```json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

This is needed because of how TypeScript handles default imports from CommonJS modules like React. Most modern React/TypeScript setups already have these enabled by default.

---

## 📊 Analytics (Dev Only)

Track real-time detection analytics in development with the `useGenuineAnalytics` hook.

```tsx
import { useGenuineAnalytics } from 'genuine-verify-sdk'

function AnalyticsPanel() {
  // You need to pass detection state from your widget
  const detectionState: AnalyticsDetectionState = {
    isCameraActive: false,
    gestureMatched: false,
    detectionState: 'idle',
    fps: 0
  }
  
  const { successCount, failureCount, attemptCount, fps, lastEvent, clear } = useGenuineAnalytics(detectionState, {
    persist: false, // Set true to persist to localStorage
    logToConsole: true // Set false to disable console logs
  })

  return (
    <div>
      <h3>Analytics (Dev Only)</h3>
      <ul>
        <li>Successes: {successCount}</li>
        <li>Failures: {failureCount}</li>
        <li>Attempts: {attemptCount}</li>
        <li>FPS: {fps}</li>
        <li>Last Event: {lastEvent}</li>
      </ul>
      <button onClick={clear}>Clear Analytics</button>
    </div>
  )
}
```

**Features:**
- ✅ Real-time updates for detection attempts, successes, failures, and FPS
- ✅ Lightweight, no server calls
- ✅ Console logging (dev only)
- ✅ Optional localStorage persistence (dev only)

**Usage Notes:**
- Analytics are only active in development (`NODE_ENV !== 'production'`).
- No data is sent to any server—everything is client-side.
- For privacy and performance, do **not** use analytics in production or for user-facing metrics.
- You can disable console logging or localStorage with the hook options.
- To extend analytics (e.g., custom events), use the `log` function returned by the hook.

**Warning:**
> Overuse of analytics in production can impact privacy and performance. This hook is intended for development and debugging only. Do not use for user tracking or telemetry.

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

For more information, visit our [GitHub repository](https://github.com/3CBolt/Genuine) or [report an issue](https://github.com/3CBolt/Genuine/issues).
