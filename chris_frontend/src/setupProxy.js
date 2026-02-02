/**
 * Configure the development server to properly handle proxied paths.
 * This is automatically loaded by Create React App's dev server.
 * 
 * CRITICAL: This proxy configuration ONLY affects the webpack dev server serving
 * frontend assets under /proxy/3000. Backend API calls to port 3001 are made 
 * directly by the browser using absolute URLs and are NOT proxied.
 * 
 * @param {object} app - Express app instance from webpack-dev-server
 */
module.exports = function(app) {
  console.log('✓ setupProxy.js loaded - Dev server configured for /proxy/3000 path');
  console.log('  PUBLIC_URL:', process.env.PUBLIC_URL);
  console.log('  WDS_SOCKET_PATH:', process.env.WDS_SOCKET_PATH);
  console.log('  NOTE: API calls to port 3001 use absolute URLs and bypass this proxy');
  
  // CRITICAL: Set headers BEFORE response is processed
  app.use((req, res, next) => {
    // Only apply to frontend asset requests, NOT API calls
    // API calls go directly to port 3001 and never hit this proxy
    if (req.path.startsWith('/api/')) {
      console.error('[PROXY WARNING] API path detected in dev server - this should NOT happen!');
      console.error('  Path:', req.path);
      console.error('  API calls should go directly to port 3001 with absolute URLs');
      return res.status(502).json({ 
        error: 'API calls should not be proxied through dev server',
        message: 'Use absolute URLs to port 3001 instead'
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
    
    // Log requests for debugging (only non-API)
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    
    next();
  });
};
