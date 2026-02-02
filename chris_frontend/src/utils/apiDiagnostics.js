import api from '../services/api';

/**
 * API diagnostics utilities for testing connectivity and debugging issues.
 * Use these functions to verify API configuration and test endpoints.
 */

// PUBLIC_INTERFACE
/**
 * Test basic API connectivity.
 * @returns {Promise<object>} Diagnostic results
 */
export const testAPIConnection = async () => {
  const results = {
    baseURL: api.defaults.baseURL,
    timestamp: new Date().toISOString(),
    tests: [],
  };
  
  console.log('[API Diagnostics] Starting connectivity tests...');
  console.log('[API Diagnostics] Base URL:', results.baseURL);
  
  // Test 1: Verify base URL is HTTPS
  const isHTTPS = results.baseURL.startsWith('https://');
  results.tests.push({
    name: 'Base URL Protocol',
    passed: isHTTPS,
    message: isHTTPS ? 'Using HTTPS' : 'WARNING: Not using HTTPS!',
    value: results.baseURL.split('://')[0],
  });
  
  // Test 2: Verify base URL contains port 3001
  const hasPort3001 = results.baseURL.includes(':3001');
  results.tests.push({
    name: 'Backend Port',
    passed: hasPort3001,
    message: hasPort3001 ? 'Correct backend port (3001)' : 'WARNING: Missing port 3001',
    value: results.baseURL,
  });
  
  // Test 3: Try a simple GET request (use a lightweight endpoint)
  try {
    const startTime = Date.now();
    const response = await api.get('citywide-risk', { params: { limit: 1 } });
    const duration = Date.now() - startTime;
    
    results.tests.push({
      name: 'API Request',
      passed: response.status === 200,
      message: `Request successful (${duration}ms)`,
      value: response.status,
      duration,
    });
  } catch (error) {
    results.tests.push({
      name: 'API Request',
      passed: false,
      message: error.message || 'Request failed',
      value: error.response?.status || 'Network Error',
      error: {
        message: error.message,
        code: error.code,
        status: error.response?.status,
      },
    });
  }
  
  // Log results
  console.log('[API Diagnostics] Test Results:', results);
  results.tests.forEach(test => {
    const icon = test.passed ? '✓' : '✗';
    console.log(`  ${icon} ${test.name}: ${test.message}`);
  });
  
  return results;
};

// PUBLIC_INTERFACE
/**
 * Log detailed API configuration for debugging.
 */
export const logAPIConfig = () => {
  console.group('[API Diagnostics] Configuration');
  console.log('Base URL:', api.defaults.baseURL);
  console.log('Timeout:', api.defaults.timeout);
  console.log('Headers:', api.defaults.headers);
  console.log('Environment Variables:');
  console.log('  REACT_APP_API_BASE:', process.env.REACT_APP_API_BASE);
  console.log('  REACT_APP_BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);
  console.log('  REACT_APP_FRONTEND_URL:', process.env.REACT_APP_FRONTEND_URL);
  console.log('  NODE_ENV:', process.env.NODE_ENV);
  console.groupEnd();
};

// PUBLIC_INTERFACE
/**
 * Test a specific endpoint with custom parameters.
 * @param {string} method - HTTP method (get, post, etc.)
 * @param {string} endpoint - Endpoint path
 * @param {object} data - Request data/params
 * @returns {Promise<object>} Test result
 */
export const testEndpoint = async (method, endpoint, data = {}) => {
  console.log(`[API Diagnostics] Testing ${method.toUpperCase()} ${endpoint}`);
  
  const result = {
    method,
    endpoint,
    fullURL: `${api.defaults.baseURL}/api/v1/${endpoint}`,
    success: false,
    error: null,
    duration: 0,
    response: null,
  };
  
  try {
    const startTime = Date.now();
    const response = await api[method](endpoint, data);
    result.duration = Date.now() - startTime;
    result.success = true;
    result.response = {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    };
    
    console.log(`[API Diagnostics] ✓ Success (${result.duration}ms)`, response.data);
  } catch (error) {
    result.duration = Date.now() - startTime;
    result.error = {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
    };
    
    console.error(`[API Diagnostics] ✗ Failed (${result.duration}ms)`, error);
  }
  
  return result;
};

export default {
  testAPIConnection,
  logAPIConfig,
  testEndpoint,
};
