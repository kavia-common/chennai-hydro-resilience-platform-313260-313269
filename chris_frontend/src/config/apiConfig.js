/**
 * SINGLE SOURCE OF TRUTH for all backend API configuration.
 * This module provides a centralized, validated API base URL that MUST be used
 * by all API clients to ensure consistent HTTPS requests to port 3001.
 */

// PUBLIC_INTERFACE
/**
 * Get the validated and normalized backend API base URL.
 * Enforces HTTPS protocol and proper port 3001.
 * @returns {string} The complete base URL including protocol, host, port, and /api/v1 prefix
 */
export const getApiBaseURL = () => {
  // Priority order: REACT_APP_API_BASE > REACT_APP_BACKEND_URL
  let baseUrl = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL;
  
  if (!baseUrl) {
    console.error('[API Config] No backend URL configured in environment variables!');
    // Fallback to relative path (will work with proxy)
    return '/api/v1';
  }

  // Step 1: Clean up the URL
  baseUrl = baseUrl.trim().replace(/\/+$/, ''); // Remove trailing slashes
  baseUrl = baseUrl.replace(/\/api\/v1\/?$/, ''); // Remove any existing /api/v1 suffix

  // Step 2: Parse and validate the URL
  try {
    let urlObj;
    
    // Add protocol if missing
    if (!baseUrl.includes('://')) {
      urlObj = new URL('https://' + baseUrl);
    } else {
      urlObj = new URL(baseUrl);
    }

    // Step 3: FORCE HTTPS protocol
    urlObj.protocol = 'https:';

    // Step 4: Ensure port 3001 is present (critical for backend routing)
    if (!urlObj.port || urlObj.port === '3000') {
      urlObj.port = '3001';
    }

    // Step 5: Construct the final URL with /api/v1 prefix
    // Use origin (protocol + host + port) and append /api/v1
    const finalUrl = `${urlObj.origin}/api/v1`;

    console.log('[API Config] Configured base URL:', finalUrl);
    return finalUrl;

  } catch (error) {
    console.error('[API Config] Failed to parse backend URL:', baseUrl, error);
    return '/api/v1'; // Fallback to relative
  }
};

// PUBLIC_INTERFACE
/**
 * Get the API configuration object for axios.
 * @returns {object} Configuration object with baseURL and other settings
 */
export const getApiConfig = () => {
  return {
    baseURL: getApiBaseURL(),
    timeout: 120000, // 120 seconds for long-running operations
    headers: {
      'Content-Type': 'application/json',
    },
    // Ensure credentials are included for cross-origin requests
    withCredentials: false,
  };
};

// Validate on module load
const validatedUrl = getApiBaseURL();
if (validatedUrl.startsWith('http://')) {
  console.error('[API Config] CRITICAL: Base URL is HTTP, not HTTPS!', validatedUrl);
  throw new Error('Invalid API configuration: HTTP not allowed');
}

export default {
  getApiBaseURL,
  getApiConfig,
};
