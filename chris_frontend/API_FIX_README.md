# API URL Fix - Complete Documentation

## Quick Start

This fix resolves the mixed-content errors and HTTP fallback issues in the CHRIS frontend.

### Validation

Run the validation script:
```bash
node validate-api-urls.js
```

### Testing

1. Start the development server:
```bash
npm start
```

2. Open browser console and navigate to Dashboard
3. Verify console shows:
   - `[API Client] Backend URL configured: https://<host>:3001`
   - `[API Request] GET https://<host>:3001/api/v1/citywide-risk?limit=10`
   - `[API Response] GET https://<host>:3001/api/v1/citywide-risk?limit=10 - XXXms - Status: 200`

4. Check Network tab - all requests should be HTTPS with port 3001

## What Was Fixed

### Problem
- Frontend logged correct HTTPS URLs but browser made HTTP requests without port
- Mixed content errors blocked API calls
- Query parameters caused axios to reconstruct URLs incorrectly

### Solution
- Changed baseURL to return origin only (no /api/v1/ path)
- Added manual URL construction in request interceptor
- Multiple HTTPS and port validation checkpoints

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Component Layer                         │
│  (Dashboard, ZoneExplorer, Forecast, etc.)              │
│                                                          │
│  api.get('citywide-risk', { params: {...} })            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│              API Client (services/api.js)                │
│                                                          │
│  1. Request Interceptor:                                │
│     - Cleans path: 'citywide-risk'                      │
│     - Constructs: BASE_URL/api/v1/citywide-risk         │
│     - Validates HTTPS + port 3001                       │
│     - Adds auth token                                   │
│                                                          │
│  2. Response Interceptor:                               │
│     - Logs response/error                               │
│     - Handles error codes                               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│            Config (config/apiConfig.js)                  │
│                                                          │
│  getApiBaseURL() returns: https://host:3001             │
│  - Enforces HTTPS protocol                              │
│  - Ensures port 3001                                    │
│  - Returns origin only (no path)                        │
└─────────────────────────────────────────────────────────┘
```

## Key Implementation Details

### 1. Base URL Configuration

**apiConfig.js:**
```javascript
export const getApiBaseURL = () => {
  let baseUrl = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL;
  
  // Clean and parse
  baseUrl = baseUrl.trim().replace(/\/+$/, '').replace(/\/api\/v1\/?$/, '');
  
  // Create URL object and force HTTPS + port 3001
  const urlObj = new URL(baseUrl.includes('://') ? baseUrl : 'https://' + baseUrl);
  urlObj.protocol = 'https:';
  if (!urlObj.port || urlObj.port === '3000') {
    urlObj.port = '3001';
  }
  
  return urlObj.origin; // https://host:3001 (no path)
};
```

### 2. Request Interceptor

**api.js:**
```javascript
api.interceptors.request.use(async (config) => {
  // Clean the path
  let path = config.url || '';
  path = path.replace(/^\/+/, '').replace(/\/+$/, '');
  
  // Manually construct full URL
  const fullUrl = `${BASE_URL}/api/v1/${path}`;
  
  // Override axios config
  config.baseURL = BASE_URL;
  config.url = `/api/v1/${path}`;
  
  // Validate
  if (!fullUrl.startsWith('https://')) throw new Error('Not HTTPS');
  if (!fullUrl.includes(':3001')) throw new Error('Missing port');
  
  // Add auth token and return
  return config;
});
```

### 3. Component Usage

**Dashboard.js, ZoneExplorer.js, Forecast.js:**
```javascript
// Clean paths without leading/trailing slashes
api.get('citywide-risk', { params: { limit: 10 } })
api.get('map/sponge-zones', { params: { limit: 100 } })
api.post('forecast', { years: 5 })
```

## Environment Variables

**.env:**
```env
REACT_APP_API_BASE=https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001
REACT_APP_BACKEND_URL=https://vscode-internal-27819-beta.beta01.cloud.kavia.ai:3001
```

**Note:** Do NOT include `/api/v1` in env vars - the interceptor adds it automatically.

## Validation Points

The fix includes multiple validation layers:

1. **Module Load (apiConfig.js)**
   - Validates HTTPS protocol
   - Validates port 3001 presence
   - Throws error if invalid

2. **Module Load (api.js)**
   - Validates baseURL is HTTPS
   - Validates baseURL has port 3001
   - Throws error if invalid

3. **Request Time (interceptor)**
   - Re-validates constructed URL is HTTPS
   - Re-validates port 3001 presence
   - Throws error before making request

This fail-fast approach prevents silent failures and mixed content issues.

## Troubleshooting

### Issue: Still seeing HTTP requests

**Check:**
1. Is `.env` file correctly configured with HTTPS URLs?
2. Did you restart the dev server after changing `.env`?
3. Are you seeing error messages in console?

### Issue: Port is missing from requests

**Check:**
1. Is port 3001 in REACT_APP_API_BASE env var?
2. Check console for `[API Client] Backend URL configured:` message
3. Should show: `https://host:3001` (with port)

### Issue: Mixed content warnings

**Check:**
1. Is the page itself loaded over HTTPS?
2. Are all API requests going to HTTPS endpoints?
3. Check Network tab - filter by "XHR" and verify all are HTTPS

### Issue: 404 errors

**Check:**
1. Is backend running on port 3001?
2. Are paths correct? (e.g., `citywide-risk` not `/citywide-risk/`)
3. Check constructed URL in console logs

## Files Reference

| File | Purpose | Key Changes |
|------|---------|-------------|
| `src/config/apiConfig.js` | Base URL configuration | Returns origin only (https://host:3001) |
| `src/services/api.js` | Axios instance & interceptors | Manual URL construction with validation |
| `src/pages/Dashboard.js` | Dashboard page | Uses clean API paths |
| `src/pages/ZoneExplorer.js` | Map page | Uses clean API paths |
| `src/pages/Forecast.js` | Forecast page | Uses clean API paths |
| `src/utils/apiDiagnostics.js` | Diagnostic utilities | Updated for new URL structure |
| `validate-api-urls.js` | Validation script | Checks configuration correctness |

## Related Documentation

- `API_URL_FIX_COMPLETE.md` - Detailed technical explanation
- `HTTPS_FIX_SUMMARY.md` - Implementation summary
- `validate-api-urls.js` - Automated validation script

## Support

If issues persist:
1. Run `node validate-api-urls.js` to check configuration
2. Check browser console for error messages
3. Verify `.env` file has correct HTTPS URLs with port 3001
4. Ensure backend is running and accessible

## Success Criteria

✅ No mixed content warnings in console
✅ All API requests use HTTPS with port 3001
✅ Dashboard loads citywide risk data
✅ Zone Explorer loads map and GeoJSON
✅ Forecast form submits successfully
✅ Network tab shows HTTPS URLs
✅ No HTTP fallback requests
