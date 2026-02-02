import axios from 'axios';
import { supabase } from './supabase';

// PUBLIC_INTERFACE
/**
 * Axios instance configured for CHRIS backend API.
 * Uses absolute backend URL from environment to ensure requests go to port 3001.
 * Enforces HTTPS protocol and proper path joining for /api/v1/* endpoints.
 * Authorization token (Supabase JWT) is automatically injected for protected routes.
 * Timeout increased to 120s to handle long-running forecast computations.
 */

/**
 * Normalize and construct backend base URL with strict HTTPS enforcement.
 * Ensures the URL always has https://, proper host:port, and /api/v1/ suffix.
 * @returns {string} Fully normalized backend base URL
 */
const getBackendURL = () => {
  // Priority: REACT_APP_API_BASE > REACT_APP_BACKEND_URL > fallback to relative
  let apiBase = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL;
  
  console.log('[API Client] Raw env API_BASE:', process.env.REACT_APP_API_BASE);
  console.log('[API Client] Raw env BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);
  
  if (apiBase) {
    // Step 1: Remove all trailing slashes
    apiBase = apiBase.replace(/\/+$/, '');
    
    // Step 2: Remove any /api/v1 suffix to normalize
    apiBase = apiBase.replace(/\/api\/v1\/?$/, '');
    
    // Step 3: Force HTTPS protocol
    if (apiBase.includes('://')) {
      // Extract the part after protocol
      const parts = apiBase.split('://');
      const protocol = parts[0];
      const rest = parts.slice(1).join('://');
      
      // Force https
      if (protocol.toLowerCase() !== 'https') {
        console.warn(`[API Client] Forcing HTTPS protocol (was: ${protocol})`);
      }
      apiBase = 'https://' + rest;
    } else {
      // No protocol specified, add https://
      console.log('[API Client] No protocol found, adding https://');
      apiBase = 'https://' + apiBase;
    }
    
    // Step 4: Validate the URL structure
    try {
      const urlObj = new URL(apiBase);
      // Reconstruct to ensure proper formatting
      apiBase = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    } catch (err) {
      console.error('[API Client] Invalid URL structure:', apiBase, err);
      // Fallback to relative path
      return '/api/v1/';
    }
    
    // Step 5: Remove any trailing slash again after URL parsing
    apiBase = apiBase.replace(/\/+$/, '');
    
    // Step 6: Append /api/v1/ (with trailing slash for proper joining)
    const finalURL = `${apiBase}/api/v1/`;
    
    console.log('[API Client] Final backend URL:', finalURL);
    return finalURL;
  }
  
  // Fallback to relative path with trailing slash (for local development without env vars)
  console.log('[API Client] No env vars found, using relative path: /api/v1/');
  return '/api/v1/';
};

const baseURL = getBackendURL();
console.log('[API Client] Backend URL configured:', baseURL);

// Validate that baseURL is HTTPS (not relative)
if (baseURL.startsWith('http://')) {
  console.error('[API Client] ERROR: baseURL is using HTTP instead of HTTPS!', baseURL);
}

const api = axios.create({
  baseURL,
  timeout: 120000, // 120 seconds for long-running operations
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Properly join baseURL and endpoint path, handling slashes correctly.
 * @param {string} base - Base URL with or without trailing slash
 * @param {string} path - Endpoint path with or without leading slash
 * @returns {string} Properly joined URL
 */
const joinURL = (base, path) => {
  if (!path) return base;
  
  // Remove trailing slash from base
  const cleanBase = base.replace(/\/+$/, '');
  
  // Ensure path has leading slash
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  
  return cleanBase + cleanPath;
};

// Request interceptor to inject Supabase JWT token and capture timing
api.interceptors.request.use(
  async (config) => {
    // Capture request start time for latency tracking
    config.metadata = { startTime: Date.now() };
    
    // CRITICAL: Ensure we're using HTTPS for absolute URLs
    if (config.baseURL && config.baseURL.startsWith('http://')) {
      console.error('[API Client] BLOCKING HTTP request, forcing HTTPS');
      config.baseURL = config.baseURL.replace('http://', 'https://');
    }
    
    // Normalize the URL path: ensure proper joining with baseURL
    if (config.url) {
      // Remove leading slash if baseURL has trailing slash
      if (config.url.startsWith('/') && config.baseURL && config.baseURL.endsWith('/')) {
        config.url = config.url.substring(1);
      }
      // Add leading slash if baseURL doesn't have trailing slash and url doesn't start with slash
      else if (!config.url.startsWith('/') && config.baseURL && !config.baseURL.endsWith('/')) {
        config.url = '/' + config.url;
      }
      
      // Remove double slashes in the path (but not in protocol)
      const urlPath = config.url.replace(/([^:]\/)\/+/g, '$1');
      if (urlPath !== config.url) {
        console.log('[API Client] Fixed double slashes in URL path:', config.url, '->', urlPath);
        config.url = urlPath;
      }
    }
    
    // Construct the full request URL for logging and validation
    const fullURL = joinURL(config.baseURL || '', config.url || '');
    
    // DEFENSIVE CHECK: Ensure full URL is HTTPS
    if (fullURL.startsWith('http://')) {
      console.error('[API Client] CRITICAL: Full URL is HTTP, this will cause mixed-content error!');
      console.error('[API Client] Base:', config.baseURL, 'Path:', config.url);
      throw new Error('Mixed content blocked: HTTP request from HTTPS page');
    }
    
    console.log(`[API Request] ${config.method?.toUpperCase()} ${fullURL}`);
    
    // Log query params if present
    if (config.params && Object.keys(config.params).length > 0) {
      console.log('[API Request] Query params:', config.params);
    }
    
    try {
      // Get current Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.error('[API Client] Error fetching auth token:', error);
    }
    
    return config;
  },
  (error) => {
    console.error('[API Client] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for comprehensive error handling and timing
api.interceptors.response.use(
  (response) => {
    // Calculate and log request duration
    if (response.config.metadata?.startTime) {
      const duration = Date.now() - response.config.metadata.startTime;
      const fullURL = joinURL(response.config.baseURL || '', response.config.url || '');
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${fullURL} - ${duration}ms - Status: ${response.status}`);
      response.duration = duration;
    }
    return response;
  },
  (error) => {
    // Calculate request duration even for errors
    if (error.config?.metadata?.startTime) {
      const duration = Date.now() - error.config.metadata.startTime;
      const fullURL = joinURL(error.config?.baseURL || '', error.config?.url || '');
      console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${fullURL} - ${duration}ms - Status: ${error.response?.status || 'Network Error'}`);
      error.duration = duration;
    }
    
    // Log the actual error for debugging
    if (error.message) {
      console.error('[API Error] Message:', error.message);
    }
    if (error.code) {
      console.error('[API Error] Code:', error.code);
    }
    
    const status = error.response?.status;
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('[API Error] Request timeout:', error.config?.url);
      error.isTimeout = true;
      error.message = 'Request timeout - the server took too long to respond';
    }
    
    // Handle different error types
    if (status === 401) {
      // Unauthorized - redirect to login
      console.error('[API Error] Authentication failed - redirecting to login');
      window.location.href = '/login';
    } else if (status === 429) {
      // Rate limit exceeded - attach rate limit info to error
      const retryAfter = error.response?.headers['x-ratelimit-reset'];
      error.rateLimitInfo = {
        retryAfter,
        message: 'Rate limit exceeded. Please try again later.',
      };
    } else if (status >= 500) {
      // Server error
      console.error('[API Error] Server error:', error.response?.data);
      error.serverError = true;
    } else if (status === 404) {
      // Log 404 errors with full URL for debugging
      const fullURL = joinURL(error.config?.baseURL || '', error.config?.url || '');
      console.error('[API Error] 404 Not Found:', fullURL);
    }
    
    return Promise.reject(error);
  }
);

export default api;
