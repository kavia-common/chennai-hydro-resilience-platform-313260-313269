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

// Get the validated base URL (with /api/v1)
const BASE_URL = getApiBaseURL();
console.log('[API Client] Backend URL configured:', BASE_URL);

// Validate that base URL is HTTPS
if (BASE_URL.startsWith('http://')) {
  throw new Error('[API Client] CRITICAL: Cannot use HTTP base URL in HTTPS context');
}

// Create axios instance with strict configuration
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 120 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor to inject auth token and validate URLs
api.interceptors.request.use(
  async (config) => {
    // Start timing
    config.metadata = { startTime: Date.now() };
    
    // CRITICAL FIX: Normalize the URL path
    // Remove leading slash from config.url if present to avoid double slashes
    if (config.url && config.url.startsWith('/')) {
      config.url = config.url.substring(1);
    }
    
    // Remove trailing slash from config.url if present
    if (config.url && config.url.endsWith('/')) {
      config.url = config.url.substring(0, config.url.length - 1);
    }
    
    // CRITICAL: Ensure baseURL is always HTTPS with port 3001
    if (!config.baseURL || !config.baseURL.includes(':3001')) {
      console.error('[API Client] CRITICAL: baseURL missing port 3001, forcing correct URL');
      config.baseURL = BASE_URL;
    }
    
    if (config.baseURL.startsWith('http://')) {
      console.error('[API Client] CRITICAL: HTTP baseURL detected, forcing HTTPS');
      config.baseURL = config.baseURL.replace('http://', 'https://');
    }
    
    // Construct the full URL for logging (without mutating config)
    const fullUrl = config.baseURL + (config.url ? '/' + config.url : '');
    const urlWithParams = config.params 
      ? `${fullUrl}?${new URLSearchParams(config.params).toString()}`
      : fullUrl;
    
    // Final validation: ensure full URL is HTTPS
    if (fullUrl.startsWith('http://')) {
      const error = new Error('Mixed content blocked: HTTP request from HTTPS page');
      console.error('[API Client] BLOCKED HTTP REQUEST:', {
        baseURL: config.baseURL,
        url: config.url,
        fullUrl: fullUrl,
      });
      throw error;
    }
    
    // Log the request
    console.log(`[API Request] ${config.method?.toUpperCase()} ${fullUrl}`);
    if (config.params && Object.keys(config.params).length > 0) {
      console.log('[API Request] Query params:', config.params);
    }
    
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
      const fullUrl = response.config.baseURL + (response.config.url ? '/' + response.config.url : '');
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${fullUrl} - ${duration}ms - Status: ${response.status}`);
      response.duration = duration;
    }
    return response;
  },
  (error) => {
    // Calculate duration
    if (error.config?.metadata?.startTime) {
      const duration = Date.now() - error.config.metadata.startTime;
      const fullUrl = error.config?.baseURL 
        ? error.config.baseURL + (error.config.url ? '/' + error.config.url : '')
        : 'unknown';
      console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${fullUrl} - ${duration}ms - Status: ${error.response?.status || 'Network Error'}`);
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
