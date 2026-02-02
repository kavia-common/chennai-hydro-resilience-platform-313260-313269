/**
 * Utility to validate API URL construction and diagnose mixed-content issues.
 * Use this in development to ensure all API calls use correct HTTPS URLs with port 3001.
 */

// PUBLIC_INTERFACE
/**
 * Validate that a URL is properly formatted for HTTPS API calls
 * @param {string} url - The URL to validate
 * @returns {object} Validation result with isValid flag and issues array
 */
export const validateApiUrl = (url) => {
  const issues = [];
  
  if (!url) {
    issues.push('URL is empty or undefined');
    return { isValid: false, issues };
  }
  
  // Check protocol
  if (!url.startsWith('https://')) {
    if (url.startsWith('http://')) {
      issues.push('URL uses HTTP instead of HTTPS - will cause mixed-content error');
    } else {
      issues.push('URL missing protocol');
    }
  }
  
  // Check port 3001
  if (!url.includes(':3001')) {
    issues.push('URL missing port 3001 (backend port)');
  }
  
  // Check API prefix
  if (!url.includes('/api/v1/')) {
    issues.push('URL missing /api/v1/ prefix');
  }
  
  // Check for relative paths (should be absolute)
  if (url.startsWith('/')) {
    issues.push('URL is relative (starts with /) - should be absolute');
  }
  
  // Check for double slashes (except after protocol)
  const pathPart = url.replace(/^https?:\/\//, '');
  if (pathPart.includes('//')) {
    issues.push('URL contains double slashes in path');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    url
  };
};

// PUBLIC_INTERFACE
/**
 * Test API connectivity by making a health check request
 * @param {string} baseUrl - Base URL to test (e.g., https://host:3001)
 * @returns {Promise<object>} Test result with success flag and details
 */
export const testApiConnectivity = async (baseUrl) => {
  const testUrl = `${baseUrl}/api/v1/health`;
  const result = {
    success: false,
    url: testUrl,
    timestamp: new Date().toISOString(),
    error: null,
    status: null,
    duration: null
  };
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      credentials: 'omit'
    });
    
    result.duration = Date.now() - startTime;
    result.status = response.status;
    
    if (response.ok) {
      result.success = true;
      result.data = await response.json();
    } else {
      result.error = `HTTP ${response.status}: ${response.statusText}`;
    }
  } catch (error) {
    result.duration = Date.now() - startTime;
    result.error = error.message;
    
    // Identify error type
    if (error.message.includes('CORS')) {
      result.errorType = 'cors';
    } else if (error.message.includes('Failed to fetch')) {
      result.errorType = 'network';
    } else {
      result.errorType = 'unknown';
    }
  }
  
  return result;
};

// PUBLIC_INTERFACE
/**
 * Log API configuration details for debugging
 * @returns {object} Configuration details
 */
export const logApiConfig = () => {
  const config = {
    envVars: {
      REACT_APP_API_BASE: process.env.REACT_APP_API_BASE,
      REACT_APP_BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
      REACT_APP_FRONTEND_URL: process.env.REACT_APP_FRONTEND_URL,
      REACT_APP_PUBLIC_URL: process.env.REACT_APP_PUBLIC_URL
    },
    window: {
      location: window.location.href,
      protocol: window.location.protocol,
      host: window.location.host,
      port: window.location.port
    },
    timestamp: new Date().toISOString()
  };
  
  console.log('=== API Configuration ===');
  console.log('Environment Variables:', config.envVars);
  console.log('Window Location:', config.window);
  console.log('========================');
  
  return config;
};

export default {
  validateApiUrl,
  testApiConnectivity,
  logApiConfig
};
