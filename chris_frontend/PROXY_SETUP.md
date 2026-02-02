# React App Proxy Configuration

## Issue
When the React development server is accessed through a reverse proxy (e.g., `/proxy/3000/`), assets fail to load with 404 errors because they reference absolute paths like `/static/js/bundle.js` instead of `/proxy/3000/static/js/bundle.js`.

## Solution
This has been fixed by configuring both the `PUBLIC_URL` environment variable and the `homepage` field in `package.json`.

### Configuration Files Updated

1. **`.env`** - Added `PUBLIC_URL=/proxy/3000`
2. **`package.json`** - Added `"homepage": "/proxy/3000"`

### How It Works

- `PUBLIC_URL`: Tells Create React App to prefix all asset paths with this value
- `homepage`: Used by webpack to configure the public path for bundled assets

### For Different Environments

**Development (behind proxy):**
```bash
PUBLIC_URL=/proxy/3000 npm start
```

**Development (direct access):**
```bash
PUBLIC_URL=/ npm start
# or
unset PUBLIC_URL && npm start
```

**Production build:**
```bash
PUBLIC_URL=/proxy/3000 npm run build
```

### After Configuration Changes

**Important:** After modifying `.env` or `package.json`, you must restart the development server for changes to take effect:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm start
```

### Testing

1. Restart the dev server
2. Access the app through the proxy URL
3. Check browser DevTools Network tab - assets should load from `/proxy/3000/static/...`
4. Verify no 404 errors for bundle.js or other assets

### Troubleshooting

If assets still fail to load:

1. Clear browser cache (hard refresh: Ctrl+Shift+R)
2. Verify `PUBLIC_URL` is set in `.env`
3. Verify `homepage` is set in `package.json`
4. Check that the dev server was restarted after config changes
5. Inspect the HTML source - script/link tags should use `/proxy/3000/` prefix
