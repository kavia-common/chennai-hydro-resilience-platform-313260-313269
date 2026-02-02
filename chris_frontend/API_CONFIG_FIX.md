# API Configuration Fix - Mixed Content and URL Issues

## Problem Summary

The frontend was experiencing mixed-content errors where:
1. **API client correctly configured** HTTPS URLs: `https://host:3001/api/v1/`
2. **Browser made HTTP requests** without port: `http://host/api/v1/...`
3. **Mixed content blocked** all API requests from HTTPS frontend

## Root Cause

The issue was caused by:
- Lack of centralized API configuration
- URL construction logic scattered across multiple files
- No validation of final request URLs
- Potential for environment variable misuse

## Solution Implemented

### 1. Centralized API Configuration (`src/config/apiConfig.js`)

Created a **single source of truth** for all backend API configuration:

```javascript
export const getApiBaseURL = () => {
  // Returns: https://host:3001/api/v1
}
```

**Key features:**
- ✅ Forces HTTPS protocol
- ✅ Ensures port 3001 is always included
- ✅ Validates and normalizes URLs
- ✅ Includes /api/v1 prefix
- ✅ Comprehensive error handling

### 2. Simplified API Client (`src/services/api.js`)

**Before:**
- Complex URL construction logic
- Multiple places checking for HTTP/HTTPS
- Potential for URL construction errors

**After:**
- Uses centralized `getApiConfig()`
- Simple validation in interceptor
- Clear logging of all requests
- Blocks any HTTP requests immediately

### 3. Updated All API Calls

Updated API calls in:
- ✅ `Dashboard.js` - `api.get('citywide-risk/')`
- ✅ `ZoneExplorer.js` - `api.get('map/sponge-zones/')`
- ✅ `Forecast.js` - `api.post('forecast/')`

**Pattern:**
```javascript
// CORRECT - No leading slash, trailing slash optional
api.get('endpoint/')
api.post('endpoint/', data)

// The baseURL (https://host:3001/api/v1) handles the rest
```

### 4. Runtime Validation (`src/utils/apiValidator.js`)

Added validation utilities that:
- ✅ Check URLs are HTTPS
- ✅ Verify port 3001 is present
- ✅ Confirm /api/v1 path exists
- ✅ Log environment variables on startup

### 5. Startup Validation (`src/index.js`)

Application now validates API configuration on startup:
```
============================================================
CHRIS Frontend - API Configuration Validation
============================================================
[API Validator] Environment Check
REACT_APP_API_BASE: https://host:3001
...
[API Validator] PASS: https://host:3001/api/v1/test
SUCCESS: API configuration is valid
============================================================
```

## Files Changed

### New Files
1. `src/config/apiConfig.js` - Centralized API configuration
2. `src/utils/apiValidator.js` - Runtime validation utilities

### Modified Files
1. `src/services/api.js` - Simplified to use centralized config
2. `src/pages/Dashboard.js` - Updated API call paths
3. `src/pages/ZoneExplorer.js` - Updated API call paths  
4. `src/pages/Forecast.js` - Updated API call paths
5. `src/index.js` - Added startup validation

## Expected Behavior

### Before Fix
```
❌ Browser Console:
Mixed Content: The page at 'https://host:3000/dashboard' was loaded over HTTPS,
but requested an insecure XMLHttpRequest endpoint 'http://host/api/v1/citywide-risk'.
This request has been blocked.
```

### After Fix
```
✅ Browser Console:
[API Config] Configured base URL: https://host:3001/api/v1
[API Request] GET https://host:3001/api/v1/citywide-risk/
[API Response] GET https://host:3001/api/v1/citywide-risk/ - 250ms - Status: 200
```

## Testing the Fix

1. **Check Console on Startup:**
   - Should see API configuration validation
   - Should confirm HTTPS URLs

2. **Monitor Network Tab:**
   - All requests should go to `https://host:3001`
   - No HTTP requests should appear
   - No mixed-content errors

3. **Test All Pages:**
   - Dashboard → `/citywide-risk/`
   - ZoneExplorer → `/map/sponge-zones/`
   - Forecast → `/forecast/`

## Environment Variables

The fix relies on these environment variables (already configured in `.env`):

```bash
REACT_APP_API_BASE=https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001
REACT_APP_BACKEND_URL=https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001
```

**Priority:** `REACT_APP_API_BASE` > `REACT_APP_BACKEND_URL`

## Key Principles

1. **Single Source of Truth:** All API configuration comes from `apiConfig.js`
2. **HTTPS Always:** No HTTP requests are allowed from HTTPS pages
3. **Port 3001:** Backend always on port 3001, frontend on 3000
4. **Fail Fast:** Invalid configuration throws error on startup
5. **Clear Logging:** Every request is logged with full URL

## Troubleshooting

If you still see mixed-content errors:

1. **Check console for validation errors** on startup
2. **Verify environment variables** are set correctly
3. **Check Network tab** - ensure all requests show `https://host:3001`
4. **Clear browser cache** and hard refresh (Ctrl+Shift+R)

## Notes

- ✅ All API calls now use relative paths (no leading slash)
- ✅ baseURL handles protocol, host, port, and `/api/v1` prefix
- ✅ Trailing slashes added for consistency with backend routing
- ✅ Runtime validation catches configuration issues early
- ✅ Clear error messages for debugging

## Success Criteria

✅ No mixed-content errors in browser console  
✅ All API requests use HTTPS to port 3001  
✅ Proper `/api/v1/*` path structure  
✅ Backend endpoints respond successfully  
✅ Dashboard, ZoneExplorer, and Forecast pages work
