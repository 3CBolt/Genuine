/**
 * Sample Express middleware for /verify-human endpoint
 * 
 * This middleware validates tokens issued by the Genuine Verify SDK.
 * Copy this into your Express app to implement server-side token validation.
 */

const express = require('express');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

/**
 * Verify human endpoint
 * 
 * POST /verify-human
 * Body: { "token": "your-token-here" }
 * 
 * Returns:
 * - 200: Token is valid (human verified)
 * - 401: Token is invalid or expired
 * - 400: Missing token in request body
 */
app.post("/verify-human", (req, res) => {
  const { token } = req.body;
  
  // Check if token is provided
  if (!token) {
    return res.status(400).json({
      error: "Missing token in request body",
      message: "Please provide a token in the request body"
    });
  }
  
  try {
    // Import the verifyToken function from the SDK
    const { verifyToken } = require('genuine-verify-sdk');
    
    // Verify the token
    const valid = verifyToken(token);
    
    if (valid) {
      return res.status(200).json({
        success: true,
        message: "Human verification successful"
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Token is invalid or expired"
      });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to verify token"
    });
  }
});

// Optional: Add a GET endpoint for health checks
app.get("/verify-human/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    message: "Verify human endpoint is ready"
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Verify human server running on port ${PORT}`);
  console.log(`POST /verify-human - Validate tokens`);
  console.log(`GET /verify-human/health - Health check`);
});

module.exports = app; 