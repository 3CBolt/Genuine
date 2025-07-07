# Backend Example: /verify-human API

This example shows how to implement the server-side token validation flow using Express.js.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Test the endpoint:**
   ```bash
   curl -X POST http://localhost:3001/verify-human \
     -H "Content-Type: application/json" \
     -d '{"token": "your-token-here"}'
   ```

## API Endpoints

### POST /verify-human
Validates tokens issued by the Genuine Verify SDK.

**Request:**
```json
{
  "token": "your-token-here"
}
```

**Responses:**
- `200` - Token is valid (human verified)
- `401` - Token is invalid or expired  
- `400` - Missing token in request body
- `500` - Internal server error

### GET /verify-human/health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "message": "Verify human endpoint is ready"
}
```

## Integration

Copy the middleware into your existing Express app:

```javascript
const { verifyToken } = require('genuine-verify-sdk');

app.post("/verify-human", (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: "Missing token" });
  }
  
  const valid = verifyToken(token);
  return res.status(valid ? 200 : 401).json({
    success: valid,
    message: valid ? "Human verified" : "Token invalid"
  });
});
```

## Environment Variables

- `PORT` - Server port (default: 3001)

## Development

Run with auto-reload:
```bash
npm run dev
``` 