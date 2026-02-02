# API Quick Reference Card

## 🚀 Quick Start

```bash
# Validate setup
npm run validate-api

# Start dev server
npm start

# Test in browser
window.runApiTests()
```

## 🔧 Environment Variables

```bash
# Required in .env
REACT_APP_API_BASE=https://host:3001
REACT_APP_BACKEND_URL=https://host:3001
```

## 📝 Making API Calls

```javascript
import api from './services/api';

// GET with params
await api.get('citywide-risk', { params: { limit: 10 } });
// → https://host:3001/api/v1/citywide-risk?limit=10

// POST with body
await api.post('forecast', { years: 5 });
// → https://host:3001/api/v1/forecast

// GET nested path
await api.get('map/sponge-zones/123/details');
// → https://host:3001/api/v1/map/sponge-zones/123/details
```

## ✅ Expected URL Format

```
✓ https://host:3001/api/v1/endpoint
✗ http://host:3001/api/v1/endpoint    (HTTP)
✗ https://host/api/v1/endpoint        (no port)
✗ /api/v1/endpoint                    (relative)
```

## 🧪 Browser Console Commands

```javascript
// Run all tests
window.runApiTests()

// View API call log
window.apiMonitor.print()

// View statistics
window.apiMonitor.stats()

// Clear log
window.apiMonitor.clear()
```

## 🔍 Debugging

```javascript
// Check configuration
import { logApiConfig } from './utils/apiUrlValidator';
logApiConfig();

// Validate a URL
import { validateApiUrl } from './utils/apiUrlValidator';
validateApiUrl('https://host:3001/api/v1/test');

// Test connectivity
import { testApiConnectivity } from './utils/apiUrlValidator';
await testApiConnectivity('https://host:3001');
```

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| Mixed-content error | Check .env has HTTPS |
| Port missing | Add :3001 to URLs |
| CORS error | Check backend CORS config |
| 404 error | Verify backend is running |

## 📊 Network Tab Checks

1. Open DevTools → Network
2. Filter by XHR/Fetch
3. Verify all URLs:
   - Start with `https://`
   - Include `:3001`
   - Include `/api/v1/`

## 🎯 Success Checklist

- [ ] `npm run validate-api` passes
- [ ] `window.runApiTests()` passes
- [ ] No console errors
- [ ] Network tab shows HTTPS
- [ ] All pages load data

## 📚 Full Documentation

- **Technical Details:** `API_URL_FIX_FINAL.md`
- **Testing Guide:** `TESTING_API_FIX.md`
- **Deployment:** `FIX_DEPLOYMENT_SUMMARY.md`

---
**Need Help?** Run `npm run validate-api` first!
