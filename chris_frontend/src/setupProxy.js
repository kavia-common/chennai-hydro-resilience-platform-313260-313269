/**
 * Configure the development server to properly handle proxied paths.
 * This is automatically loaded by Create React App's dev server.
 * 
 * CRITICAL FIX: Prevents 304 Not Modified responses that serve cached HTML
 * instead of actual JS/JSON content under /proxy/3000 path.
 * 
 * NOTE: This proxy configuration ONLY affects the webpack dev server serving
 * frontend assets. Backend API calls to port 3001 are made directly by the
 * browser and are NOT affected by this proxy setup.
 * 
 * @param {object} app - Express app instance from webpack-dev-server
 */
module.exports = function(app) {
  console.log('✓ setupProxy.js loaded - Dev server configured for /proxy/3000 path');
  console.log('  PUBLIC_URL:', process.env.PUBLIC_URL);
  console.log('  WDS_SOCKET_PATH:', process.env.WDS_SOCKET_PATH);
  
  // CRITICAL: Set headers BEFORE response is processed
  app.use((req, res, next) => {
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
    
    // Log requests for debugging
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    
    next();
  });
};
