# API URL Construction Fix - Complete

## Problem Identified

The frontend was experiencing mixed-content errors because:
1. API client logged correct HTTPS URL with port: `https://host:3001/api/v1/citywide-risk/`
2. But browser made HTTP requests WITHOUT port: `http://host/api/v1/citywide-risk?limit=10`

This occurred when axios added query parameters, suggesting URL reconstruction was dropping the port and protocol.

## Root Cause

The issue was with how axios combines `baseURL` and `url` when both have slashes:
- Old baseURL: `https://host:3001/api/v1/` (with trailing slash)
- Old url: `citywide-risk/` or `/citywide-risk`
- When params were added, axios's URL.resolve logic would sometimes drop the port

## Solution Implemented

### 1. **Updated apiConfig.js**
- Changed to return baseURL WITHOUT `/api/v1/` path and WITHOUT trailing slash
- Now returns: `https://host:3001` (just origin)
- This prevents axios URL.resolve issues

### 2. **Updated api.js Request Interceptor**
- Manually constructs full URL: `${BASE_URL}/api/v1/${path}`
- Validates HTTPS protocol at multiple checkpoints
- Validates port 3001 presence
- Sets both `config.baseURL` and `config.url` explicitly to prevent axios recombination

### 3. **Updated All API Calls**
- Dashboard.js: `api.get('citywide-risk', { params: ... })`
- ZoneExplorer.js: `api.get('map/sponge-zones', { params: ... })`
- Forecast.js: `api.post('forecast', { ... })`
- All use clean paths without leading/trailing slashes

## Key Changes

### apiConfig.js
```javascript
// OLD: returned https://host:3001/api/v1/
// NEW: returns https://host:3001
export const getApiBaseURL = () => {
  // ... validation logic ...
  const finalUrl = urlObj.origin; // No path, no trailing slash
  return finalUrl;
};
```

### api.js
```javascript
// BASE_URL = https://host:3001 (no trailing slash, no /api/v1/)
const BASE_URL = getApiBaseURL().replace(/\/+$/, '');

// Request interceptor manually constructs full URL
api.interceptors.request.use(async (config) => {
  let path = config.url || '';
  path = path.replace(/^\/+/, '').replace(/\/+$/, ''); // Clean path
  
  // Manually construct: https://host:3001/api/v1/path
  const fullUrl = `${BASE_URL}/api/v1/${path}`;
  
  // Override both to prevent axios from recombining incorrectly
  config.baseURL = BASE_URL;
  config.url = `/api/v1/${path}`;
  
  // Validate HTTPS and port
  if (!fullUrl.startsWith('https://')) throw new Error(...);
  if (!fullUrl.includes(':3001')) throw new Error(...);
  
  // ... rest of interceptor
});
```

## Verification Steps

1. **Check Console Logs**
   - Should see: `[API Client] Backend URL configured: https://host:3001`
   - Should see: `[API Request] GET https://host:3001/api/v1/citywide-risk?limit=10`
   - Should NOT see any HTTP URLs

2. **Check Browser Network Tab**
   - All API requests should be HTTPS with port 3001
   - Should see: `https://host:3001/api/v1/*`
   - Should NOT see mixed-content warnings

3. **Check API Responses**
   - Dashboard should load citywide risk data
   - Zone Explorer should load sponge zones
   - Forecast should submit successfully

## Expected Behavior

### Before Fix
```
[API Client] Backend URL configured: https://host:3001/api/v1/
[API Request] GET https://host:3001/api/v1/citywide-risk/
Mixed Content: ... requested insecure XMLHttpRequest endpoint 'http://host/api/v1/...'
```

### After Fix
```
[API Client] Backend URL configured: https://host:3001
[API Request] GET https://host:3001/api/v1/citywide-risk?limit=10
[API Response] GET https://host:3001/api/v1/citywide-risk?limit=10 - 250ms - Status: 200
```

## Files Modified

1. `src/config/apiConfig.js` - Returns origin only, no /api/v1/ path
2. `src/services/api.js` - Manual URL construction in request interceptor
3. `src/pages/Dashboard.js` - Updated comments
4. `src/pages/ZoneExplorer.js` - Updated comments
5. `src/pages/Forecast.js` - Updated comments
6. `src/utils/apiDiagnostics.js` - Updated diagnostics for new URL structure

## Testing Checklist

- [ ] Dashboard loads without mixed-content errors
- [ ] Zone Explorer map loads GeoJSON data
- [ ] Forecast form submits successfully
- [ ] All API requests show HTTPS with port 3001 in Network tab
- [ ] No HTTP fallback URLs in console
- [ ] API diagnostics pass all tests

## Additional Notes

- The setupProxy.js configuration is ONLY for webpack dev server serving frontend assets
- Backend API calls are made directly by the browser and are NOT proxied
- All API calls must explicitly include HTTPS://host:3001 in the URL
- Query parameters are properly serialized by axios and don't affect URL construction now

## Environment Variables Required

```env
REACT_APP_API_BASE=https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001
REACT_APP_BACKEND_URL=https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001
```

Note: REACT_APP_API_BASE takes priority over REACT_APP_BACKEND_URL
