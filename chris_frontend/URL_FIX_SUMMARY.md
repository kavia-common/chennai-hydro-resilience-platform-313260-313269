# API URL Construction Fix - Summary

## Problem Identified

From user logs, the application was experiencing:

1. **Mixed Content Errors**: Requests to `http://vscode-internal-27819-beta.beta01.cloud.kavia.ai/api/v1/...` (HTTP, no port) despite HTTPS page
2. **Malformed URLs**: Missing slashes in paths (e.g., `api/v1citywide-risk`)
3. **Inconsistent Protocol**: Backend requests using HTTP instead of HTTPS

## Root Cause

The API client was not enforcing HTTPS strictly enough, and URL path joining logic had edge cases that could create malformed URLs.

## Changes Made

### 1. Enhanced API Client (`src/services/api.js`)

**Key Improvements:**
- **Strict HTTPS Enforcement**: Multi-level checks ensure no HTTP requests slip through
- **Defensive URL Construction**: `getBackendURL()` function normalizes env vars with proper protocol/path
- **Improved Path Joining**: Fixed logic to handle trailing/leading slashes correctly
- **Enhanced Logging**: Added detailed request/response logging with full URLs
- **Mixed-Content Prevention**: Request interceptor blocks HTTP requests before they're sent

**URL Construction Flow:**
```
Environment Variable → Remove trailing slashes → Remove /api/v1 suffix → 
Force HTTPS → Validate with URL() → Append /api/v1/ → Return baseURL
```

**Request Interceptor:**
- Validates baseURL is HTTPS
- Normalizes endpoint paths (removes double slashes, fixes leading/trailing slashes)
- Constructs full URL and validates it's HTTPS before sending
- Throws error if HTTP detected (prevents mixed-content)

### 2. Updated Page Components

**Files Modified:**
- `src/pages/Dashboard.js` - Changed `'citywide-risk/'` to `'citywide-risk'`
- `src/pages/ZoneExplorer.js` - Changed `'map/sponge-zones/'` to `'map/sponge-zones'`
- `src/pages/ZoneExplorer.js` - Changed `'map/sponge-zones/${zoneId}/details/'` to `'map/sponge-zones/${zoneId}/details'`
- `src/pages/Forecast.js` - Changed `'forecast/'` to `'forecast'`

**Rationale:** Removed trailing slashes from endpoint paths since baseURL already includes trailing slash (`/api/v1/`). This prevents double slashes and ensures consistent URL construction.

### 3. Environment Configuration

**Updated `.env`:**
- Changed WebSocket URL from `ws://` to `wss://` (secure WebSocket)

### 4. New Utility Modules

**`src/utils/urlValidator.js`:**
- `isSecureURL()` - Checks if URL uses HTTPS
- `forceHTTPS()` - Converts HTTP URLs to HTTPS
- `normalizeURL()` - Comprehensive URL normalization
- `joinURL()` - Proper URL path joining
- `validateEnvironmentURLs()` - Startup validation of env vars

**`src/utils/apiDiagnostics.js`:**
- `testAPIConnection()` - Tests API connectivity and logs diagnostics
- `logAPIConfig()` - Logs detailed API configuration
- `testEndpoint()` - Tests specific endpoints with custom parameters

### 5. Startup Validation

**Updated `src/index.js`:**
- Added `validateEnvironmentURLs()` call on app startup
- Detects and logs any insecure URLs in environment variables

## How It Works Now

### URL Construction Example

**Environment Variable:**
```
REACT_APP_API_BASE=https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001
```

**After `getBackendURL()` Processing:**
```
https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001/api/v1/
```

**API Call:**
```javascript
api.get('citywide-risk', { params: { limit: 10 } })
```

**Final Request URL:**
```
https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001/api/v1/citywide-risk?limit=10
```

### Request Flow

1. **Page Component** calls `api.get('citywide-risk')`
2. **Request Interceptor** runs:
   - Validates baseURL is HTTPS ✓
   - Normalizes path: `'citywide-risk'` (no leading slash needed)
   - Constructs full URL: `baseURL + endpoint`
   - Validates full URL is HTTPS ✓
   - Logs: `[API Request] GET https://...`
   - Injects auth token from Supabase
3. **Axios** sends HTTPS request
4. **Response Interceptor** runs:
   - Logs response time and status
   - Handles errors with detailed logging

## Testing & Verification

### Console Logs to Monitor

On app startup, you should see:
```
[URL Validator] Checking environment variables...
[URL Validator] ✓ REACT_APP_API_BASE: https://...
[URL Validator] ✓ REACT_APP_BACKEND_URL: https://...
[URL Validator] ✓ REACT_APP_WS_URL: wss://...
[API Client] Raw env API_BASE: https://...
[API Client] Final backend URL: https://.../api/v1/
[API Client] Backend URL configured: https://.../api/v1/
```

For each API request:
```
[API Request] GET https://.../api/v1/citywide-risk
[API Response] GET https://.../api/v1/citywide-risk - 250ms - Status: 200
```

### What to Watch For

**Good Indicators:**
- All URLs logged show `https://` protocol
- No mixed-content warnings in browser console
- Request URLs include correct port (3001)
- Paths are properly formed (no double slashes, no missing slashes)

**Red Flags:**
- `[API Client] ERROR: baseURL is using HTTP instead of HTTPS!`
- `[API Client] CRITICAL: Full URL is HTTP, this will cause mixed-content error!`
- Browser console: "Mixed Content: The page at 'https://...' was loaded over HTTPS, but requested an insecure XMLHttpRequest endpoint 'http://...'"

## Debugging

### Run API Diagnostics

Open browser console and run:
```javascript
import { testAPIConnection, logAPIConfig } from './utils/apiDiagnostics';

// Log current configuration
logAPIConfig();

// Test connectivity
testAPIConnection().then(results => console.log(results));
```

### Common Issues & Solutions

**Issue:** Still seeing HTTP requests
**Solution:** 
1. Check browser network tab for actual request URL
2. Verify `.env` file has HTTPS URLs
3. Restart dev server to reload environment variables
4. Check console for URL validation warnings

**Issue:** 404 errors with correct protocol
**Solution:**
1. Verify backend is running on port 3001
2. Check backend CORS configuration allows frontend origin
3. Test endpoint directly with curl/Postman

**Issue:** Double slashes in paths
**Solution:**
1. Ensure endpoint paths don't start with `/` when using shared API client
2. Check console logs for "[API Client] Fixed double slashes in URL path"

## Environment Variables Reference

Required variables in `.env`:
```bash
# Backend API (HTTPS required)
REACT_APP_API_BASE=https://host:3001
REACT_APP_BACKEND_URL=https://host:3001

# Frontend URL (HTTPS required)
REACT_APP_FRONTEND_URL=https://host:3000

# WebSocket URL (WSS required for secure pages)
REACT_APP_WS_URL=wss://host:3001/ws
```

## Next Steps

1. **Verify Fix**: Reload the application and check browser console for clean logs
2. **Test All Pages**: Navigate to Dashboard, Zone Explorer, Forecast, and Reports
3. **Monitor Network**: Use browser DevTools Network tab to verify all requests use HTTPS
4. **Backend CORS**: Ensure backend CORS config allows `https://host:3000` origin

## Related Files

- `src/services/api.js` - Main API client with HTTPS enforcement
- `src/utils/urlValidator.js` - URL validation utilities
- `src/utils/apiDiagnostics.js` - API testing utilities
- `src/pages/*.js` - Updated to use consistent endpoint paths
- `.env` - Environment configuration with secure protocols
- `src/index.js` - Startup validation
