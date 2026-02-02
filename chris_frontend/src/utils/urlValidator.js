/**
 * URL validation utilities to prevent mixed-content and malformed URL issues.
 * These utilities help ensure all API requests use HTTPS and are properly formatted.
 */

// PUBLIC_INTERFACE
/**
 * Validates that a URL is using HTTPS protocol.
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is HTTPS or relative, false if HTTP
 */
export const isSecureURL = (url) => {
  if (!url) return false;
  
  // Relative URLs are considered secure (will inherit page protocol)
  if (!url.includes('://')) return true;
  
  // Check for https:// protocol
  return url.startsWith('https://');
};

// PUBLIC_INTERFACE
/**
 * Forces a URL to use HTTPS protocol.
 * @param {string} url - URL to convert
 * @returns {string} URL with HTTPS protocol
 */
export const forceHTTPS = (url) => {
  if (!url) return url;
  
  // If no protocol, add https://
  if (!url.includes('://')) {
    return 'https://' + url;
  }
  
  // Replace http:// with https://
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  
  return url;
};

// PUBLIC_INTERFACE
/**
 * Validates and normalizes a URL for API requests.
 * Ensures HTTPS, proper slashes, and no malformed paths.
 * @param {string} url - URL to normalize
 * @returns {string} Normalized URL
 */
export const normalizeURL = (url) => {
  if (!url) return url;
  
  // Force HTTPS
  let normalized = forceHTTPS(url);
  
  // Remove multiple consecutive slashes (except in protocol)
  normalized = normalized.replace(/([^:]\/)\/+/g, '$1');
  
  // Remove trailing slash
  normalized = normalized.replace(/\/+$/, '');
  
  return normalized;
};

// PUBLIC_INTERFACE
/**
 * Joins URL parts ensuring proper slash handling.
 * @param {string} base - Base URL
 * @param {string} path - Path to append
 * @returns {string} Joined URL
 */
export const joinURL = (base, path) => {
  if (!path) return base;
  if (!base) return path;
  
  // Remove trailing slash from base
  const cleanBase = base.replace(/\/+$/, '');
  
  // Ensure path has leading slash
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  
  return cleanBase + cleanPath;
};

// PUBLIC_INTERFACE
/**
 * Logs URL validation errors to help debug mixed-content issues.
 * @param {string} url - URL that failed validation
 * @param {string} context - Context where the error occurred
 */
export const logURLError = (url, context) => {
  console.error(`[URL Validation Error] ${context}`);
  console.error('  URL:', url);
  console.error('  Is Secure:', isSecureURL(url));
  console.error('  Protocol:', url.includes('://') ? url.split('://')[0] : 'relative');
  console.error('  Normalized:', normalizeURL(url));
};

// PUBLIC_INTERFACE
/**
 * Validates all environment variable URLs on app startup.
 * Logs warnings for any insecure URLs found.
 */
export const validateEnvironmentURLs = () => {
  const urlVars = [
    'REACT_APP_API_BASE',
    'REACT_APP_BACKEND_URL',
    'REACT_APP_FRONTEND_URL',
    'REACT_APP_WS_URL',
  ];
  
  console.log('[URL Validator] Checking environment variables...');
  
  urlVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      const isSecure = varName === 'REACT_APP_WS_URL' 
        ? value.startsWith('wss://') || !value.includes('://')
        : isSecureURL(value);
      
      if (!isSecure) {
        console.warn(`[URL Validator] WARNING: ${varName} is not using secure protocol!`);
        console.warn(`  Current: ${value}`);
        console.warn(`  Should be: ${forceHTTPS(value)}`);
      } else {
        console.log(`[URL Validator] ✓ ${varName}: ${value}`);
      }
    }
  });
};

export default {
  isSecureURL,
  forceHTTPS,
  normalizeURL,
  joinURL,
  logURLError,
  validateEnvironmentURLs,
};
