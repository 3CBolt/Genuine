# Genuine Verify SDK

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

## 🔁 Token Flow

1. **User completes gesture** in widget.
2. **Widget issues a presence token** (JWT-like JSON).
3. **You validate the token**:
   - Client-side: `verifyToken(token)`
   - Server-side: POST to `/api/verify-human` (see below)

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

- `GenuineWidgetEmbeddable` (main widget)
- `verifyToken`, `createPresenceToken`, `getStoredToken`, `storeToken`, `clearStoredToken`, `isStoredTokenValid`, `createMockToken`
- Types: `PresenceToken`, `TokenValidationResult`, etc.

---

## ⏱️ Get Started in <10 Minutes

1. Install the SDK.
2. Add `<GenuineWidgetEmbeddable />` to your app.
3. Handle the token in `onTokenIssued`.
4. Validate the token with `verifyToken()`.

---

For more, see the [full API docs](./src/index.ts) or open an issue!

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
