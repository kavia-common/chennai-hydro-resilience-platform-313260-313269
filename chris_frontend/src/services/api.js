import axios from 'axios';
import { supabase } from './supabase';
import { getApiBaseURL } from '../config/apiConfig';

// PUBLIC_INTERFACE
/**
 * Axios instance configured for CHRIS backend API.
 * Uses fully absolute URLs with manual construction to prevent axios URL resolution issues
 * that cause mixed-content errors (HTTP vs HTTPS, missing ports).
 * Authorization token (Supabase JWT) is automatically injected for protected routes.
 */

// Get the validated base URL (e.g., https://host:3001)
const BASE_URL = getApiBaseURL().replace(/\/+$/, ''); // Remove trailing slash
const API_PREFIX = '/api/v1';
console.log('[API Client] Backend URL configured:', BASE_URL);
console.log('[API Client] Full API base:', `${BASE_URL}${API_PREFIX}`);

// Validate that base URL is HTTPS
if (BASE_URL.startsWith('http://')) {
  throw new Error('[API Client] CRITICAL: Cannot use HTTP base URL in HTTPS context');
}

// Validate port 3001 is present
if (!BASE_URL.includes(':3001')) {
  throw new Error('[API Client] CRITICAL: Base URL missing port 3001: ' + BASE_URL);
}

// Helper function to construct absolute URL
const buildAbsoluteURL = (path, params) => {
  // Normalize path - remove leading/trailing slashes
  let normalizedPath = (path || '').trim();
  if (normalizedPath.startsWith('/')) {
    normalizedPath = normalizedPath.substring(1);
  }
  if (normalizedPath.endsWith('/')) {
    normalizedPath = normalizedPath.substring(0, normalizedPath.length - 1);
  }
  
  // Build absolute URL: https://host:3001/api/v1/path
  const absoluteUrl = `${BASE_URL}${API_PREFIX}/${normalizedPath}`;
  
  // Validate
  if (!absoluteUrl.startsWith('https://')) {
    throw new Error('CRITICAL: Constructed URL is not HTTPS: ' + absoluteUrl);
  }
  if (!absoluteUrl.includes(':3001')) {
    throw new Error('CRITICAL: Constructed URL missing port 3001: ' + absoluteUrl);
  }
  
  // Add query params if present
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== null && value !== undefined) {
        searchParams.append(key, value);
      }
    });
    return `${absoluteUrl}?${searchParams.toString()}`;
  }
  
  return absoluteUrl;
};

// Create axios instance WITHOUT baseURL
const api = axios.create({
  timeout: 120000, // 120 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  // CRITICAL: Do NOT set baseURL - we use absolute URLs
});

// Request interceptor to inject auth token and ensure absolute URLs
api.interceptors.request.use(
  async (config) => {
    // Start timing
    config.metadata = { startTime: Date.now() };
    
    // CRITICAL: Build absolute URL manually and replace config.url
    // Extract params from config
    const params = config.params;
    
    // Build the absolute URL
    const absoluteUrl = buildAbsoluteURL(config.url, params);
    
    // Log for debugging
    console.log(`[API Request] ${config.method?.toUpperCase()} ${absoluteUrl}`);
    
    // CRITICAL: Replace the URL with absolute URL and clear params (already in URL)
    config.url = absoluteUrl;
    config.params = undefined; // Already encoded in URL
    config.baseURL = undefined; // Explicitly clear to prevent axios combining
    
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
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms - Status: ${response.status}`);
      response.duration = duration;
    }
    return response;
  },
  (error) => {
    // Calculate duration
    if (error.config?.metadata?.startTime) {
      const duration = Date.now() - error.config.metadata.startTime;
      console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${duration}ms - Status: ${error.response?.status || 'Network Error'}`);
      error.duration = duration;
      
      // Log error for monitoring
      if (process.env.NODE_ENV === 'development') {
        logApiCall({
          method: error.config?.method?.toUpperCase(),
          url: error.config?.url,
          path: error.config?.url?.replace(BASE_URL, ''),
          status: error.response?.status || 'Network Error',
          duration: duration,
          success: false,
          error: error.message
        });
      }
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
