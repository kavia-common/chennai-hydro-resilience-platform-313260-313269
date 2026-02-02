import axios from 'axios';
import { supabase } from './supabase';
import { getApiBaseURL } from '../config/apiConfig';

// PUBLIC_INTERFACE
/**
 * Axios instance configured for CHRIS backend API.
 * Uses centralized configuration from apiConfig to ensure all requests
 * go to HTTPS port 3001 with proper /api/v1/* paths.
 * Authorization token (Supabase JWT) is automatically injected for protected routes.
 */

// Get the validated base URL (without trailing slash for proper URL.resolve behavior)
const BASE_URL = getApiBaseURL().replace(/\/+$/, ''); // Remove trailing slash
console.log('[API Client] Backend URL configured:', BASE_URL);

// Validate that base URL is HTTPS
if (BASE_URL.startsWith('http://')) {
  throw new Error('[API Client] CRITICAL: Cannot use HTTP base URL in HTTPS context');
}

// Validate port 3001 is present
if (!BASE_URL.includes(':3001')) {
  throw new Error('[API Client] CRITICAL: Base URL missing port 3001: ' + BASE_URL);
}

// Create axios instance with strict configuration
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 120 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  // CRITICAL: Disable proxy to prevent URL transformation
  proxy: false,
});

// Request interceptor to inject auth token and validate URLs
api.interceptors.request.use(
  async (config) => {
    // Start timing
    config.metadata = { startTime: Date.now() };
    
    // CRITICAL FIX: Manually construct the full URL to ensure proper HTTPS + port
    // This prevents axios from using URL.resolve which can drop the port
    
    // Normalize the path: ensure it starts with / and is relative to /api/v1/
    let path = config.url || '';
    
    // Remove leading slash if present
    if (path.startsWith('/')) {
      path = path.substring(1);
    }
    
    // Remove trailing slash if present
    if (path.endsWith('/')) {
      path = path.substring(0, path.length - 1);
    }
    
    // Construct the full URL manually: BASE_URL/api/v1/path
    // BASE_URL = https://host:3001
    const fullUrl = `${BASE_URL}/api/v1/${path}`;
    
    // CRITICAL: Override both baseURL and url to prevent axios from recombining them incorrectly
    config.baseURL = BASE_URL;
    config.url = `/api/v1/${path}`;
    
    // Validate the constructed URL
    if (!fullUrl.startsWith('https://')) {
      const error = new Error('CRITICAL: Constructed URL is not HTTPS: ' + fullUrl);
      console.error('[API Client] URL construction error:', {
        baseURL: config.baseURL,
        url: config.url,
        fullUrl: fullUrl,
      });
      throw error;
    }
    
    if (!fullUrl.includes(':3001')) {
      const error = new Error('CRITICAL: Constructed URL missing port 3001: ' + fullUrl);
      console.error('[API Client] URL construction error:', {
        baseURL: config.baseURL,
        url: config.url,
        fullUrl: fullUrl,
      });
      throw error;
    }
    
    // Log the request with params if present
    const urlWithParams = config.params 
      ? `${fullUrl}?${new URLSearchParams(config.params).toString()}`
      : fullUrl;
    
    console.log(`[API Request] ${config.method?.toUpperCase()} ${urlWithParams}`);
    
    try {
      // Get current Supabase session and inject token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.error('[API Client] Error fetching auth token:', error);
      // Continue without token (public endpoints may not require auth)
    }
    
    return config;
  },
  (error) => {
    console.error('[API Client] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
api.interceptors.response.use(
  (response) => {
    // Calculate and log duration
    if (response.config.metadata?.startTime) {
      const duration = Date.now() - response.config.metadata.startTime;
      const baseURL = response.config.baseURL || BASE_URL;
      const path = response.config.url || '';
      const fullUrl = `${baseURL}${path}`;
      const urlWithParams = response.config.params 
        ? `${fullUrl}?${new URLSearchParams(response.config.params).toString()}`
        : fullUrl;
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${urlWithParams} - ${duration}ms - Status: ${response.status}`);
      response.duration = duration;
    }
    return response;
  },
  (error) => {
    // Calculate duration
    if (error.config?.metadata?.startTime) {
      const duration = Date.now() - error.config.metadata.startTime;
      const baseURL = error.config?.baseURL || BASE_URL;
      const path = error.config?.url || '';
      const fullUrl = `${baseURL}${path}`;
      const urlWithParams = error.config?.params 
        ? `${fullUrl}?${new URLSearchParams(error.config.params).toString()}`
        : fullUrl;
      console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${urlWithParams} - ${duration}ms - Status: ${error.response?.status || 'Network Error'}`);
      error.duration = duration;
    }
    
    // Log error details
    if (error.message) {
      console.error('[API Error] Message:', error.message);
    }
    if (error.code) {
      console.error('[API Error] Code:', error.code);
    }
    if (error.response?.data) {
      console.error('[API Error] Response data:', error.response.data);
    }
    
    const status = error.response?.status;
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('[API Error] Request timeout');
      error.isTimeout = true;
      error.message = 'Request timeout - the server took too long to respond';
    }
    
    // Handle specific HTTP status codes
    if (status === 401) {
      console.error('[API Error] Authentication failed');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else if (status === 429) {
      const retryAfter = error.response?.headers['x-ratelimit-reset'];
      error.rateLimitInfo = {
        retryAfter,
        message: 'Rate limit exceeded. Please try again later.',
      };
      console.error('[API Error] Rate limit exceeded');
    } else if (status >= 500) {
      console.error('[API Error] Server error:', status);
      error.serverError = true;
    } else if (status === 404) {
      console.error('[API Error] Resource not found (404)');
    }
    
    return Promise.reject(error);
  }
);

export default api;
