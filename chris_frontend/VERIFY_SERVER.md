# Dev Server Verification Guide

## ✅ Current Status

The React dev server is now **RUNNING** and properly configured:

- **Binding**: `0.0.0.0:3000` (accessible from all network interfaces)
- **PUBLIC_URL**: `/proxy/3000` (correct base path for proxied access)
- **WDS_SOCKET_PATH**: `/proxy/3000/ws` (WebSocket for HMR)
- **Host Check**: Disabled (allows proxy access)

## 🔍 Verification Steps

### 1. Confirm Server is Running

```bash
# Check if port 3000 is listening on all interfaces
netstat -tuln | grep :3000

# Expected output:
# tcp        0      0 0.0.0.0:3000            0.0.0.0:*               LISTEN
```

### 2. Test Proxy Access

Open your browser and navigate to:
```
https://vscode-internal-27819-beta.beta01.cloud.kavia.ai/proxy/3000/
```

### 3. Check Browser DevTools

Open DevTools (F12) and verify:

**Network Tab:**
- ✓ Status: `200 OK` for all assets (not 500 or 404)
- ✓ `bundle.js` loads from `/proxy/3000/static/js/bundle.js`
- ✓ `manifest.json` loads from `/proxy/3000/manifest.json`
- ✓ Content-Type headers are correct:
  - `application/javascript` for .js files
  - `application/manifest+json` for manifest.json
  - `text/html` for index.html

**Console Tab:**
- ✓ No "ECONNREFUSED" errors
- ✓ No "Unexpected token '<'" errors
- ✓ App loads successfully

### 4. Test Hot Module Replacement (HMR)

1. Make a small change to any React component
2. Save the file
3. The browser should update automatically without full page reload
4. Check console for WebSocket connection: `ws://...vscode-internal.../proxy/3000/ws`

## 📋 Configuration Summary

### Files Modified

1. **`.env.development`**
   - Added: `HOST=0.0.0.0`
   - Ensures dev server binds to all interfaces

2. **`package.json`**
   - Updated start script to include `HOST=0.0.0.0`

3. **`config-overrides.js`**
   - Added: `host: '0.0.0.0'` in devServer config

### Key Environment Variables

```env
HOST=0.0.0.0                              # Bind to all interfaces
PORT=3000                                  # Dev server port
PUBLIC_URL=/proxy/3000                     # Base path for assets
WDS_SOCKET_PATH=/proxy/3000/ws            # WebSocket for HMR
DANGEROUSLY_DISABLE_HOST_CHECK=true       # Allow proxy access
```

## 🐛 Troubleshooting

### If you still see "ECONNREFUSED"

1. **Check if server is running:**
   ```bash
   ps aux | grep react-scripts
   ```

2. **Restart the server:**
   ```bash
   cd chennai-hydro-resilience-platform-313260-313269/chris_frontend
   npm start
   ```

3. **Verify HOST setting:**
   ```bash
   grep HOST .env.development
   # Should show: HOST=0.0.0.0
   ```

### If assets return 404

1. **Check PUBLIC_URL:**
   ```bash
   grep PUBLIC_URL .env.development
   # Should show: PUBLIC_URL=/proxy/3000
   ```

2. **Clear webpack cache:**
   ```bash
   rm -rf node_modules/.cache
   npm start
   ```

### If you see 304 or wrong content

- This should be fixed by `setupProxy.js` which disables caching
- Try hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
- Use Incognito/Private window for testing

## 🚀 Success Indicators

You'll know everything is working when:

1. ✅ Browser shows the CHRIS login page
2. ✅ No console errors
3. ✅ All assets load with 200 OK status
4. ✅ Network tab shows correct paths: `/proxy/3000/static/...`
5. ✅ HMR works (changes appear without full reload)

## 📝 Notes

- **Dev server must stay running** for the proxy to work
- The server runs as a long-running process in the background
- If you stop it, restart with: `npm start`
- Access URL: `https://vscode-internal-27819-beta.beta01.cloud.kavia.ai/proxy/3000/`

---

**Last Updated**: 2026-02-02  
**Status**: ✅ Dev server running on 0.0.0.0:3000  
**Proxy Path**: /proxy/3000
