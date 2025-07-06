#!/bin/bash

echo "🧪 Testing SDK build..."

# Clean previous build
npm run clean

# Build the SDK
npm run build

# Check if build was successful
if [ -d "dist" ]; then
  echo "✅ Build successful!"
  echo "📁 Build output:"
  ls -la dist/
  
  # Check for required files
  if [ -f "dist/index.js" ] && [ -f "dist/index.mjs" ] && [ -f "dist/index.d.ts" ]; then
    echo "✅ All required files present"
  else
    echo "❌ Missing required build files"
    exit 1
  fi
else
  echo "❌ Build failed"
  exit 1
fi

echo "🎉 SDK build test completed!" 