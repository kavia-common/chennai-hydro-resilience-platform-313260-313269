import axios from 'axios';
import { supabase } from './supabase';
import { getApiConfig } from '../config/apiConfig';

// PUBLIC_INTERFACE
/**
 * Axios instance configured for CHRIS backend API.
 * Uses centralized configuration from apiConfig to ensure all requests
 * go to HTTPS port 3001 with proper /api/v1/* paths.
 * Authorization token (Supabase JWT) is automatically injected for protected routes.
 */

// Get validated configuration from single source of truth
const config = getApiConfig();
console.log('[API Client] Initializing with config:', config);

// Create axios instance with validated config
const api = axios.create(config);

// Request interceptor to inject Supabase JWT token and log requests
api.interceptors.request.use(
  async (config) => {
    // Capture request start time for latency tracking
    config.metadata = { startTime: Date.now() };
    
    // CRITICAL: Final validation before request is sent
    // Ensure baseURL is HTTPS
    if (config.baseURL && config.baseURL.startsWith('http://')) {
      console.error('[API Client] BLOCKING: HTTP baseURL detected, forcing HTTPS');
      config.baseURL = config.baseURL.replace('http://', 'https://');
    }
    
    // Normalize URL path joining
    if (config.url) {
      // Remove leading slash if baseURL doesn't end with slash and URL starts with slash
      // This prevents double slashes like /api/v1//endpoint
      if (config.baseURL && !config.baseURL.endsWith('/') && config.url.startsWith('/')) {
        config.url = config.url.substring(1);
      }
    }
    
    // Construct full URL for logging
    const fullUrl = config.baseURL + (config.url ? '/' + config.url.replace(/^\/+/, '') : '');
    
    // CRITICAL: Final check - ensure full URL is HTTPS
    if (fullUrl.startsWith('http://')) {
      console.error('[API Client] CRITICAL: HTTP request blocked!');
      console.error('[API Client] baseURL:', config.baseURL);
      console.error('[API Client] url:', config.url);
      console.error('[API Client] fullUrl:', fullUrl);
      throw new Error('Mixed content error: HTTP request from HTTPS page not allowed');
    }
    
    // Log the request
    console.log(`[API Request] ${config.method?.toUpperCase()} ${fullUrl}`);
    if (config.params && Object.keys(config.params).length > 0) {
      console.log('[API Request] Params:', JSON.stringify(config.params));
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

// Response interceptor for error handling and timing
api.interceptors.response.use(
  (response) => {
    // Calculate and log request duration
    if (response.config.metadata?.startTime) {
      const duration = Date.now() - response.config.metadata.startTime;
      const fullUrl = response.config.baseURL + (response.config.url ? '/' + response.config.url.replace(/^\/+/, '') : '');
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${fullUrl} - ${duration}ms - Status: ${response.status}`);
      response.duration = duration;
    }
    return response;
  },
  (error) => {
    // Calculate request duration even for errors
    if (error.config?.metadata?.startTime) {
      const duration = Date.now() - error.config.metadata.startTime;
      const fullUrl = error.config?.baseURL + (error.config?.url ? '/' + error.config.url.replace(/^\/+/, '') : '');
      console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${fullUrl} - ${duration}ms - Status: ${error.response?.status || 'Network Error'}`);
      error.duration = duration;
    }
    
    // Enhanced error logging
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
      console.error('[API Error] Authentication failed - redirecting to login');
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
    } else if (status >= 500) {
      console.error('[API Error] Server error:', status);
      error.serverError = true;
    } else if (status === 404) {
      console.error('[API Error] 404 Not Found');
    }
    
    return Promise.reject(error);
  }
);

export default api;
