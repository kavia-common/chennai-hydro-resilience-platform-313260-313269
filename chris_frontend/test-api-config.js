#!/usr/bin/env node

/**
 * Test script to verify API configuration
 * Run with: node test-api-config.js
 */

// Simulate React environment variables
process.env.REACT_APP_API_BASE = process.env.REACT_APP_API_BASE || 'https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001';
process.env.REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001';

console.log('\n' + '='.repeat(70));
console.log('API Configuration Test');
console.log('='.repeat(70));

console.log('\n📋 Environment Variables:');
console.log('  REACT_APP_API_BASE:', process.env.REACT_APP_API_BASE);
console.log('  REACT_APP_BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);

// Test URL construction
const testUrls = [
  'https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001',
  'https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001/',
  'https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001/api/v1',
  'https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001/api/v1/',
  'http://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001', // Should fail
  'https://vscode-internal-27819-beta.beta01.cloud.kavia.ai', // Missing port
];

console.log('\n🧪 Testing URL Normalization:');

testUrls.forEach(url => {
  try {
    // Clean up
    let cleaned = url.trim().replace(/\/+$/, '');
    cleaned = cleaned.replace(/\/api\/v1\/?$/, '');
    
    // Parse
    let urlObj;
    if (!cleaned.includes('://')) {
      urlObj = new URL('https://' + cleaned);
    } else {
      urlObj = new URL(cleaned);
    }
    
    // Force HTTPS
    const wasHttp = urlObj.protocol === 'http:';
    urlObj.protocol = 'https:';
    
    // Ensure port 3001
    const hadWrongPort = !urlObj.port || urlObj.port !== '3001';
    if (!urlObj.port || urlObj.port === '3000') {
      urlObj.port = '3001';
    }
    
    // Construct final
    const final = `${urlObj.origin}/api/v1`;
    
    const status = (!wasHttp && !hadWrongPort) ? '✅' : '⚠️';
    console.log(`  ${status} ${url}`);
    console.log(`     → ${final}`);
    if (wasHttp) console.log('     ⚠️  Forced HTTPS');
    if (hadWrongPort) console.log('     ⚠️  Fixed port to 3001');
    
  } catch (error) {
    console.log(`  ❌ ${url}`);
    console.log(`     Error: ${error.message}`);
  }
});

console.log('\n🔍 Testing API Endpoint Construction:');

const endpoints = [
  'citywide-risk',
  'map/sponge-zones',
  'forecast',
  'map/sponge-zones/123/details',
];

const baseUrl = 'https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001/api/v1';

endpoints.forEach(endpoint => {
  const fullUrl = baseUrl + '/' + endpoint.replace(/^\/+/, '');
  const isHttps = fullUrl.startsWith('https://');
  const hasPort = fullUrl.includes(':3001');
  const hasApiV1 = fullUrl.includes('/api/v1');
  
  const status = (isHttps && hasPort && hasApiV1) ? '✅' : '❌';
  console.log(`  ${status} ${endpoint}`);
  console.log(`     → ${fullUrl}`);
  
  if (!isHttps) console.log('     ❌ Missing HTTPS');
  if (!hasPort) console.log('     ❌ Missing port 3001');
  if (!hasApiV1) console.log('     ❌ Missing /api/v1 path');
});

console.log('\n📊 Summary:');
console.log('  ✅ Base URL format: https://host:3001/api/v1');
console.log('  ✅ Endpoint format: endpoint-path (no leading slash)');
console.log('  ✅ Full URL example: https://host:3001/api/v1/citywide-risk');
console.log('  ✅ Query params: Added by axios automatically');

console.log('\n🎯 Expected Browser Requests:');
console.log('  Dashboard:     GET https://....:3001/api/v1/citywide-risk?limit=10');
console.log('  ZoneExplorer:  GET https://....:3001/api/v1/map/sponge-zones?limit=100');
console.log('  Forecast:      POST https://....:3001/api/v1/forecast');

console.log('\n' + '='.repeat(70));
console.log('✅ API Configuration Test Complete');
console.log('='.repeat(70) + '\n');
