# Genuine Verify - Privacy-First Human Verification Widget

A real-time, privacy-first human verification widget using React, Next.js, and TensorFlow.js (BlazeFace). Perfect for preventing bots and ensuring genuine human interaction without compromising privacy.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation
```bash
# Clone the repository
git clone https://github.com/[your-repo]/genuine-verify.git
cd genuine-verify

# Install dependencies (preferred)
pnpm install

# Or use npm if needed
npm install

# Start development server
pnpm dev
# or npm run dev
```

Visit `http://localhost:3000` to see the widget in action.

## 🔐 Environment Setup

Currently, no environment variables are required for basic functionality. The widget works entirely client-side for privacy.

If you plan to use the server verification API in production, you may want to add:

```env
# Optional: For production deployments
NEXT_PUBLIC_SITE_URL=http://localhost:3000
PRESENCE_SECRET_KEY=your-hmac-secret-for-token-signing
```

## 🧩 Embed Usage

### Basic Example
```tsx
import { GenuineWidget } from '@/components/GenuineWidget'

function MyApp() {
  return (
    <GenuineWidget
      gestureType="headTilt"
      onSuccess={(token) => {
        console.log("Verification successful:", token)
        // Handle successful verification
      }}
      onError={(error) => {
        console.error("Verification failed:", error)
        // Handle errors
      }}
    />
  )
}
```

### Advanced Example with Manual Trigger
```tsx
import { useState } from 'react'
import { GenuineWidget } from '@/components/GenuineWidget'

function MyApp() {
  const [startFn, setStartFn] = useState(() => () => {})

  return (
    <div>
      <button onClick={startFn}>
        Start Verification
      </button>
      
      <GenuineWidget
        gestureType="headTilt"
        trigger="manual"
        onStartRef={(start) => setStartFn(() => start)}
        onSuccess={(token) => console.log("Token:", token)}
        debug={true}
        persist={true}
      />
    </div>
  )
}
```

## 🧩 Embeddable Widget

The `GenuineWidgetEmbeddable` component provides a simplified API for easy integration:

### Basic Usage
```tsx
import { GenuineWidgetEmbeddable } from 'genuine-verify-sdk'

function MyApp() {
  const handleTokenIssued = (token: string) => {
    console.log('Verification successful:', token)
    // Handle the issued token
  }

  return (
    <GenuineWidgetEmbeddable
      onTokenIssued={handleTokenIssued}
      tokenTTL={300}
      debug={false}
    />
  )
}
```

### Advanced Usage
```tsx
import { GenuineWidgetEmbeddable } from 'genuine-verify-sdk'

function MyApp() {
  const [startFn, setStartFn] = useState(() => () => {})

  return (
    <div>
      <button onClick={startFn}>Start Verification</button>
      
      <GenuineWidgetEmbeddable
        onTokenIssued={(token) => console.log('Token:', token)}
        onError={(error) => console.error('Error:', error)}
        tokenTTL={600} // 10 minutes
        debug={true}
        trigger="manual"
        onStartRef={(start) => setStartFn(() => start)}
        headTiltThreshold={20}
        persist={false}
      />
    </div>
  )
}
```

### Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onTokenIssued` | `(token: string) => void` | - | **Required**. Callback when token is issued |
| `tokenTTL` | `number` | `300` | Token time-to-live in seconds |
| `debug` | `boolean` | `false` | Show debug panel in development |
| `headTiltThreshold` | `number` | `15` | Head tilt angle threshold (degrees) |
| `persist` | `boolean` | `true` | Persist token in sessionStorage |
| `trigger` | `'auto' \| 'manual'` | `'auto'` | When to start detection |
| `onStartRef` | `(startFn: () => void) => void` | - | Get manual start function |
| `onError` | `(error: Error) => void` | - | Error callback |

## ⚙️ Prop Reference

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `gestureType` | `'headTilt'` | - | ✅ | Currently supported gesture type |
| `onSuccess` | `(token: PresenceToken) => void` | - | ✅ | Callback when verification succeeds |
| `onError` | `(error: Error) => void` | - | ❌ | Error callback |
| `debug` | `boolean` | `false` | ❌ | Shows debug panel in development |
| `persist` | `boolean` | `true` | ❌ | Stores token in sessionStorage |
| `trigger` | `'auto' \| 'manual'` | `'auto'` | ❌ | Controls when detection starts |
| `onStartRef` | `(startFn: () => void) => void` | - | ❌ | Exposes manual start trigger function |
| `headTiltThreshold` | `number` | `15` | ❌ | Head tilt angle threshold (degrees) |

