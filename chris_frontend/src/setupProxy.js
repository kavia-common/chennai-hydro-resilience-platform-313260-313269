/**
 * Configure the development server to properly handle proxied paths.
 * This is automatically loaded by Create React App's dev server.
 * 
 * @param {object} app - Express app instance from webpack-dev-server
 */
module.exports = function(app) {
  console.log('✓ setupProxy.js loaded - Dev server configured for /proxy/3000 path');
  console.log('  PUBLIC_URL:', process.env.PUBLIC_URL);
  console.log('  WDS_SOCKET_PATH:', process.env.WDS_SOCKET_PATH);
  
  // CRITICAL FIX: Add middleware to set proper cache-control headers and MIME types
  // This prevents 304 Not Modified responses from serving cached HTML for JS/JSON files
  app.use((req, res, next) => {
    // Disable caching for all assets to prevent 304 with wrong ETag
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Set correct MIME types based on file extension
    if (req.path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (req.path.endsWith('.json')) {
      if (req.path.includes('manifest.json')) {
        res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
      } else {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
    } else if (req.path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (req.path.endsWith('.map')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    
    next();
  });
  
  // Log all requests for debugging
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
  });
};
