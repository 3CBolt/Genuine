# Integration Guide: Frontend + Backend

This guide shows how to connect the frontend demo with the backend `/verify-human` endpoint.

## Setup

1. **Start the backend server:**
   ```bash
   cd examples/backend
   npm install
   npm start
   ```

2. **Start the frontend demo:**
   ```bash
   # In the main project directory
   npm run dev
   ```

3. **Update the frontend to call your backend:**

   In your frontend code, replace the API call to use your local backend:

   ```javascript
   // Instead of calling a remote API, call your local backend
   const response = await fetch('http://localhost:3001/verify-human', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ token: issuedToken })
   });
   
   const result = await response.json();
   console.log('Verification result:', result);
   ```

## Testing the Integration

1. **Open the demo:** http://localhost:3000/embed-test
2. **Complete human verification** in the frontend
3. **Check the backend logs** to see the verification request
4. **Verify the response** shows success/failure

## Example Frontend Integration

```javascript
import { GenuineWidget } from 'genuine-verify-sdk';

function MyComponent() {
  const handleVerification = async (token) => {
    try {
      const response = await fetch('http://localhost:3001/verify-human', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Human verified!');
        // Proceed with your app logic
      } else {
        console.log('❌ Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
    }
  };

  return (
    <GenuineWidget 
      onTokenIssued={handleVerification}
      onError={(error) => console.error('Widget error:', error)}
    />
  );
}
```

## CORS Configuration

If you encounter CORS issues, add this to your backend:

```javascript
const cors = require('cors');
app.use(cors());
```

And install the cors package:
```bash
npm install cors
```

## Production Deployment

For production, replace `http://localhost:3001` with your actual API endpoint:

```javascript
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://your-api.com' 
  : 'http://localhost:3001';

const response = await fetch(`${API_BASE}/verify-human`, {
  // ... rest of the request
});
``` 