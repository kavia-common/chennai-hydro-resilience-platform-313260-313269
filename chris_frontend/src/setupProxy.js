/**
 * Configure the development server to properly handle proxied paths.
 * This is automatically loaded by Create React App's dev server.
 * 
 * CRITICAL: This proxy configuration ONLY affects the webpack dev server serving
 * frontend assets under /proxy/3000. Backend API calls to port 3001 MUST use
 * absolute URLs and should NEVER hit this proxy.
 * 
 * @param {object} app - Express app instance from webpack-dev-server
 */
module.exports = function(app) {
  console.log('✓ setupProxy.js loaded - Dev server configured for /proxy/3000 path');
  console.log('  PUBLIC_URL:', process.env.PUBLIC_URL);
  console.log('  WDS_SOCKET_PATH:', process.env.WDS_SOCKET_PATH);
  console.log('  CRITICAL: API calls to port 3001 MUST use absolute URLs and bypass this proxy');
  
  // CRITICAL: Reject any API calls that incorrectly hit the dev server
  app.use((req, res, next) => {
    // Check if this is an API call (should NEVER happen)
    if (req.path.startsWith('/api/')) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[PROXY ERROR] API path detected in dev server - MISCONFIGURATION!');
      console.error('  Request Path:', req.path);
      console.error('  Request URL:', req.url);
      console.error('  Request Host:', req.headers.host);
      console.error('  Request Origin:', req.headers.origin);
      console.error('  User-Agent:', req.headers['user-agent']);
      console.error('');
      console.error('  ISSUE: API calls should go directly to port 3001 with absolute URLs');
      console.error('  Expected URL format: https://host:3001/api/v1/...');
      console.error('  NOT: /api/v1/... (relative)');
      console.error('═══════════════════════════════════════════════════════════');
      
      return res.status(502).json({ 
        error: 'API calls should not be proxied through dev server',
        message: 'Use absolute URLs to https://host:3001/api/v1/... instead',
        received_path: req.path,
        received_url: req.url
      });
    }
    
    // Remove client cache headers from request to force fresh response
    delete req.headers['if-none-match'];
    delete req.headers['if-modified-since'];
    
    // Set no-cache headers immediately
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Set correct MIME types based on file extension
    const path = req.path;
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (path.endsWith('.json')) {
      if (path.includes('manifest.json')) {
        res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
      } else {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (path.endsWith('.map')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    } else if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
    
    // Log non-API requests for debugging
    if (!path.includes('hot-update')) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${req.method} ${req.path}`);
    }
    
    next();
  });
};
