/**
 * SINGLE SOURCE OF TRUTH for all backend API configuration.
 * This module provides a centralized, validated API base URL that MUST be used
 * by all API clients to ensure consistent HTTPS requests to port 3001.
 */

// PUBLIC_INTERFACE
/**
 * Get the validated and normalized backend API base URL.
 * Enforces HTTPS protocol and proper port 3001.
 * @returns {string} The complete base URL including protocol, host, and port (WITHOUT /api/v1/ or trailing slash)
 */
export const getApiBaseURL = () => {
  // Priority order: REACT_APP_API_BASE > REACT_APP_BACKEND_URL
  let baseUrl = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL;
  
  if (!baseUrl) {
    console.error('[API Config] No backend URL configured in environment variables!');
    // Fallback - in production this should never happen
    throw new Error('Backend URL not configured');
  }

  // Step 1: Clean up the URL - remove trailing slashes and /api/v1 suffix
  baseUrl = baseUrl.trim().replace(/\/+$/, '');
  baseUrl = baseUrl.replace(/\/api\/v1\/?$/, '');

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
    if (urlObj.protocol !== 'https:') {
      console.warn('[API Config] Forcing HTTPS protocol');
      urlObj.protocol = 'https:';
    }

    // Step 4: Ensure port 3001 (backend port)
    if (!urlObj.port || urlObj.port === '3000' || urlObj.port === '80' || urlObj.port === '443') {
      console.warn('[API Config] Setting backend port to 3001');
      urlObj.port = '3001';
    }

    // Step 5: Construct final URL - origin only (no path, no trailing slash)
    // Format: https://host:3001
    const finalUrl = urlObj.origin;

    // Step 6: Final validation
    if (!finalUrl.startsWith('https://')) {
      throw new Error('Final URL is not HTTPS: ' + finalUrl);
    }
    
    if (!finalUrl.includes(':3001')) {
      throw new Error('Final URL missing port 3001: ' + finalUrl);
    }

    console.log('[API Config] Configured base URL:', finalUrl);
    return finalUrl;

  } catch (error) {
    console.error('[API Config] Failed to parse backend URL:', baseUrl, error);
    throw error;
  }
};

// PUBLIC_INTERFACE
/**
 * Get the API configuration object for axios.
 * @returns {object} Configuration object with baseURL and other settings
 */
export const getApiConfig = () => {
  const baseURL = getApiBaseURL();
  
  return {
    baseURL: baseURL,
    timeout: 120000, // 120 seconds
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false,
  };
};

// Validate on module load and throw error if HTTP
const validatedUrl = getApiBaseURL();
if (validatedUrl.startsWith('http://') && !validatedUrl.startsWith('https://')) {
  const error = new Error('[API Config] CRITICAL: Base URL uses HTTP, not HTTPS! This will cause mixed-content errors.');
  console.error(error.message, 'URL:', validatedUrl);
  throw error;
}

const apiConfig = {
  getApiBaseURL,
  getApiConfig,
};

export default apiConfig;
