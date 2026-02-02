import axios from 'axios';
import { supabase } from './supabase';
import { getApiBaseURL } from '../config/apiConfig';

// PUBLIC_INTERFACE
/**
 * Axios instance configured for CHRIS backend API.
 * Uses baseURL + relative paths to ensure proper HTTPS URL construction.
 * All requests MUST use HTTPS to port 3001 to avoid mixed-content errors.
 */

// Get the validated base URL (e.g., https://host:3001)
const BASE_URL = getApiBaseURL();
const API_PREFIX = '/api/v1';

// Construct the full baseURL for axios (e.g., https://host:3001/api/v1)
const FULL_BASE_URL = `${BASE_URL}${API_PREFIX}`;

console.log('[API Client] Backend URL configured:', FULL_BASE_URL);

// Validate that base URL is HTTPS
if (!FULL_BASE_URL.startsWith('https://')) {
  throw new Error('[API Client] CRITICAL: Base URL must use HTTPS, got: ' + FULL_BASE_URL);
}

// Validate port 3001 is present
if (!FULL_BASE_URL.includes(':3001')) {
  throw new Error('[API Client] CRITICAL: Base URL missing port 3001: ' + FULL_BASE_URL);
}

// Create axios instance WITH baseURL set
// This is the correct way to use axios - let it handle URL joining
const api = axios.create({
  baseURL: FULL_BASE_URL,
  timeout: 120000, // 120 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor to inject auth token and log requests
api.interceptors.request.use(
  async (config) => {
    // Start timing
    config.metadata = { startTime: Date.now() };
    
    // Normalize the URL path
    // Remove leading slash if present (baseURL already has the path)
    if (config.url && config.url.startsWith('/')) {
      config.url = config.url.substring(1);
    }
    
    // Remove trailing slash from URL
    if (config.url && config.url.endsWith('/')) {
      config.url = config.url.substring(0, config.url.length - 1);
    }
    
    // Construct the full URL for logging
    const fullUrl = `${FULL_BASE_URL}/${config.url || ''}`;
    
    // Log the request
    console.log(`[API Request] ${config.method?.toUpperCase()} ${fullUrl}`, config.params || '');
    
    // Inject auth token
    try {
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
      const method = error.config?.method?.toUpperCase();
      const url = error.config?.url;
      const status = error.response?.status || 'Network Error';
      
      console.error(`[API Error] ${method} ${url} - ${duration}ms - Status: ${status}`);
      
      // Additional error details
      if (error.message) {
        console.error('[API Error] Message:', error.message);
      }
      if (error.code) {
        console.error('[API Error] Code:', error.code);
      }
      if (error.response?.data) {
        console.error('[API Error] Response data:', error.response.data);
      }
      
      error.duration = duration;
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
