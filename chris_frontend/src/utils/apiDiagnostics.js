import api from '../services/api';
import { getApiBaseURL } from '../config/apiConfig';

/**
 * API diagnostics utilities for testing connectivity and debugging issues.
 * Use these functions to verify API configuration and test endpoints.
 */

// Get the configured backend URL
const getConfiguredBaseURL = () => {
  try {
    const baseURL = getApiBaseURL();
    return `${baseURL}/api/v1`;
  } catch (error) {
    console.error('[API Diagnostics] Failed to get configured base URL:', error);
    return 'CONFIGURATION_ERROR';
  }
};

// PUBLIC_INTERFACE
/**
 * Test basic API connectivity.
 * @returns {Promise<object>} Diagnostic results
 */
export const testAPIConnection = async () => {
  const configuredURL = getConfiguredBaseURL();
  
  const results = {
    configuredURL,
    envVars: {
      REACT_APP_API_BASE: process.env.REACT_APP_API_BASE,
      REACT_APP_BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
    },
    timestamp: new Date().toISOString(),
    tests: [],
  };
  
  console.log('[API Diagnostics] Starting connectivity tests...');
  console.log('[API Diagnostics] Configured URL:', configuredURL);
  
  // Test 1: Verify base URL is HTTPS
  const isHTTPS = configuredURL.startsWith('https://');
  results.tests.push({
    name: 'Base URL Protocol',
    passed: isHTTPS,
    message: isHTTPS ? 'Using HTTPS' : 'WARNING: Not using HTTPS!',
    value: configuredURL.split('://')[0],
  });
  
  // Test 2: Verify base URL contains port 3001
  const hasPort3001 = configuredURL.includes(':3001');
  results.tests.push({
    name: 'Backend Port',
    passed: hasPort3001,
    message: hasPort3001 ? 'Correct backend port (3001)' : 'WARNING: Missing port 3001',
    value: configuredURL,
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
  const configuredURL = getConfiguredBaseURL();
  
  console.group('[API Diagnostics] Configuration');
  console.log('Configured Full URL:', configuredURL);
  console.log('Axios Instance Timeout:', api.defaults.timeout);
  console.log('Axios Instance Headers:', api.defaults.headers);
  console.log('Axios Instance baseURL:', api.defaults.baseURL || '(not set - using absolute URLs)');
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
 * @param {string} endpoint - Endpoint path (without leading slash)
 * @param {object} data - Request data/params
 * @returns {Promise<object>} Test result
 */
export const testEndpoint = async (method, endpoint, data = {}) => {
  console.log(`[API Diagnostics] Testing ${method.toUpperCase()} ${endpoint}`);
  
  const configuredURL = getConfiguredBaseURL();
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  
  const result = {
    method,
    endpoint: cleanEndpoint,
    expectedURL: `${configuredURL}/${cleanEndpoint}`,
    success: false,
    error: null,
    duration: 0,
    response: null,
  };
  
  try {
    const startTime = Date.now();
    const response = await api[method](cleanEndpoint, data);
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
