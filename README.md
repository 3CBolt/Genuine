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

## License

MIT
