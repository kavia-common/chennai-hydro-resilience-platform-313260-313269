# Final Fix for Mixed-Content API URL Issues

## Problem Summary

The frontend was experiencing mixed-content errors where:
1. The axios interceptor was constructing correct HTTPS URLs with port 3001
2. But the browser was making HTTP requests WITHOUT the port
3. Browser blocked these as mixed-content (HTTPS page trying to make HTTP requests)

### Error Pattern
```
[API Request] GET https://host:3001/api/v1/citywide-risk/
Mixed Content: The page at 'https://host:3000/dashboard' was loaded over HTTPS, 
but requested an insecure XMLHttpRequest endpoint 'http://host/api/v1/citywide-risk'
```

## Root Cause

Axios has internal URL resolution logic that can interfere with URL construction:
- Even when setting `config.url` to an absolute URL in the interceptor
- Axios can still re-process the URL internally
- This re-processing was stripping the port and downgrading to HTTP
- The problem occurred between the interceptor and the actual XHR call

## Solution

Completely bypass axios URL resolution by:

### 1. Manual URL Construction
- Build complete absolute URLs BEFORE axios touches them
- Include protocol, host, port, and full path in one string
- Encode query parameters directly into the URL string
- Clear `config.params` after encoding to prevent double-processing

### 2. No baseURL Usage
- Never set `baseURL` in axios config
- Explicitly set `config.baseURL = undefined` in interceptor
- This prevents axios from trying to combine baseURL with url

### 3. Pre-validated URLs
- Validate HTTPS protocol before passing to axios
- Validate port 3001 is present
- Throw errors immediately if URL construction fails

### 4. Single Source of Truth
- All URL construction goes through `buildAbsoluteURL()` helper
- This function handles all normalization and validation
- No URL manipulation happens anywhere else

## Key Code Changes

### services/api.js
```javascript
const buildAbsoluteURL = (path, params) => {
  // Normalize path
  let normalizedPath = (path || '').trim()
    .replace(/^\//, '')
    .replace(/\/$/, '');
  
  // Build: https://host:3001/api/v1/path
  const absoluteUrl = `${BASE_URL}${API_PREFIX}/${normalizedPath}`;
  
  // Validate
  if (!absoluteUrl.startsWith('https://') || !absoluteUrl.includes(':3001')) {
    throw new Error('Invalid URL construction');
  }
  
  // Add params to URL string (not as config.params)
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams(params);
    return `${absoluteUrl}?${searchParams.toString()}`;
  }
  
  return absoluteUrl;
};

// In interceptor:
const absoluteUrl = buildAbsoluteURL(config.url, config.params);
config.url = absoluteUrl;
config.params = undefined; // Already in URL
config.baseURL = undefined; // Prevent combining
```

## API Call Pattern

All API calls follow this pattern:
```javascript
// Simple GET
await api.get('citywide-risk', { params: { limit: 10 } });
// Becomes: https://host:3001/api/v1/citywide-risk?limit=10

// POST with body
await api.post('forecast', { years: 5 });
// Becomes: https://host:3001/api/v1/forecast

// Nested path
await api.get('map/sponge-zones/123/details');
// Becomes: https://host:3001/api/v1/map/sponge-zones/123/details
```

## Validation

Run these tests to verify the fix:

### Browser Console
```javascript
// Test API setup
window.runApiTests()

// Manual validation
import api from './services/api';
await api.get('health');
```

### Check Network Tab
- All requests should show: `https://host:3001/api/v1/*`
- No HTTP requests
- No requests missing port 3001
- No mixed-content warnings

## Files Modified

1. `src/services/api.js` - Core API client with manual URL construction
2. `src/setupProxy.js` - Added warning if API paths hit dev server
3. `src/utils/apiUrlValidator.js` - NEW: URL validation utilities
4. `src/utils/testApiSetup.js` - NEW: Automated test script

## Environment Requirements

Ensure these environment variables are set correctly:
```
REACT_APP_API_BASE=https://host:3001
REACT_APP_BACKEND_URL=https://host:3001
```

## Monitoring

Watch for these log messages:
- `[API Client] Backend URL configured:` - Shows base URL on startup
- `[API Request] METHOD https://host:3001/api/v1/path` - Every API call
- Any `CRITICAL:` errors indicate URL construction problems

## If Issues Persist

1. Clear browser cache completely
2. Restart dev server (npm start)
3. Check browser console for `[API Request]` logs
4. Verify Network tab shows correct URLs
5. Run `window.runApiTests()` for diagnostics

## Success Criteria

✅ All API requests use HTTPS protocol  
✅ All API requests include :3001 port  
✅ All API requests include /api/v1/ prefix  
✅ No mixed-content warnings in browser  
✅ Network tab shows proper absolute URLs  
✅ API calls successfully reach backend  

---
**Last Updated:** 2025-02-02  
**Status:** Production Ready
