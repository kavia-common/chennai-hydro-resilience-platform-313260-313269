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

// Get the validated base URL (with /api/v1/ and trailing slash)
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
  // CRITICAL: Prevent axios from using a proxy or transforming URLs
  proxy: false,
  // Ensure params are serialized correctly
  paramsSerializer: {
    serialize: (params) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          searchParams.append(key, value);
        }
      });
      return searchParams.toString();
    }
  }
});

// Request interceptor to inject auth token and validate URLs
api.interceptors.request.use(
  async (config) => {
    // Start timing
    config.metadata = { startTime: Date.now() };
    
    // CRITICAL FIX: Normalize the URL path
    // Remove leading slash from config.url if present (baseURL already has trailing slash)
    if (config.url && config.url.startsWith('/')) {
      config.url = config.url.substring(1);
    }
    
    // Remove trailing slash from config.url if present
    if (config.url && config.url.endsWith('/')) {
      config.url = config.url.substring(0, config.url.length - 1);
    }
    
    // CRITICAL: Force baseURL to always be our validated URL
    config.baseURL = BASE_URL;
    
    // Validate baseURL hasn't been corrupted
    if (!config.baseURL.includes(':3001')) {
      console.error('[API Client] CRITICAL: baseURL missing port 3001, forcing correct URL');
      config.baseURL = BASE_URL;
    }
    
    if (config.baseURL.startsWith('http://')) {
      console.error('[API Client] CRITICAL: HTTP baseURL detected, forcing HTTPS');
      config.baseURL = config.baseURL.replace('http://', 'https://');
    }
    
    // Construct the full URL for logging and validation
    // baseURL ends with '/', config.url doesn't start with '/'
    const fullUrl = config.baseURL + (config.url || '');
    
    // Final validation: ensure full URL is HTTPS with port 3001
    if (fullUrl.startsWith('http://')) {
      const error = new Error('Mixed content blocked: HTTP request from HTTPS page');
      console.error('[API Client] BLOCKED HTTP REQUEST:', {
        baseURL: config.baseURL,
        url: config.url,
        fullUrl: fullUrl,
      });
      throw error;
    }
    
    if (!fullUrl.includes(':3001/api/v1')) {
      console.error('[API Client] WARNING: URL missing port 3001 or /api/v1 path:', fullUrl);
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
      const fullUrl = response.config.baseURL + (response.config.url || '');
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
      const fullUrl = error.config?.baseURL 
        ? error.config.baseURL + (error.config.url || '')
        : 'unknown';
      const urlWithParams = error.config?.params 
        ? `${fullUrl}?${new URLSearchParams(error.config.params).toString()}`
        : fullUrl;
      console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${urlWithParams} - ${duration}ms - Status: ${error.response?.status || 'Network Error'}`)
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
