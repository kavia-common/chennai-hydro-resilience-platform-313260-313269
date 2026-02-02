import axios from 'axios';
import { supabase } from './supabase';

// PUBLIC_INTERFACE
/**
 * Axios instance configured for CHRIS backend API.
 * Uses absolute backend URL from environment to ensure requests go to port 3001.
 * Authorization token (Supabase JWT) is automatically injected for protected routes.
 * Timeout increased to 120s to handle long-running forecast computations.
 */

// Get backend URL from environment, ensuring it includes the /api/v1 prefix
const getBackendURL = () => {
  // Priority: REACT_APP_API_BASE > REACT_APP_BACKEND_URL > fallback to relative
  const apiBase = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL;
  
  if (apiBase) {
    // If the URL already includes /api/v1, use it as is
    if (apiBase.endsWith('/api/v1')) {
      return apiBase;
    }
    // Otherwise append /api/v1
    return `${apiBase}/api/v1`;
  }
  
  // Fallback to relative path (for local development without env vars)
  return '/api/v1';
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
    
    // Log the full request URL for debugging
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
      console.error(`[API Error] ${error.config.method?.toUpperCase()} ${fullURL} - ${duration}ms - Status: ${error.response?.status || 'Network Error'}`);
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
