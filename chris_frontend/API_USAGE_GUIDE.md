# API Usage Guide - Best Practices

## Quick Start

Always use the shared API client for backend requests:

```javascript
import api from '../services/api';

// ✓ CORRECT - No leading slash, no trailing slash
const response = await api.get('citywide-risk', {
  params: { limit: 10 }
});

// ✗ WRONG - Don't add leading slash or trailing slash
const response = await api.get('/citywide-risk/');
```

## API Client Features

### Automatic HTTPS Enforcement

The API client automatically:
- Forces HTTPS protocol on all requests
- Validates URLs before sending
- Blocks mixed-content requests
- Logs detailed request/response info

### Automatic Authentication

Supabase JWT tokens are automatically injected into requests:

```javascript
// No need to manually add auth headers
const response = await api.get('forecast');
// Token is added by request interceptor
```

### Error Handling

The API client enriches errors with useful metadata:

```javascript
try {
  const response = await api.post('forecast', data);
} catch (error) {
  // Enhanced error properties
  console.log(error.isTimeout);        // true if request timed out
  console.log(error.serverError);      // true if 5xx error
  console.log(error.rateLimitInfo);    // rate limit details if 429
  console.log(error.duration);         // request duration in ms
}
```

## HTTP Methods

### GET Request

```javascript
// Simple GET
const response = await api.get('citywide-risk');

// GET with query parameters
const response = await api.get('citywide-risk', {
  params: {
    limit: 10,
    year: 2024
  }
});

// GET with timeout override
const response = await api.get('large-dataset', {
  timeout: 300000 // 5 minutes
});
```

### POST Request

```javascript
// POST with JSON body
const response = await api.post('forecast', {
  years: 5,
  include_climate_factors: true
});

// POST with cancellation support
const abortController = new AbortController();
const response = await api.post('forecast', data, {
  signal: abortController.signal
});

// Later: cancel the request
abortController.abort();
```

### PUT/PATCH Request

```javascript
// Update resource
const response = await api.put('zones/123', {
  name: 'Updated Zone Name',
  capacity_score: 8.5
});

// Partial update
const response = await api.patch('zones/123', {
  capacity_score: 8.5
});
```

### DELETE Request

```javascript
// Delete resource
const response = await api.delete('zones/123');
```

## Endpoint Path Conventions

### ✓ CORRECT Patterns

```javascript
// Single resource
api.get('citywide-risk')              // → /api/v1/citywide-risk
api.get('map/sponge-zones')           // → /api/v1/map/sponge-zones

// Resource with ID
api.get(`zones/${id}`)                // → /api/v1/zones/123
api.get(`zones/${id}/details`)        // → /api/v1/zones/123/details

// Nested resources
api.get(`users/${userId}/reports`)    // → /api/v1/users/123/reports
```

### ✗ WRONG Patterns

```javascript
// Don't use leading slash
api.get('/citywide-risk')             // Causes double slash

// Don't use trailing slash
api.get('citywide-risk/')             // Inconsistent with baseURL

// Don't use absolute URLs
api.get('https://backend.com/api')    // Bypasses baseURL config

// Don't construct URLs manually
api.get(`${backendURL}/citywide-risk`) // Use endpoint paths instead
```

## Response Handling

### Successful Response

```javascript
const response = await api.get('citywide-risk');

// Response properties
console.log(response.status);         // 200
console.log(response.statusText);     // "OK"
console.log(response.data);           // Parsed JSON body
console.log(response.headers);        // Response headers
console.log(response.duration);       // Request duration (custom)
```

### Backend Response Format

The backend returns responses in this format:

```javascript
{
  success: true,
  data: { /* actual data */ },
  message: "Operation successful",
  summary: { /* optional summary stats */ }
}
```

Access data like this:

```javascript
const response = await api.get('citywide-risk');
if (response.data?.success) {
  const riskData = response.data.data;
  const summary = response.data.summary;
}
```

## Error Handling Patterns

### Basic Error Handling

```javascript
try {
  const response = await api.get('forecast');
  setPrediction(response.data);
} catch (error) {
  console.error('Failed to fetch forecast:', error);
  setError(error.message);
}
```

### Detailed Error Handling

