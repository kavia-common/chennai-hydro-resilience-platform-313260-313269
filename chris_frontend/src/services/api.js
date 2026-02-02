import axios from 'axios';
import { supabase } from './supabase';
import { getApiBaseURL } from '../config/apiConfig';

// PUBLIC_INTERFACE
/**
 * Axios instance configured for CHRIS backend API.
 * Uses fully absolute URLs to prevent any axios URL resolution issues.
 * All requests MUST use HTTPS to port 3001 to avoid mixed-content errors.
 */

// Get the validated base URL (e.g., https://host:3001)
const BASE_URL = getApiBaseURL().replace(/\/+$/, ''); // Remove trailing slash
const API_PREFIX = '/api/v1';

console.log('[API Client] Backend URL configured:', BASE_URL + API_PREFIX + '/');

// Validate that base URL is HTTPS
if (BASE_URL.startsWith('http://')) {
  throw new Error('[API Client] CRITICAL: Cannot use HTTP base URL in HTTPS context');
}

// Validate port 3001 is present
if (!BASE_URL.includes(':3001')) {
  throw new Error('[API Client] CRITICAL: Base URL missing port 3001: ' + BASE_URL);
}

// Create axios instance WITHOUT baseURL to prevent any automatic URL construction
const api = axios.create({
  timeout: 120000, // 120 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  // CRITICAL: Do NOT set baseURL - we construct absolute URLs manually
});

// Request interceptor to inject auth token and ensure absolute URLs
api.interceptors.request.use(
  async (config) => {
    // Start timing
    config.metadata = { startTime: Date.now() };
    
    // CRITICAL: Construct absolute URL manually to prevent axios from re-parsing
    // Input: config.url = 'citywide-risk' or '/citywide-risk' or 'map/sponge-zones'
    // Output: https://host:3001/api/v1/citywide-risk?param=value
    
    let path = (config.url || '').trim();
    
    // Remove leading slash if present
    if (path.startsWith('/')) {
      path = path.substring(1);
    }
    
    // Remove trailing slash if present
    if (path.endsWith('/')) {
      path = path.substring(0, path.length - 1);
    }
    
    // Build the full URL WITHOUT query params first
    const fullUrlBase = `${BASE_URL}${API_PREFIX}/${path}`;
    
    // CRITICAL FIX: Build URL object to properly encode params
    const urlObj = new URL(fullUrlBase);
    
    // Add query parameters to URL object (ensures proper encoding)
    if (config.params && Object.keys(config.params).length > 0) {
      Object.keys(config.params).forEach(key => {
        const value = config.params[key];
        if (value !== null && value !== undefined) {
          urlObj.searchParams.append(key, String(value));
        }
      });
    }
    
    // Get final URL string from URL object
    const finalUrl = urlObj.toString();
    
    // Final validation - CRITICAL for mixed-content prevention
    if (!finalUrl.startsWith('https://')) {
      throw new Error('[API Client] CRITICAL: Constructed URL is not HTTPS: ' + finalUrl);
    }
    if (!finalUrl.includes(':3001')) {
      throw new Error('[API Client] CRITICAL: Constructed URL missing port 3001: ' + finalUrl);
    }
    
    // Log the request
    console.log(`[API Request] ${config.method?.toUpperCase()} ${finalUrl}`);
    
    // CRITICAL: Set the complete URL and clear fields that axios might use to reconstruct
    config.url = finalUrl;
    config.baseURL = undefined;
    config.params = undefined; // Already encoded in URL
    
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
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms - Status: ${response.status}`)
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
