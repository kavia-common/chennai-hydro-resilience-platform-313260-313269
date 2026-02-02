/**
 * Test script to validate API setup and URL construction.
 * Run this in the browser console or as part of a test suite.
 */

import { getApiBaseURL } from '../config/apiConfig';
import { validateApiUrl, testApiConnectivity, logApiConfig } from './apiUrlValidator';

// PUBLIC_INTERFACE
/**
 * Run comprehensive API setup tests
 * @returns {Promise<object>} Test results
 */
export const runApiTests = async () => {
  console.log('\n🧪 Running API Setup Tests...\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    passed: 0,
    failed: 0,
    warnings: 0
  };
  
  // Test 1: Configuration
  console.log('Test 1: Configuration');
  try {
    const config = logApiConfig();
    results.tests.push({
      name: 'Configuration',
      passed: true,
      details: config
    });
    results.passed++;
    console.log('✓ Configuration logged\n');
  } catch (error) {
    results.tests.push({
      name: 'Configuration',
      passed: false,
      error: error.message
    });
    results.failed++;
    console.error('✗ Configuration error:', error.message, '\n');
  }
  
  // Test 2: Base URL Construction
  console.log('Test 2: Base URL Construction');
  try {
    const baseUrl = getApiBaseURL();
    const validation = validateApiUrl(`${baseUrl}/api/v1/health`);
    
    if (validation.isValid) {
      results.tests.push({
        name: 'Base URL Construction',
        passed: true,
        url: baseUrl
      });
      results.passed++;
      console.log('✓ Base URL is valid:', baseUrl, '\n');
    } else {
      results.tests.push({
        name: 'Base URL Construction',
        passed: false,
        issues: validation.issues
      });
      results.failed++;
      console.error('✗ Base URL has issues:', validation.issues, '\n');
    }
  } catch (error) {
    results.tests.push({
      name: 'Base URL Construction',
      passed: false,
      error: error.message
    });
    results.failed++;
    console.error('✗ Base URL construction error:', error.message, '\n');
  }
  
  // Test 3: Sample Endpoint URLs
  console.log('Test 3: Sample Endpoint URLs');
  const endpoints = [
    'citywide-risk',
    'map/sponge-zones',
    'forecast'
  ];
  
  let allValid = true;
  const baseUrl = getApiBaseURL();
  
  for (const endpoint of endpoints) {
    const url = `${baseUrl}/api/v1/${endpoint}`;
    const validation = validateApiUrl(url);
    
    if (validation.isValid) {
      console.log(`  ✓ ${endpoint}: ${url}`);
    } else {
      console.error(`  ✗ ${endpoint}: ${validation.issues.join(', ')}`);
      allValid = false;
    }
  }
  
  results.tests.push({
    name: 'Sample Endpoint URLs',
    passed: allValid,
    endpoints: endpoints.map(ep => `${baseUrl}/api/v1/${ep}`)
  });
  
  if (allValid) {
    results.passed++;
    console.log('✓ All endpoint URLs are valid\n');
  } else {
    results.failed++;
    console.error('✗ Some endpoint URLs have issues\n');
  }
  
  // Test 4: Connectivity
  console.log('Test 4: Backend Connectivity');
  try {
    const baseUrl = getApiBaseURL();
    const connectivityResult = await testApiConnectivity(baseUrl);
    
    if (connectivityResult.success) {
      results.tests.push({
        name: 'Backend Connectivity',
        passed: true,
        duration: connectivityResult.duration,
        status: connectivityResult.status
      });
      results.passed++;
      console.log(`✓ Backend is reachable (${connectivityResult.duration}ms)\n`);
    } else {
      results.tests.push({
        name: 'Backend Connectivity',
        passed: false,
        error: connectivityResult.error,
        errorType: connectivityResult.errorType
      });
      results.warnings++;
      console.warn(`⚠ Backend connectivity issue: ${connectivityResult.error}\n`);
    }
  } catch (error) {
    results.tests.push({
      name: 'Backend Connectivity',
      passed: false,
      error: error.message
    });
    results.warnings++;
    console.warn(`⚠ Could not test connectivity: ${error.message}\n`);
  }
  
  // Summary
  console.log('=== Test Summary ===');
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Warnings: ${results.warnings}`);
  console.log(`Total: ${results.tests.length}`);
  console.log('===================\n');
  
  return results;
};

// AUTO-RUN in development mode
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Make available globally for console access
  window.runApiTests = runApiTests;
  console.log('💡 API tests available: run window.runApiTests() in console');
}

export default {
  runApiTests
};
