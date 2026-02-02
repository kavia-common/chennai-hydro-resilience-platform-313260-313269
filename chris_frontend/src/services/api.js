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

// Get backend URL from environment, ensuring HTTPS and proper /api/v1 prefix
const getBackendURL = () => {
  // Priority: REACT_APP_API_BASE > REACT_APP_BACKEND_URL > fallback to relative
  let apiBase = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL;
  
  if (apiBase) {
    // Normalize the URL: remove trailing slashes first
    apiBase = apiBase.replace(/\/+$/, '');
    
    // Force HTTPS protocol if URL contains a protocol
    if (apiBase.includes('://')) {
      apiBase = apiBase.replace(/^http:\/\//i, 'https://');
      // Ensure it starts with https://
      if (!apiBase.startsWith('https://')) {
        apiBase = 'https://' + apiBase.replace(/^[^:]+:\/\//, '');
      }
    } else {
      // If no protocol, assume https
      apiBase = 'https://' + apiBase;
    }
    
    // Check if /api/v1 is already in the path
    if (apiBase.includes('/api/v1')) {
      // Remove /api/v1 suffix if present to normalize
      apiBase = apiBase.replace(/\/api\/v1\/?$/, '');
    }
    
    // Always append /api/v1/ with trailing slash for proper path joining
    return `${apiBase}/api/v1/`;
  }
  
  // Fallback to relative path with trailing slash (for local development without env vars)
  return '/api/v1/';
};

const baseURL = getBackendURL();
console.log('[API Client] Backend URL configured:', baseURL);

const api = axios.create({
  baseURL,
  timeout: 120000, // 120 seconds for long-running operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject Supabase JWT token and capture timing
api.interceptors.request.use(
  async (config) => {
    // Capture request start time for latency tracking
    config.metadata = { startTime: Date.now() };
    
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
    }
    
    // Force HTTPS protocol for absolute URLs (catch any http:// that might slip through)
    if (config.baseURL && config.baseURL.startsWith('http://')) {
      config.baseURL = config.baseURL.replace('http://', 'https://');
      console.warn('[API] Forced HTTPS protocol for baseURL:', config.baseURL);
    }
    
    // Construct and log the full request URL for debugging
    const fullURL = config.baseURL + (config.url || '');
    console.log(`[API Request] ${config.method?.toUpperCase()} ${fullURL}`);
    
    try {
      // Get current Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.error('Error fetching auth token:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for comprehensive error handling and timing
api.interceptors.response.use(
  (response) => {
    // Calculate and log request duration
    if (response.config.metadata?.startTime) {
      const duration = Date.now() - response.config.metadata.startTime;
      console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms - Status: ${response.status}`);
      response.duration = duration;
    }
    return response;
  },
  (error) => {
    // Calculate request duration even for errors
    if (error.config?.metadata?.startTime) {
      const duration = Date.now() - error.config.metadata.startTime;
      const fullURL = error.config.baseURL + (error.config.url || '');
      console.error(`[API Error] ${error.config.method?.toUpperCase()} ${fullURL} - ${duration}ms - Status: ${error.response?.status || 'Network Error'}`)
      error.duration = duration;
    }
    
    const status = error.response?.status;
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('Request timeout:', error.config?.url);
      error.isTimeout = true;
      error.message = 'Request timeout - the server took too long to respond';
    }
    
    // Handle different error types
    if (status === 401) {
      // Unauthorized - redirect to login
      console.error('Authentication failed - redirecting to login');
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
      console.error('Server error:', error.response?.data);
      error.serverError = true;
    } else if (status === 404) {
      // Log 404 errors with full URL for debugging
      const fullURL = error.config?.baseURL + (error.config?.url || '');
      console.error('404 Not Found:', fullURL);
    }
    
    return Promise.reject(error);
  }
);

export default api;
