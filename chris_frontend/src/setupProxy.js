const path = require('path');
const fs = require('fs');

/**
 * Configure the development server to properly handle proxied paths.
 * This is automatically loaded by Create React App's dev server.
 * 
 * CRITICAL: This middleware runs BEFORE historyApiFallback, allowing us to
 * explicitly serve static assets and prevent HTML fallback.
 * 
 * @param {object} app - Express app instance from webpack-dev-server
 */
module.exports = function(app) {
  console.log('✓ setupProxy.js loaded - Dev server configured for /proxy/3000 path');
  console.log('  PUBLIC_URL:', process.env.PUBLIC_URL);
  console.log('  WDS_SOCKET_PATH:', process.env.WDS_SOCKET_PATH);
  
  // CRITICAL: Explicitly handle static assets BEFORE historyApiFallback
  app.use((req, res, next) => {
    const requestPath = req.path;
    
    // Check if this is an API call (should NEVER happen)
    if (requestPath.startsWith('/api/')) {
      console.error('══════════════════════════════════════════════════════════════');
      console.error('[PROXY ERROR] API path detected in dev server - MISCONFIGURATION!');
      console.error('  Request Path:', requestPath);
      console.error('  Expected URL format: https://host:3001/api/v1/...');
      console.error('══════════════════════════════════════════════════════════════');
      
      return res.status(502).json({ 
        error: 'API calls should not be proxied through dev server',
        message: 'Use absolute URLs to https://host:3001/api/v1/... instead',
        received_path: requestPath,
      });
    }
    
    // Set no-cache headers for ALL responses
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // CRITICAL: Set correct MIME types based on file extension
    if (requestPath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      console.log(`[JS] ${requestPath}`);
    } else if (requestPath.endsWith('.json')) {
      if (requestPath.includes('manifest.json')) {
        res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
        
        // CRITICAL: Explicitly serve manifest.json to prevent historyApiFallback
        const publicDir = path.join(__dirname, '../../public');
        const manifestPath = path.join(publicDir, 'manifest.json');
        
        if (fs.existsSync(manifestPath)) {
          console.log(`[MANIFEST] Serving from: ${manifestPath}`);
          return res.sendFile(manifestPath);
        }
      } else {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      console.log(`[JSON] ${requestPath}`);
    } else if (requestPath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
      console.log(`[CSS] ${requestPath}`);
    } else if (requestPath.endsWith('.map')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    } else if (requestPath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      console.log(`[HTML] ${requestPath}`);
    } else if (requestPath.match(/\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
      // Let static asset middleware handle these
      console.log(`[ASSET] ${requestPath}`);
    } else if (!requestPath.includes('hot-update') && !requestPath.includes('sockjs-node')) {
      // This is likely a navigation request
      console.log(`[NAV] ${requestPath}`);
    }
    
    next();
  });
};
