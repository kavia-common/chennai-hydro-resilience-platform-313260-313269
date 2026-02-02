import axios from 'axios';
import { supabase } from './supabase';

// PUBLIC_INTERFACE
/**
 * Axios instance configured for CHRIS backend API.
 * Base URL includes /api/v1 prefix for all endpoints.
 * Authorization token (Supabase JWT) is automatically injected for protected routes.
 * Timeout increased to 120s to handle long-running forecast computations.
 */
const api = axios.create({
  baseURL: '/api/v1',
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
      console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
      response.duration = duration;
    }
    return response;
  },
  (error) => {
    // Calculate request duration even for errors
    if (error.config?.metadata?.startTime) {
      const duration = Date.now() - error.config.metadata.startTime;
      console.error(`[API Error] ${error.config.method?.toUpperCase()} ${error.config.url} - ${duration}ms`);
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
    }
    
    return Promise.reject(error);
  }
);

export default api;
