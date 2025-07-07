/**
 * Test script for /verify-human endpoint
 * 
 * Run this after starting the server to test the endpoint
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testEndpoint() {
  console.log('Testing /verify-human endpoint...\n');
  
  // Test 1: Missing token
  console.log('1. Testing missing token:');
  try {
    const response = await fetch(`${BASE_URL}/verify-human`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, data);
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  console.log('\n2. Testing invalid token:');
  try {
    const response = await fetch(`${BASE_URL}/verify-human`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'invalid-token' })
    });
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, data);
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  console.log('\n3. Testing health endpoint:');
  try {
    const response = await fetch(`${BASE_URL}/verify-human/health`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, data);
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  console.log('\n✅ Test completed!');
  console.log('Note: Valid token tests require a real token from the SDK');
}

// Run the test
testEndpoint().catch(console.error); 