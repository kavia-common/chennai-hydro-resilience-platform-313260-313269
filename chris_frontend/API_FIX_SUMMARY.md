# API URL Concatenation and CORS Fix

## Problem Summary

The frontend was making API requests with incorrect URLs:
- **Expected**: `https://...api:3001/api/v1/forecast/`
- **Actual**: `https://...api:3001/api/v1forecast` (missing slash)

This caused:
1. 404 errors for all API endpoints
2. CORS preflight failures (though CORS was actually configured correctly)

## Root Cause

The issue was in `src/services/api.js`:
- `baseURL` was set to `https://...api:3001/api/v1` (no trailing slash)
- Axios concatenates `baseURL + endpoint` directly without adding a slash
- When calling `api.post('forecast/', ...)`, axios created: `/api/v1` + `forecast/` = `/api/v1forecast/`

## Solution Applied

### 1. Fixed API Client (`src/services/api.js`)

Updated `getBackendURL()` to ensure the base URL always ends with a trailing slash:

```javascript
const getBackendURL = () => {
  const apiBase = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL;
  
  if (apiBase) {
    // If the URL already includes /api/v1, ensure trailing slash
    if (apiBase.endsWith('/api/v1')) {
      return `${apiBase}/`;  // Returns: https://...api:3001/api/v1/
    }
    if (apiBase.endsWith('/api/v1/')) {
      return apiBase;
    }
    return `${apiBase}/api/v1/`;
  }
  
  return '/api/v1/';
};
```

### 2. Updated Endpoint Paths

Ensured all endpoint paths work correctly with the trailing-slash baseURL:

**Forecast.js**:
- `api.post('forecast/', ...)` → Becomes: `/api/v1/` + `forecast/` = `/api/v1/forecast/` ✅

**Dashboard.js**:
- `api.get('citywide-risk', ...)` → Becomes: `/api/v1/` + `citywide-risk` = `/api/v1/citywide-risk` ✅

**ZoneExplorer.js**:
- `api.get('map/sponge-zones', ...)` → Becomes: `/api/v1/` + `map/sponge-zones` = `/api/v1/map/sponge-zones` ✅
- `api.get('map/sponge-zones/${zoneId}/details')` → Becomes: `/api/v1/map/sponge-zones/{id}/details` ✅

## Backend Routes Mapping

The backend is configured with these exact routes:

| Frontend Call | Final URL | Backend Route |
|--------------|-----------|---------------|
| `api.post('forecast/', ...)` | `/api/v1/forecast/` | `POST /api/v1/forecast/` ✅ |
| `api.get('citywide-risk')` | `/api/v1/citywide-risk` | `GET /api/v1/citywide-risk` ✅ |
| `api.get('map/sponge-zones')` | `/api/v1/map/sponge-zones` | `GET /api/v1/map/sponge-zones` ✅ |
| `api.get('map/sponge-zones/{id}/details')` | `/api/v1/map/sponge-zones/{id}/details` | `GET /api/v1/map/sponge-zones/{zone_id}/details` ✅ |

## CORS Configuration

The backend CORS is already properly configured in `chris_backend/.env`:

```
ALLOWED_ORIGINS=https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3000,...
ALLOWED_METHODS=GET,POST,PUT,DELETE,PATCH,OPTIONS
ALLOWED_HEADERS=Content-Type,Authorization,X-Requested-With
```

The backend `main.py` applies these settings via `CORSMiddleware`, so CORS should work once the URLs are correct.

## Expected Results

After this fix:
1. ✅ API URLs will be correctly formatted with proper slashes
2. ✅ All GET requests (Dashboard, ZoneExplorer) will work
3. ✅ POST requests (Forecast) will pass CORS preflight and work correctly
4. ✅ Console logs will show correct URLs: `https://...api:3001/api/v1/forecast/` instead of `...api/v1forecast`

## Testing

To verify the fix:

1. Open browser DevTools → Network tab
2. Navigate to Dashboard → Check `citywide-risk` API call succeeds (200 OK)
3. Navigate to ZoneExplorer → Check `map/sponge-zones` API call succeeds (200 OK)
4. Navigate to Forecast → Submit form → Check `forecast/` API call:
   - Preflight OPTIONS request should succeed (204 or 200)
   - POST request should succeed (200 OK)
   - No CORS errors in console

## Files Modified

1. `src/services/api.js` - Fixed `getBackendURL()` to ensure trailing slash
2. `src/pages/Forecast.js` - Verified endpoint path is `'forecast/'`
3. `src/pages/Dashboard.js` - Verified endpoint path is `'citywide-risk'`
4. `src/pages/ZoneExplorer.js` - Verified endpoint paths are `'map/sponge-zones'` and `'map/sponge-zones/${zoneId}/details'`

## No Changes Needed

- ✅ Backend CORS configuration (already correct)
- ✅ Environment variables (already correct)
- ✅ Backend routes (already correct)

---

**Fix Date**: 2026-02-02
**Issue**: URL concatenation causing missing slash between base and endpoint
**Resolution**: Add trailing slash to baseURL in axios client
