# React App Proxy Configuration

## ⚠️ UPDATED FIX AVAILABLE

**See [PROXY_FIX_GUIDE.md](./PROXY_FIX_GUIDE.md) for the complete solution.**

## Quick Summary

### Issue
When the React development server is accessed through a reverse proxy (e.g., `/proxy/3000/`), assets fail to load because:
- The dev server returns HTML instead of JS/CSS/JSON files
- Assets are requested from `/static/...` instead of `/proxy/3000/static/...`
- "Unexpected token '<'" errors appear in console

### Solution Applied

1. **Environment Variables** (`.env` and `.env.development`):
   - `PUBLIC_URL=/proxy/3000` (NO `REACT_APP_` prefix!)
   - `WDS_SOCKET_PATH=/proxy/3000/ws`
   - `DANGEROUSLY_DISABLE_HOST_CHECK=true`

2. **package.json**:
   - `"homepage": "/proxy/3000"`
   - Updated start script with proper env vars

3. **setupProxy.js**:
   - Created at `src/setupProxy.js` for dev server configuration

### Critical Steps After Fix

```bash
# 1. Stop the dev server (Ctrl+C)

# 2. Clear webpack cache
rm -rf node_modules/.cache

# 3. Restart
npm start

# 4. Hard refresh browser (Ctrl+Shift+R)
```

### Verify Fix Works

1. Open browser DevTools → Network tab
2. Check assets load from `/proxy/3000/static/js/bundle.js` (not `/static/js/bundle.js`)
3. Verify response is JavaScript (not HTML)
4. No "Unexpected token '<'" errors in console

## Full Documentation

For detailed troubleshooting, testing procedures, and production build instructions, see:
**[PROXY_FIX_GUIDE.md](./PROXY_FIX_GUIDE.md)**