### PresenceToken Interface
```typescript
interface PresenceToken {
  token: string
  gesture: 'headTilt'
  issuedAt: string
  expiresAt: string
  version: number
}
```

## 🛡️ Token Verification API

Validate presence tokens server-side using the `/api/verify-human` endpoint.

### API Endpoint
**URL**: `POST /api/verify-human`

### Request Methods

#### 1. Authorization Header
```bash
curl -X POST http://localhost:3000/api/verify-human \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json"
```

#### 2. JSON Body
```bash
curl -X POST http://localhost:3000/api/verify-human \
  -H "Content-Type: application/json" \
  -d '{"token": "<your-token>"}'
```

### Response Format

#### Success Response (200 OK)
```json
{
  "valid": true,
  "reason": null,
  "gestureType": "headTilt",
  "expiresIn": 75,
  "issuedAt": "2025-01-06T20:00:00.000Z"
}
```

#### Error Response (400/401/403)
```json
{
  "valid": false,
  "reason": "Token expired"
}
```

### JavaScript Examples

#### Using fetch
```javascript
// Method 1: Authorization header
const response = await fetch('/api/verify-human', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})

// Method 2: JSON body
const response = await fetch('/api/verify-human', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ token })
})

const result = await response.json()
if (result.valid) {
  console.log('Token is valid!', result)
} else {
  console.log('Token invalid:', result.reason)
}
```

### Optional Features

#### One-Time Use Tokens
Enable single-use validation by adding the `oneTimeUse=true` query parameter:

```bash
curl -X POST "http://localhost:3000/api/verify-human?oneTimeUse=true" \
  -H "Authorization: Bearer <token>"
```

### Error Codes
- **400 Bad Request**: Missing or malformed token
- **401 Unauthorized**: Token expired
- **403 Forbidden**: Token already used (when oneTimeUse=true)
- **500 Internal Server Error**: Server error

## 🚨 Local Testing Tips

### Debug Panel
Enable the debug panel with `debug={true}` to see:
- Real-time FPS and confidence tracking
- Live detection state
- Token status and expiration
- Performance metrics
- Toggle panel visibility with the caret button

### Test Pages
- **Main Demo**: `http://localhost:3000` - Widget with debug panel
- **API Test**: `http://localhost:3000/api-test` - Test the verification API

### Development Features
- **Debug Panel**: Shows live metrics and detection state
- **Manual Trigger**: Test manual start functionality
- **Token Persistence**: Verify tokens are stored correctly
- **Error Handling**: Test various error scenarios

## 🔧 Features

- **Real-time face detection** using TensorFlow.js BlazeFace
- **Head tilt gesture verification** for human verification
- **Presence token system** with optional persistence
- **Embeddable widget** for easy integration
- **Debug panel** for development and testing
- **Privacy-first** - no data sent to servers during detection
- **Server verification** via `/api/verify-human` endpoint
- **Manual trigger mode** for controlled verification flow

## 🛡️ Fallback Handling

The Genuine widget includes a robust fallback system to gracefully handle verification failures and edge cases. This ensures a smooth user experience even when things go wrong (e.g., camera issues, gesture timeouts, or too many failed attempts).

### Why Fallback Matters
If a user can't complete verification (due to technical issues or repeated failures), the fallback system provides clear feedback and lets you offer retry options or custom error UIs.

### Supported Failure Reasons
- `max_attempts_reached`
- `gesture_timeout`
- `camera_error`
- `model_error`
- `unknown`

### Usage Example
```tsx
import { GenuineWidgetEmbeddable } from 'genuine-verify-sdk'

// Custom fallback component
const CustomFallback = ({ failureContext, triggerRetry }) => (
  <div>
    <h2>Verification Failed</h2>
    <p>Reason: {failureContext.reason}</p>
    <button onClick={triggerRetry}>Try Again</button>
  </div>
)

function MyApp() {
  const handleFailure = (context) => {
    console.log('Failure:', context)
  }

  return (
    <GenuineWidgetEmbeddable
      onTokenIssued={token => console.log(token)}
      onFailure={handleFailure}
      fallback={CustomFallback}
      maxAttempts={3}
    />
  )
}
```

- Use the `onFailure` prop to handle failures programmatically.
- Pass a `fallback` component to customize the error UI.
- Use the `triggerRetry` function to let users try again.

