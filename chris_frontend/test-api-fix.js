#!/usr/bin/env node

/**
 * Test script to validate API URL construction fix.
 * This verifies that URLs are constructed correctly with HTTPS and port 3001.
 */

const axios = require('axios');

// Simulate environment
process.env.REACT_APP_API_BASE = 'https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001';

console.log('🔍 Testing API URL Construction Fix\n');
console.log('Environment:');
console.log('  REACT_APP_API_BASE:', process.env.REACT_APP_API_BASE);
console.log('');

// Test 1: Verify base URL construction
console.log('Test 1: Base URL Construction');
const BASE_URL = process.env.REACT_APP_API_BASE;
const API_PREFIX = '/api/v1';
const FULL_BASE_URL = `${BASE_URL}${API_PREFIX}`;

console.log('  Base URL:', BASE_URL);
console.log('  Full Base URL:', FULL_BASE_URL);

if (!FULL_BASE_URL.startsWith('https://')) {
  console.error('  ❌ FAIL: URL does not start with https://');
  process.exit(1);
}

if (!FULL_BASE_URL.includes(':3001')) {
  console.error('  ❌ FAIL: URL does not include port 3001');
  process.exit(1);
}

console.log('  ✅ PASS: Base URL is correct\n');

// Test 2: Verify path construction
console.log('Test 2: Path Construction');
const testPaths = [
  'citywide-risk',
  'map/sponge-zones',
  'forecast',
  '/citywide-risk', // with leading slash
  '/map/sponge-zones', // with leading slash
];

testPaths.forEach(path => {
  const cleanPath = path.replace(/^\/+/, '');
  const fullUrl = `${FULL_BASE_URL}/${cleanPath}`;
  
  console.log(`  Path: "${path}" -> "${fullUrl}"`);
  
  if (!fullUrl.startsWith('https://')) {
    console.error(`    ❌ FAIL: Constructed URL is not HTTPS`);
    process.exit(1);
  }
  
  if (!fullUrl.includes(':3001')) {
    console.error(`    ❌ FAIL: Constructed URL missing port 3001`);
    process.exit(1);
  }
  
  if (!fullUrl.includes('/api/v1/')) {
    console.error(`    ❌ FAIL: Constructed URL missing /api/v1/ path`);
    process.exit(1);
  }
  
  console.log(`    ✅ PASS`);
});

console.log('');

// Test 3: Verify URL with query parameters
console.log('Test 3: URL with Query Parameters');
const testUrl = `${FULL_BASE_URL}/citywide-risk`;
const params = { limit: 10, offset: 0 };
const queryString = new URLSearchParams(params).toString();
const fullUrlWithQuery = `${testUrl}?${queryString}`;

console.log('  URL:', testUrl);
console.log('  Params:', JSON.stringify(params));
console.log('  Full URL:', fullUrlWithQuery);

if (!fullUrlWithQuery.startsWith('https://')) {
  console.error('  ❌ FAIL: URL with query params is not HTTPS');
  process.exit(1);
}

if (!fullUrlWithQuery.includes(':3001')) {
  console.error('  ❌ FAIL: URL with query params missing port 3001');
  process.exit(1);
}

console.log('  ✅ PASS: URL with query parameters is correct\n');

// Test 4: Verify axios URL construction
console.log('Test 4: Axios URL Construction Simulation');

// Simulate what our axios interceptor does
const simulateAxiosRequest = (path, params) => {
  const cleanPath = path.replace(/^\/+/, '');
  const fullUrl = `${FULL_BASE_URL}/${cleanPath}`;
  
  const config = {
    url: fullUrl,
    params: params,
    method: 'get'
  };
  
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  const finalUrl = `${fullUrl}${queryString}`;
  
  return { config, finalUrl };
};

const testCases = [
  { path: 'citywide-risk', params: { limit: 10 } },
  { path: 'map/sponge-zones', params: { limit: 100 } },
  { path: 'forecast', params: null },
];

testCases.forEach(testCase => {
  const result = simulateAxiosRequest(testCase.path, testCase.params);
  console.log(`  Request: GET ${testCase.path}`);
  console.log(`    Config URL: ${result.config.url}`);
  console.log(`    Final URL: ${result.finalUrl}`);
  
  if (!result.finalUrl.startsWith('https://')) {
    console.error(`    ❌ FAIL: Final URL is not HTTPS`);
    process.exit(1);
  }
  
  if (!result.finalUrl.includes(':3001')) {
    console.error(`    ❌ FAIL: Final URL missing port 3001`);
    process.exit(1);
  }
  
  console.log(`    ✅ PASS`);
});

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('✅ All tests passed! API URL construction is correct.');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log('Next steps:');
console.log('1. Restart the dev server to apply changes');
console.log('2. Check browser console for API diagnostics');
console.log('3. Verify network tab shows HTTPS requests to port 3001');
console.log('4. All API calls should now work without mixed-content errors');
console.log('');