```javascript
try {
  const response = await api.post('forecast', data);
} catch (error) {
  // Check error type
  if (error.isTimeout) {
    setError('Request timed out. Please try again.');
  } else if (error.response?.status === 401) {
    // Handled automatically by interceptor (redirects to login)
  } else if (error.response?.status === 429) {
    setError('Rate limit exceeded. Please wait.');
    setRateLimitInfo(error.rateLimitInfo);
  } else if (error.serverError) {
    setError('Server error. Please try again later.');
  } else if (!error.response) {
    setError('Network error. Check your connection.');
  } else {
    setError(error.response?.data?.detail || 'Unknown error');
  }
}
```

### Retry Logic

```javascript
const fetchWithRetry = async (endpoint, maxRetries = 3) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await api.get(endpoint);
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx except 429)
      if (error.response?.status >= 400 && 
          error.response?.status < 500 && 
          error.response?.status !== 429) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};
```

## Loading States

### Basic Loading State

```javascript
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    const response = await api.get('citywide-risk');
    setData(response.data);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

### Loading State with Progress

```javascript
const [loading, setLoading] = useState(false);
const [elapsedTime, setElapsedTime] = useState(0);

const fetchData = async () => {
  setLoading(true);
  setElapsedTime(0);
  
  const startTime = Date.now();
  const timer = setInterval(() => {
    setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
  }, 1000);
  
  try {
    const response = await api.get('long-running-task');
    setData(response.data);
  } finally {
    clearInterval(timer);
    setLoading(false);
  }
};
```

## Request Cancellation

### Basic Cancellation

```javascript
const abortControllerRef = useRef(null);

const fetchData = async () => {
  // Cancel previous request if exists
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
  
  // Create new controller
  abortControllerRef.current = new AbortController();
  
  try {
    const response = await api.get('forecast', {
      signal: abortControllerRef.current.signal
    });
    setData(response.data);
  } catch (error) {
    if (error.name === 'CanceledError') {
      console.log('Request was cancelled');
      return; // Don't show error
    }
    setError(error.message);
  }
};

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
}, []);
```

## Configuration Override

### Custom Timeout

```javascript
// Override default 120s timeout for specific request
const response = await api.get('quick-endpoint', {
  timeout: 5000 // 5 seconds
});
```

### Custom Headers

```javascript
const response = await api.post('upload', data, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
```

## Testing & Debugging

### Log API Configuration

```javascript
import { logAPIConfig } from '../utils/apiDiagnostics';

// In browser console or component
logAPIConfig();
```

### Test Connectivity

```javascript
import { testAPIConnection } from '../utils/apiDiagnostics';

const results = await testAPIConnection();
console.log('All tests passed:', results.tests.every(t => t.passed));
```

### Test Specific Endpoint

```javascript
import { testEndpoint } from '../utils/apiDiagnostics';

const result = await testEndpoint('get', 'citywide-risk', { 
  params: { limit: 5 } 
});
```

## Don't Do This

### ❌ Creating Multiple API Clients

```javascript
// Don't create new axios instances
const myApi = axios.create({ baseURL: '...' });
```

Always use the shared client for consistent configuration and error handling.

### ❌ Hardcoding URLs

```javascript
// Don't hardcode backend URLs
const response = await fetch('https://backend.com/api/v1/data');
```

Use the configured API client instead.

### ❌ Manual Auth Headers

```javascript
// Don't manually add auth headers
const token = sessionStorage.getItem('token');
api.get('data', {
  headers: { Authorization: `Bearer ${token}` }
});
```

The interceptor handles this automatically.

### ❌ Ignoring Errors

```javascript
// Don't ignore errors silently
try {
  await api.get('data');
} catch (error) {
  // Empty catch - bad!
}
```

Always log or handle errors appropriately.

## Summary

✓ Use `import api from '../services/api'`  
✓ Use endpoint paths without leading/trailing slashes  
✓ Let interceptors handle auth and HTTPS enforcement  
✓ Handle errors with detailed type checking  
✓ Use AbortController for cancellable requests  
✓ Log errors for debugging  
✓ Check console for [API Request] and [API Error] logs  

For questions or issues, check the console logs or run diagnostic utilities.