### Live Demo
Test fallback scenarios at [`/fallback-test`](http://localhost:3000/fallback-test).

*Failure reporting hooks for analytics coming soon.*

## 📦 Dependencies

### Core Dependencies
```json
{
  "next": "14.0.0",
  "react": "^18",
  "react-dom": "^18",
  "@tensorflow/tfjs": "^4.11.0",
  "@tensorflow-models/blazeface": "^0.1.0",
  "@tensorflow/tfjs-backend-webgl": "^4.11.0",
  "seedrandom": "^3.0.5"
}
```

### Dev Dependencies
```json
{
  "@types/node": "^20",
  "@types/react": "^18", 
  "@types/react-dom": "^18",
  "eslint": "^8",
  "eslint-config-next": "14.0.0",
  "jest": "^29.7.0",
  "@testing-library/react": "^13.4.0",
  "@testing-library/jest-dom": "^6.1.0",
  "typescript": "^5",
  "tailwindcss": "^3.2.7",
  "autoprefixer": "^10.4.14",
  "postcss": "^8.4.21"
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. "next: command not found"
```bash
rm -rf node_modules package-lock.json
pnpm install
```

#### 2. TensorFlow.js loading issues
- Ensure you're using a modern browser with WebGL support
- Check browser console for TensorFlow.js errors
- Try refreshing the page if model loading fails

#### 3. Camera access denied
- Ensure HTTPS in production (required for camera access)
- Check browser permissions for camera access
- Try refreshing the page

#### 4. Debug panel not showing
- Ensure `debug={true}` prop is set
- Check that you're in development mode (`NODE_ENV=development`)
- Verify the widget is mounted correctly

### Fresh Start Commands
```bash
# Complete reset
rm -rf node_modules package-lock.json .next
pnpm install
pnpm dev
```

## 📁 Project Structure

```bash
genuine-verify/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── verify-human/
│   │   │       └── route.ts
│   │   ├── api-test/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── 

## 📦 SDK Package

### Installation

The Genuine Verify SDK is available as an NPM package for easy integration:

```bash
npm install genuine-verify-sdk
```

### SDK Usage

```tsx
import { GenuineWidget } from 'genuine-verify-sdk'

function MyApp() {
  return (
    <GenuineWidget
      gestureType="headTilt"
      onSuccess={(token) => console.log('Verified:', token)}
      onError={(error) => console.error('Error:', error)}
      debug={true}
      persist={true}
    />
  )
}
```

### SDK Development

To work on the SDK locally:

```bash
# Build the SDK
npm run build:sdk

# Watch for changes
npm run dev:sdk

# Test linking
cd packages/genuine-verify-sdk
npm link
cd ../..
npm link genuine-verify-sdk
```

### SDK Structure

## License

MIT

## 📄 Token Utilities

The SDK provides utility functions for token management:

### Creating Tokens
```typescript
import { createPresenceToken } from 'genuine-verify-sdk'

const token = createPresenceToken('headTilt', 300000) // 5 minutes
console.log(token.token) // "uuid-string"
```

### Verifying Tokens
```typescript
import { verifyToken } from 'genuine-verify-sdk'

// Client-side verification
const result = await verifyToken(tokenString)
if (result.valid) {
  console.log('Token valid, expires in:', result.expiresIn, 'seconds')
} else {
  console.log('Token invalid:', result.reason)
}

// Server-side verification
const result = await verifyToken(tokenString, {
  baseUrl: 'https://your-api.com',
  oneTimeUse: true
})
```

### Storage Utilities
```typescript
import { 
  storeToken, 
  getStoredToken, 
  clearStoredToken,
  isStoredTokenValid 
} from 'genuine-verify-sdk'

// Store token
storeToken(tokenString)

// Retrieve token
const token = getStoredToken()

// Check if stored token is valid
const isValid = await isStoredTokenValid()

// Clear token
clearStoredToken()
```

### Development Helpers
```typescript
import { createMockToken } from 'genuine-verify-sdk'

// Create valid mock token
const validToken = createMockToken('headTilt', false)

// Create expired mock token
const expiredToken = createMockToken('headTilt', true)
```

## 🐞 Debugging & Token Copy

When the `debug` prop is enabled on the widget, you’ll see extra developer tools:

- After successful verification, the presence token is displayed with a **Copy** button.
- Clicking **Copy** copies the token to your clipboard and shows a green “Copied!” popup for confirmation.
- The success screen is now more visually readable and responsive.
- The **Clear Token** button in the debug panel now reloads the page after clearing the token for immediate feedback.

**How to Enable Debug Mode:**
```tsx
<GenuineWidget
  gestureType="headTilt"
  onSuccess={...}
  debug={true}
  ...
/>
```
