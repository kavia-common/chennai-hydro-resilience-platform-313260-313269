# Testing Guide: API URL Fix Validation

## Overview
This guide explains how to test and validate that the API URL construction fix is working correctly and all mixed-content issues are resolved.

## Pre-requisites
- Frontend dev server running on port 3000
- Backend API server running on port 3001
- Browser with Developer Tools (Chrome/Firefox/Edge recommended)

## Quick Validation Checklist

### ✅ Step 1: Check Console Logs
Open browser console (F12) and look for:

```
[API Client] Backend URL configured: https://host:3001
[API Client] Full API base: https://host:3001/api/v1
```

**Expected:** Both URLs should use `https://` and include `:3001`

**Red Flags:**
- ❌ `http://` instead of `https://`
- ❌ Missing port `:3001`
- ❌ Any `CRITICAL:` error messages

### ✅ Step 2: Run Automated Tests
In the browser console, run:
```javascript
window.runApiTests()
```

**Expected Output:**
```
🧪 Running API Setup Tests...

Test 1: Configuration
✓ Configuration logged

Test 2: Base URL Construction
✓ Base URL is valid: https://host:3001

Test 3: Sample Endpoint URLs
  ✓ citywide-risk: https://host:3001/api/v1/citywide-risk
  ✓ map/sponge-zones: https://host:3001/api/v1/map/sponge-zones
  ✓ forecast: https://host:3001/api/v1/forecast
✓ All endpoint URLs are valid

Test 4: Backend Connectivity
✓ Backend is reachable (XXXms)

=== Test Summary ===
Passed: 4
Failed: 0
Warnings: 0
```

### ✅ Step 3: Check Network Tab
1. Open Developer Tools → Network tab
2. Navigate to Dashboard page
3. Filter by "XHR" or "Fetch"

**Verify Each Request:**
- URL starts with `https://host:3001/api/v1/`
- Status is 200 (or appropriate code)
- No mixed-content warnings in console

**Expected Request Examples:**
```
GET https://host:3001/api/v1/citywide-risk?limit=10
GET https://host:3001/api/v1/map/sponge-zones?limit=100
POST https://host:3001/api/v1/forecast
```

### ✅ Step 4: Check for Mixed-Content Errors
In the console, verify there are NO messages like:
```
❌ Mixed Content: The page at 'https://...:3000/...' was loaded over HTTPS,
   but requested an insecure XMLHttpRequest endpoint 'http://...'
```

**If you see this:** The fix didn't work. Check environment variables.

### ✅ Step 5: Test Each Page

#### Dashboard Page (`/dashboard`)
1. Navigate to dashboard
2. Verify data loads (stats cards show numbers)
3. Check Network tab for: `GET .../citywide-risk`
4. Console should show: `[API Request] GET https://host:3001/api/v1/citywide-risk`

#### Zone Explorer Page (`/zone-explorer`)
1. Navigate to zone explorer
2. Verify map loads with zones
3. Check Network tab for: `GET .../map/sponge-zones`
4. Click a zone - should show details
5. Check for: `GET .../map/sponge-zones/{id}/details`

#### Forecast Page (`/forecast`)
1. Navigate to forecast
2. Fill in parameters (e.g., 5 years)
3. Click "Generate Forecast"
4. Check Network tab for: `POST .../forecast`
5. Verify results display

#### ChatBot Component
1. Click chatbot icon (bottom right)
2. Send a message
3. Check Network tab for: `POST .../chatbot`
4. Verify response appears

## Advanced Validation

### Monitor API Calls in Real-Time
```javascript
// Print recent API calls
window.apiMonitor.print()

// Show statistics
window.apiMonitor.stats()

// Clear log
window.apiMonitor.clear()
```

### Manual URL Validation
```javascript
import { validateApiUrl } from './utils/apiUrlValidator';

// Test a URL
const result = validateApiUrl('https://host:3001/api/v1/test');
console.log(result);
// Expected: { isValid: true, issues: [], url: '...' }
```

### Test Connectivity
```javascript
import { testApiConnectivity } from './utils/apiUrlValidator';

// Test backend connection
const result = await testApiConnectivity('https://host:3001');
console.log(result);
// Expected: { success: true, duration: XXX, status: 200 }
```

## Common Issues and Solutions

### Issue 1: Still seeing HTTP requests
**Symptoms:**
- Network tab shows `http://` URLs
- Mixed-content errors in console

**Solution:**
1. Check `.env` file:
   ```bash
   cat .env | grep API_BASE
   ```
   Should show: `REACT_APP_API_BASE=https://host:3001`

2. Restart dev server:
   ```bash
   npm run clean
   npm start
   ```

3. Hard refresh browser: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)

### Issue 2: Port 3001 missing from URLs
**Symptoms:**
- URLs show `https://host/api/v1/...` (no :3001)

**Solution:**
1. Verify environment variables include port:
   ```
   REACT_APP_API_BASE=https://host:3001  ← Must include :3001
   ```

2. Clear browser cache completely

3. Check console for `CRITICAL:` errors on startup

### Issue 3: 404 errors on API calls
**Symptoms:**
- URLs are correct but return 404
- Backend logs don't show requests

**Solution:**
1. Verify backend is running: `curl https://host:3001/api/v1/health`

2. Check backend port matches: Should be 3001

3. Verify CORS is configured on backend

### Issue 4: CORS errors
**Symptoms:**
- Console shows: `Access to XMLHttpRequest ... has been blocked by CORS policy`

**Solution:**
1. Backend must allow origin: `https://host:3000`

2. Backend must allow credentials if using auth

3. Check backend CORS middleware configuration

## Performance Benchmarks

Expected API response times:
- Health check: < 50ms
- citywide-risk: < 500ms
- map/sponge-zones: < 1000ms
- forecast: < 5000ms (varies with years parameter)

If times are significantly higher:
- Check network connectivity
- Verify backend isn't overloaded
- Look for timeout errors in console

## Success Metrics

Your fix is successful when:

✅ All API requests use HTTPS protocol  
✅ All API requests include `:3001` port  
✅ All API requests include `/api/v1/` prefix  
✅ Zero mixed-content warnings in console  
✅ All pages load data successfully  
✅ Network tab shows proper absolute URLs  
✅ `window.runApiTests()` passes all tests  
✅ Response times are within expected ranges  

## Continuous Monitoring

Add this to your development workflow:

```javascript
// Add to src/index.js or App.js for automatic testing
if (process.env.NODE_ENV === 'development') {
  // Run tests on startup
  setTimeout(async () => {
    console.log('Running automatic API validation...');
    const { runApiTests } = await import('./utils/testApiSetup');
    await runApiTests();
  }, 2000);
}
```

## Reporting Issues

If you encounter issues not covered here:

1. Run `window.runApiTests()` and save output
2. Check Network tab and screenshot any failing requests
3. Export console logs (right-click → Save as...)
4. Include environment variables (sanitize sensitive data):
   ```javascript
   console.log({
     REACT_APP_API_BASE: process.env.REACT_APP_API_BASE,
     REACT_APP_BACKEND_URL: process.env.REACT_APP_BACKEND_URL
   });
   ```

---
**Last Updated:** 2025-02-02  
**For Issues:** Refer to API_URL_FIX_FINAL.md
