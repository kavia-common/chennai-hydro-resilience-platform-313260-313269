/**
 * Configure the development server to properly handle proxied paths.
 * This is automatically loaded by Create React App's dev server.
 * 
 * CRITICAL FIX: Prevents 304 Not Modified responses that serve cached HTML
 * instead of actual JS/JSON content under /proxy/3000 path.
 * 
 * @param {object} app - Express app instance from webpack-dev-server
 */
module.exports = function(app) {
  console.log('✓ setupProxy.js loaded - Dev server configured for /proxy/3000 path');
  console.log('  PUBLIC_URL:', process.env.PUBLIC_URL);
  console.log('  WDS_SOCKET_PATH:', process.env.WDS_SOCKET_PATH);
  
  // CRITICAL FIX: Intercept response to remove ETags and force 200 status
  // This prevents 304 Not Modified responses that serve wrong content
  app.use((req, res, next) => {
    // Store original res.send and res.sendFile
    const originalSend = res.send;
    const originalSendFile = res.sendFile;
    const originalEnd = res.end;
    
    // Override res.send to remove ETag header
    res.send = function(data) {
      res.removeHeader('ETag');
      res.removeHeader('Last-Modified');
      return originalSend.call(this, data);
    };
    
    // Override res.sendFile to remove ETag header
    res.sendFile = function() {
      res.removeHeader('ETag');
      res.removeHeader('Last-Modified');
      return originalSendFile.apply(this, arguments);
    };
    
    // Override res.end to ensure no ETag
    res.end = function() {
      res.removeHeader('ETag');
      res.removeHeader('Last-Modified');
      return originalEnd.apply(this, arguments);
    };
    
    next();
  });
  
  // Set aggressive no-cache headers and correct MIME types
  app.use((req, res, next) => {
    // Remove any existing ETag from request to force fresh response
    delete req.headers['if-none-match'];
    delete req.headers['if-modified-since'];
    
    // Set no-cache headers to prevent 304 responses
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Remove ETag support entirely to prevent 304
    res.removeHeader('ETag');
    res.removeHeader('Last-Modified');
    
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
    } else if (req.path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
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
