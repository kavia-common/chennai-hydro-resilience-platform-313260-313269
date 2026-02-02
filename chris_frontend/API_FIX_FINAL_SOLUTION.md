# API URL Fix - Final Solution

## Problem Summary

The frontend was experiencing mixed-content errors where:
- **Expected**: `https://host:3001/api/v1/citywide-risk?limit=10`
- **Actual**: `http://host/api/v1/citywide-risk?limit=10` (HTTP, no port!)

The API client logged the correct HTTPS URL with port 3001, but the browser made HTTP requests without the port.

## Root Cause

Axios was rewriting URLs when query parameters were added. Despite setting `baseURL` correctly, axios internally resolved relative URLs, which the browser then interpreted relative to `window.location`, causing:
1. Protocol downgrade to HTTP (mixed-content)
2. Port removal (missing :3001)
3. Requests hitting the wrong server

## Solution

### 1. API Client Fix (`src/services/api.js`)

**Key Changes:**
- **Removed `baseURL` from axios config** - This prevents axios from doing relative URL resolution
- **Construct absolute URLs manually in interceptor** - Build complete URLs including protocol, host, port, and path
- **Set `config.url` to absolute URL** - Force axios to use the exact URL we provide

```javascript
// Before (problematic):
const api = axios.create({
  baseURL: 'https://host:3001/api/v1/',  // axios tries to resolve relative to this
});

// After (fixed):
const api = axios.create({
  // No baseURL - we construct absolute URLs manually
});

// In request interceptor:
config.url = `${FULL_BASE_URL}/${cleanPath}`;  // Absolute URL
```

### 2. SetupProxy Enhancement (`src/setupProxy.js`)

**Key Changes:**
- **Reject API paths with detailed logging** - Catch any API requests that incorrectly hit the dev server
- **Enhanced error messages** - Help diagnose configuration issues

### 3. Diagnostic Utility (`src/utils/apiUrlDiagnostic.js`)

**New Features:**
- **Configuration validation** - Check environment variables and URL format
- **URL validation** - Verify constructed URLs before requests
- **Automatic diagnostics on startup** - Run checks when app loads

### 4. App.js Integration

**Added:**
- Automatic API diagnostics on app startup
- Console warnings for configuration issues

## Validation Steps

### 1. Run Test Script
```bash
cd chris_frontend
node test-api-fix.js
```

Expected output: All tests pass ✅

### 2. Check Environment
```bash
cat .env | grep API
```

Expected:
```
REACT_APP_API_BASE=https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001
```

### 3. Restart Dev Server
```bash
npm start
```

### 4. Check Browser Console

Look for:
```
✓ setupProxy.js loaded - Dev server configured for /proxy/3000 path
[API Client] Backend URL configured: https://host:3001/api/v1
🔍 API Configuration Diagnostics
  Status: PASS
```

### 5. Verify Network Requests

In browser DevTools Network tab, API requests should show:
- ✅ **Protocol**: `https://`
- ✅ **Port**: `:3001`
- ✅ **Path**: `/api/v1/{endpoint}`
- ✅ **Status**: 200 or expected status (not mixed-content error)

## Testing Checklist

- [ ] Dashboard loads and fetches citywide-risk data
- [ ] ZoneExplorer loads and fetches sponge-zones GeoJSON
- [ ] Forecast page can submit predictions
- [ ] No mixed-content errors in console
- [ ] All API requests use HTTPS with port 3001
- [ ] Network tab shows correct URLs

## Common Issues and Solutions

### Issue: Still seeing HTTP requests

**Check:**
1. Did you restart the dev server? Changes require a restart.
2. Clear browser cache (hard refresh: Ctrl+Shift+R)
3. Check browser console for API diagnostics

### Issue: API requests hitting dev server

**Symptoms:**
```
[PROXY ERROR] API path detected in dev server
```

**Solution:**
- This means axios is using relative URLs
- Verify the API client fix was applied correctly
- Check that `config.url` is set to absolute URL in interceptor

### Issue: CORS errors

**Check:**
- Backend must accept requests from frontend origin
- Backend CORS config should allow `https://host:3000`

## Files Modified

1. ✅ `src/services/api.js` - Fixed URL construction
2. ✅ `src/setupProxy.js` - Enhanced error detection
3. ✅ `src/utils/apiUrlDiagnostic.js` - New diagnostic utility
4. ✅ `src/App.js` - Added startup diagnostics
5. ✅ `test-api-fix.js` - Test script

## Environment Variables Required

```env
REACT_APP_API_BASE=https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001
```

or

```env
REACT_APP_BACKEND_URL=https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001
```

## Technical Details

### Why Absolute URLs?

When axios uses a `baseURL` and you provide a relative path:
1. Axios constructs: `baseURL + path`
2. Browser sees the URL and resolves it
3. If the URL appears relative, browser resolves against `window.location`
4. This causes protocol/port to be lost

By using **absolute URLs** (starting with `https://`):
1. Browser recognizes it as absolute
2. No resolution against `window.location`
3. Protocol, host, and port preserved exactly

### URL Construction Flow

```
Input: 'citywide-risk'
       params: { limit: 10 }

Step 1: Clean path
        'citywide-risk'

Step 2: Build absolute URL
        'https://host:3001/api/v1/citywide-risk'

Step 3: Set config.url
        config.url = 'https://host:3001/api/v1/citywide-risk'

Step 4: Axios adds params
        Final: 'https://host:3001/api/v1/citywide-risk?limit=10'

Result: ✅ Correct HTTPS URL with port 3001
```

## Success Criteria

✅ All API requests use `https://host:3001/api/v1/...`
✅ No mixed-content errors in browser console
✅ Dashboard, ZoneExplorer, Forecast all load data successfully
✅ Network tab shows correct request URLs
✅ API diagnostics report PASS status

---

**Last Updated:** 2025-02-02
**Status:** READY FOR TESTING
