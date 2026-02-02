import axios from 'axios';
import { supabase } from './supabase';

// PUBLIC_INTERFACE
/**
 * Axios instance configured for CHRIS backend API.
 * Base URL includes /api/v1 prefix for all endpoints.
 * Authorization token (Supabase JWT) is automatically injected for protected routes.
 */
const api = axios.create({
  baseURL: (process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001') + '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject Supabase JWT token
api.interceptors.request.use(
  async (config) => {
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

// Response interceptor for comprehensive error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    
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
