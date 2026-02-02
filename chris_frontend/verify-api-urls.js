/**
 * Verification script to test API URL construction
 * Run with: node verify-api-urls.js
 */

// Simulate the fixed getBackendURL function
const getBackendURL = (apiBase) => {
  if (apiBase) {
    // If the URL already includes /api/v1, ensure trailing slash
    if (apiBase.endsWith('/api/v1')) {
      return `${apiBase}/`;
    }
    if (apiBase.endsWith('/api/v1/')) {
      return apiBase;
    }
    return `${apiBase}/api/v1/`;
  }
  return '/api/v1/';
};

// Test cases
const testCases = [
  {
    input: 'https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001',
    expected: 'https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001/api/v1/'
  },
  {
    input: 'https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001/api/v1',
    expected: 'https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001/api/v1/'
  },
  {
    input: 'https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001/api/v1/',
    expected: 'https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001/api/v1/'
  }
];

// Endpoint concatenation tests
const endpoints = [
  { path: 'forecast/', expected: '/api/v1/forecast/' },
  { path: 'citywide-risk', expected: '/api/v1/citywide-risk' },
  { path: 'map/sponge-zones', expected: '/api/v1/map/sponge-zones' },
  { path: 'map/sponge-zones/Z001/details', expected: '/api/v1/map/sponge-zones/Z001/details' }
];

console.log('=== API URL Construction Verification ===\n');

console.log('Test 1: Base URL Construction');
console.log('--------------------------------');
let allPassed = true;

testCases.forEach((test, index) => {
  const result = getBackendURL(test.input);
  const passed = result === test.expected;
  allPassed = allPassed && passed;
  
  console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Input:    ${test.input}`);
  console.log(`  Expected: ${test.expected}`);
  console.log(`  Got:      ${result}`);
  console.log();
});

console.log('\nTest 2: Full URL Construction');
console.log('--------------------------------');
const baseURL = getBackendURL('https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001/api/v1');

endpoints.forEach((endpoint, index) => {
  // Simulate axios URL concatenation
  const fullURL = baseURL + endpoint.path;
  const expectedFull = 'https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001' + endpoint.expected;
  const passed = fullURL === expectedFull;
  allPassed = allPassed && passed;
  
  console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Endpoint: ${endpoint.path}`);
  console.log(`  Expected: ${expectedFull}`);
  console.log(`  Got:      ${fullURL}`);
  console.log();
});

console.log('=================================');
console.log(`Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
console.log('=================================\n');

if (allPassed) {
  console.log('✅ API URL construction is working correctly!');
  console.log('✅ All endpoints will hit the correct backend routes.');
  process.exit(0);
} else {
  console.log('❌ API URL construction has issues.');
  console.log('❌ Please review the getBackendURL function.');
  process.exit(1);
}
