# Proxy Cache Fix - 304 Not Modified Issue

## Problem Summary

When accessing the React app through `/proxy/3000/`, the browser receives **304 Not Modified** responses with the **same ETag** for different files (bundle.js, manifest.json, index.html). This causes:

- ✗ `Unexpected token '<'` error in bundle.js
- ✗ Manifest syntax error
- ✗ HTML content served instead of JS/JSON

**Root Cause:** The webpack dev server returns the same ETag for all requests under the proxy path, causing the browser to use cached HTML for JS/JSON files.

## Solution Implemented

### 1. Updated `src/setupProxy.js`

Added middleware to:
- **Disable caching entirely** with `Cache-Control: no-cache, no-store, must-revalidate`
- **Set correct MIME types** for `.js`, `.json`, `.css`, `.map` files
- **Log all requests** for debugging

### 2. Updated `.env.development`

Added configuration to:
- Ensure `PUBLIC_URL=/proxy/3000` (without REACT_APP_ prefix)
- Set `WDS_SOCKET_PATH=/proxy/3000/ws` for HMR
- Disable content hashing in development
- Enable Fast Refresh

### 3. Updated `package.json`

Added scripts:
- `npm run clean` - Clear webpack cache
- `npm run restart` - Clean and restart dev server

## How to Apply the Fix

### Step 1: Stop the Dev Server

```bash
# Press Ctrl+C in the terminal running npm start
# Or kill the process:
pkill -f "react-scripts start"
lsof -ti:3000 | xargs kill -9
```

### Step 2: Clear All Caches

```bash
cd chennai-hydro-resilience-platform-313260-313269/chris_frontend

# Clear webpack cache
rm -rf node_modules/.cache

# Clear build artifacts
rm -rf build

# Optional: Clear browser cache or use Incognito mode
```

### Step 3: Restart Dev Server

```bash
npm start

# Or use the restart script:
npm run restart
```

### Step 4: Hard Refresh Browser

1. Open browser DevTools (F12)
2. Go to Network tab
3. Check "Disable cache"
4. Hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)

### Step 5: Verify Fix

Check in DevTools Network tab:

✓ **bundle.js** should show:
  - Status: `200 OK` (not 304)
  - Content-Type: `application/javascript; charset=utf-8`
  - Cache-Control: `no-cache, no-store, must-revalidate`

✓ **manifest.json** should show:
  - Status: `200 OK`
  - Content-Type: `application/manifest+json; charset=utf-8`
  - Cache-Control: `no-cache, no-store, must-revalidate`

✓ **No console errors** like `Unexpected token '<'`

## Expected Behavior After Fix

### Before Fix (❌ Broken)
```
GET /proxy/3000/static/js/bundle.js
Status: 304 Not Modified
ETag: W/"499-g+fK3UtD344QTY1qI43V9IHKu9c"
Content-Type: (not set or text/html)
Response: <!DOCTYPE html><html>...  ← HTML content!
```

### After Fix (✓ Working)
```
GET /proxy/3000/static/js/bundle.js
Status: 200 OK
Cache-Control: no-cache, no-store, must-revalidate
Content-Type: application/javascript; charset=utf-8
Response: /******/ (() => { // webpackBootstrap...  ← JS content!
```

## Troubleshooting

### Issue: Still getting 304 responses

**Solution:**
1. Clear browser cache completely
2. Use Incognito/Private window
3. Verify setupProxy.js was updated (should have cache headers)
4. Check server logs - should see cache-control headers being set

### Issue: Assets load from `/static/...` instead of `/proxy/3000/static/...`

**Solution:**
1. Verify `PUBLIC_URL=/proxy/3000` in `.env.development` (no REACT_APP_ prefix!)
2. Check `homepage` field in `package.json` is set to `/proxy/3000`
3. Clear webpack cache: `rm -rf node_modules/.cache`
4. Restart dev server

### Issue: HMR (Hot Module Replacement) not working

**Solution:**
1. Verify `WDS_SOCKET_PATH=/proxy/3000/ws` in `.env.development`
2. Check browser console for WebSocket connection errors
3. Ensure reverse proxy forwards WebSocket connections

### Issue: Dev server won't start

**Solution:**
```bash
# Check if port 3000 is in use
lsof -i:3000

# Kill any process using port 3000
lsof -ti:3000 | xargs kill -9

# Clear all caches
rm -rf node_modules/.cache build

# Reinstall if needed
npm install

# Start again
npm start
```

## Understanding the Configuration

### Why PUBLIC_URL without REACT_APP_ prefix?

- `PUBLIC_URL` is a **webpack variable**, not a React app environment variable
- It sets `output.publicPath` in webpack config
- `REACT_APP_` prefix is ONLY for variables accessed in React components via `process.env.REACT_APP_*`

### Why disable caching in development?

- Development builds change frequently
- Caching causes stale assets to be served
- 304 responses can serve wrong content types
- No-cache ensures fresh content on every request

### Why set Content-Type explicitly?

- Webpack dev server may not set correct MIME types for proxied paths
- Browsers refuse to execute JS with `text/html` content type
- Explicit MIME types prevent "MIME type mismatch" errors

## Production Deployment

For production builds (`npm run build`):

1. The proxy path fix is baked into the build
2. Static files will have correct paths: `/proxy/3000/static/...`
3. No caching issues since files have unique content hashes
4. Serve the `build/` folder from your web server at `/proxy/3000/`

## Additional Resources

- [CRA Public URL Documentation](https://create-react-app.dev/docs/using-the-public-folder/)
- [Webpack Dev Server Configuration](https://webpack.js.org/configuration/dev-server/)
- [HTTP Caching (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- See also: `PROXY_FIX_GUIDE.md` for general proxy setup

---

**Last Updated:** 2026-02-02
**Issue:** React dev server returns HTML for JS/JSON under proxy path
**Fix:** No-cache headers + explicit MIME types in setupProxy.js
