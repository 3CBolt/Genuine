# Genuine Verify Widget Usage

## 🚀 Quick Start

The `GenuineWidget` component provides a simple, configurable human verification system that can be embedded in any React application.

### Basic Usage

```tsx
import { GenuineWidget } from '@/components/GenuineWidget'
import { PresenceToken } from '@/lib/genuine-verify/presence'

function App() {
  return (
    <GenuineWidget
      gestureType="headTilt"
      onSuccess={(token: PresenceToken) => {
        console.log('✅ Human Verified!', token)
      }}
      onError={(error: Error) => {
        console.error('❌ Verification failed', error)
      }}
    />
  )
}
```

### Advanced Usage with All Props

```tsx
<GenuineWidget
  gestureType="headTilt"
  onSuccess={(token: PresenceToken) => {
    console.log('✅ Human Verified!', token)
    // Handle successful verification
  }}
  onError={(error: Error) => {
    console.error('❌ Verification failed', error)
    // Handle errors
  }}
  debug={true}
  headTiltThreshold={0.15}
  persist={true}
  showGestureFeedback={true}
/>
```

## 📋 Props Reference

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `gestureType` | `'blink' \| 'headTilt'` | The gesture type to verify |
| `onSuccess` | `(token: PresenceToken) => void` | Callback when verification succeeds |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onError` | `(error: Error) => void` | - | Callback for errors |
| `debug` | `boolean` | `false` | Show debug panel |
| `blinkThreshold` | `number` | `0.2` | Blink detection threshold |
| `headTiltThreshold` | `number` | `15` | Head tilt threshold (degrees) |
| `showGestureFeedback` | `boolean` | `false` | Show visual feedback |
| `persist` | `boolean` | `true` | Persist tokens in localStorage |

## 🎯 Gesture Types

### `headTilt` ✅ (Implemented)
- Detects head tilting left or right
- Configurable threshold via `headTiltThreshold`
- Works with BlazeFace face detection

### `blink` ⚠️ (Coming Soon)
- Currently shows "not implemented" error
- Will detect eye blinking
- Configurable threshold via `blinkThreshold`

## 📦 PresenceToken Object

The `onSuccess` callback receives a `PresenceToken` object:

```ts
interface PresenceToken {
  token: string;           // Unique verification token
  gesture: 'blink' | 'headTilt'; // Gesture that was verified
  issuedAt: string;        // ISO timestamp when issued
  expiresAt: string;       // ISO timestamp when expires
  version: number;         // Token version (currently 1)
}
```

## 🔧 Error Handling

The widget handles various error scenarios:

- **Camera access denied** - Calls `onError` with permission error
- **Model loading failed** - Calls `onError` with loading error
- **Invalid gesture type** - Shows error message
- **Detection failures** - Calls `onError` with detection error

## 🎨 Customization

### Thresholds
```tsx
// More sensitive head tilt detection
<GenuineWidget
  gestureType="headTilt"
  headTiltThreshold={10} // Lower = more sensitive
  onSuccess={handleSuccess}
/>

// Less sensitive head tilt detection  
<GenuineWidget
  gestureType="headTilt"
  headTiltThreshold={20} // Higher = less sensitive
  onSuccess={handleSuccess}
/>
```

### Debug Mode
```tsx
<GenuineWidget
  gestureType="headTilt"
  debug={true} // Shows debug panel with token info
  onSuccess={handleSuccess}
/>
```

### Token Persistence
```tsx
// Skip token persistence (always verify)
<GenuineWidget
  gestureType="headTilt"
  persist={false}
  onSuccess={handleSuccess}
/>

// Use token persistence (default)
<GenuineWidget
  gestureType="headTilt"
  persist={true}
  onSuccess={handleSuccess}
/>
```

## 🧪 Testing

The widget includes comprehensive error handling and validation:

```tsx
// Test error handling
<GenuineWidget
  gestureType="blink" // Will show "not implemented" error
  onSuccess={handleSuccess}
  onError={(error) => {
    console.log('Error:', error.message)
    // Handle gracefully
  }}
/>
```

## 📱 Browser Compatibility

- ✅ Chrome/Chromium (recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ Edge (may have issues)

## 🔒 Privacy

- No data sent to servers
- All processing happens locally
- Tokens are stored locally only
- Camera access is temporary

## 🚀 Production Usage

For production deployment:

1. **Set appropriate thresholds** for your use case
2. **Handle errors gracefully** in your UI
3. **Test on target devices** and browsers
4. **Consider accessibility** for users with disabilities
5. **Implement fallbacks** for unsupported browsers 