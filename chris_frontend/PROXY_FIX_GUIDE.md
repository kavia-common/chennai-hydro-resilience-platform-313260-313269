# Proxy Path Fix Guide

## Problem
When accessing the React app through a reverse proxy at `/proxy/3000/`, assets fail to load with errors like:
- `Unexpected token '<'` in bundle.js (HTML returned instead of JS)
- `manifest.json` syntax error (HTML returned instead of JSON)
- 404 errors for `/static/js/bundle.js` instead of `/proxy/3000/static/js/bundle.js`

## Root Cause
Create React App's development server doesn't automatically handle proxy paths correctly. The webpack dev server needs explicit configuration to:
1. Serve assets with the correct base path
2. Configure WebSocket connections for HMR through the proxy
3. Handle the proxy path in all asset URLs

## Solution Implemented

### 1. Environment Variables (`.env` and `.env.development`)
```bash
PUBLIC_URL=/proxy/3000
WDS_SOCKET_PATH=/proxy/3000/ws
DANGEROUSLY_DISABLE_HOST_CHECK=true
PORT=3000
```

**Key Points:**
- `PUBLIC_URL` must NOT have `REACT_APP_` prefix (this is a webpack variable, not a React env var)
- `WDS_SOCKET_PATH` configures the WebSocket path for Hot Module Replacement
- `DANGEROUSLY_DISABLE_HOST_CHECK` allows proxied requests (safe in dev environment)

### 2. package.json Configuration
```json
{
  "homepage": "/proxy/3000",
  "scripts": {
    "start": "PORT=3000 DANGEROUSLY_DISABLE_HOST_CHECK=true WDS_SOCKET_PATH=/proxy/3000/ws react-scripts start"
  }
}
```

**Key Points:**
- `homepage` field tells webpack the public path for bundled assets
- Script env vars ensure consistency even if .env is missed

### 3. setupProxy.js
Located at `src/setupProxy.js`, this file is automatically loaded by CRA's dev server.
It's minimal but provides a place for future proxy middleware configuration if needed.

## How to Test

### 1. Clean Restart (REQUIRED)
```bash
# Stop any running dev server (Ctrl+C)
cd chennai-hydro-resilience-platform-313260-313269/chris_frontend

# Clear any cached webpack data
rm -rf node_modules/.cache

# Restart the dev server
npm start
```

### 2. Verify in Browser DevTools
1. Access app at: `https://your-domain/proxy/3000/`
2. Open DevTools → Network tab
3. Check that assets load from `/proxy/3000/static/...`
4. Verify no 404 errors
5. Check Console - no "Unexpected token '<'" errors

### 3. Verify HTML Output
View page source and check:
```html
<!-- Should see /proxy/3000 prefix: -->
<script src="/proxy/3000/static/js/bundle.js"></script>
<link href="/proxy/3000/static/css/main.chunk.css" rel="stylesheet">
<link rel="manifest" href="/proxy/3000/manifest.json">
```

## Troubleshooting

### Issue: Getting "Unexpected token '<'" or 304 Not Modified serving HTML

**Symptoms:**
- Browser console shows `Uncaught SyntaxError: Unexpected token '<'` in bundle.js
- Network tab shows `304 Not Modified` for JS/JSON files
- Same ETag for different files (bundle.js, manifest.json, index.html)
- HTML content returned instead of JavaScript

**Root Cause:**
Webpack dev server returns the same ETag for all requests under the proxy path, causing browsers to serve cached HTML for JS/JSON files.

**Solution:**
1. Apply the cache fix in `src/setupProxy.js` (adds no-cache headers + MIME types)
2. Clear all caches: `rm -rf node_modules/.cache build`
3. Hard refresh browser with DevTools cache disabled
4. See `PROXY_CACHE_FIX.md` for detailed troubleshooting

**Quick Fix:**
```bash
# Clear caches and restart
rm -rf node_modules/.cache
npm start

# In browser: Ctrl+Shift+R (hard refresh)
```

### Issue: Assets still load from `/static/...` instead of `/proxy/3000/static/...`

**Solution:**
1. Verify `.env` has `PUBLIC_URL=/proxy/3000` (no REACT_APP_ prefix)
2. Ensure you restarted the dev server AFTER changing .env
3. Clear webpack cache: `rm -rf node_modules/.cache`
4. Hard refresh browser: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

### Issue: WebSocket connection fails (HMR not working)

**Solution:**
1. Check browser console for WebSocket errors
2. Verify `WDS_SOCKET_PATH=/proxy/3000/ws` in .env.development
3. Ensure your reverse proxy forwards WebSocket connections
4. Check proxy configuration allows `/proxy/3000/ws` endpoint

### Issue: "Invalid Host header" error

**Solution:**
1. Verify `DANGEROUSLY_DISABLE_HOST_CHECK=true` is set
2. This is safe in development environments behind a proxy
3. Alternative: Set `HOST` env var to your proxy domain

### Issue: Page loads but shows blank screen

**Solution:**
1. Check browser console for JavaScript errors
2. Verify all assets loaded successfully (Network tab)
3. Check that `PUBLIC_URL` is not set to an external URL
4. Ensure React Router `basename` matches PUBLIC_URL if used

## For Production Builds

When building for production with `npm run build`:
- `PUBLIC_URL` will be baked into the build
- Built files in `build/` folder will reference `/proxy/3000/static/...`
- Ensure your production server serves from the same path

```bash
# Build with proxy path
npm run build

# Verify in build/index.html
cat build/index.html | grep "static"
# Should show: <script src="/proxy/3000/static/js/main.xxxxx.js">
```

## References
- [CRA Public URL Documentation](https://create-react-app.dev/docs/using-the-public-folder/)
- [Webpack Dev Server Public Path](https://webpack.js.org/configuration/dev-server/#devserverpublicpath-)
- [CRA Proxying in Development](https://create-react-app.dev/docs/proxying-api-requests-in-development/)
