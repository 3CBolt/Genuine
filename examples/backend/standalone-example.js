/**
 * Minimal /verify-human endpoint for Express
 * 
 * Copy this directly into your Express app:
 */

const express = require('express');
const { verifyToken } = require('genuine-verify-sdk');

const app = express();
app.use(express.json());

// The actual endpoint - copy this into your app
app.post("/verify-human", (req, res) => {
  const token = req.body.token;
  
  if (!token) {
    return res.status(400).json({ error: "Missing token" });
  }
  
  const valid = verifyToken(token);
  return res.status(valid ? 200 : 401).json({
    success: valid,
    message: valid ? "Human verified" : "Token invalid"
  });
});

// Optional: Health check
app.get("/verify-human/health", (req, res) => {
  res.json({ status: "healthy" });
});

// Start server
app.listen(3001, () => {
  console.log("Server running on port 3001");
  console.log("POST /verify-human - Validate tokens");
}); 