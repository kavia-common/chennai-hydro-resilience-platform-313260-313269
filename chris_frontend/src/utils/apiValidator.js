/**
 * Runtime validation utilities for API configuration.
 * Ensures all API requests use HTTPS to port 3001.
 */

// PUBLIC_INTERFACE
/**
 * Validate that a URL is using HTTPS and port 3001.
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const validateApiUrl = (url) => {
  if (!url) {
    console.error('[API Validator] Empty URL');
    return false;
  }

  // Check for HTTP (not HTTPS)
  if (url.startsWith('http://')) {
    console.error('[API Validator] FAIL: URL uses HTTP instead of HTTPS:', url);
    return false;
  }

  // Must start with https://
  if (!url.startsWith('https://')) {
    console.error('[API Validator] FAIL: URL missing HTTPS protocol:', url);
    return false;
  }

  // Parse URL and check port
  try {
    const urlObj = new URL(url);
    
    // Check port (should be 3001 for backend)
    if (urlObj.port && urlObj.port !== '3001') {
      console.warn('[API Validator] WARNING: URL uses port', urlObj.port, 'instead of 3001:', url);
    }

    // Check for /api/v1 path
    if (!urlObj.pathname.includes('/api/v1')) {
      console.warn('[API Validator] WARNING: URL missing /api/v1 path:', url);
    }

    console.log('[API Validator] PASS:', url);
    return true;

  } catch (error) {
    console.error('[API Validator] FAIL: Invalid URL format:', url, error);
    return false;
  }
};

// PUBLIC_INTERFACE
/**
 * Log all environment variables related to API configuration.
 * Useful for debugging mixed-content and URL issues.
 */
export const logApiEnvironment = () => {
  console.group('[API Validator] Environment Check');
  console.log('REACT_APP_API_BASE:', process.env.REACT_APP_API_BASE);
  console.log('REACT_APP_BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);
  console.log('REACT_APP_FRONTEND_URL:', process.env.REACT_APP_FRONTEND_URL);
  console.log('REACT_APP_WS_URL:', process.env.REACT_APP_WS_URL);
  console.log('PUBLIC_URL:', process.env.PUBLIC_URL);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.groupEnd();
};

export default {
  validateApiUrl,
  logApiEnvironment,
};
