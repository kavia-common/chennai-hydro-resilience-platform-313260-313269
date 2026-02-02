/**
 * Webpack configuration overrides for Create React App.
 * Requires react-app-rewired or craco to load.
 * 
 * This fixes the dev server to properly serve assets under /proxy/3000 path
 * and prevents HTML being served for JS/JSON files (fixes 304 Not Modified issue).
 */

module.exports = function override(config, env) {
  // Only apply in development
  if (env === 'development') {
    // Ensure output.publicPath matches PUBLIC_URL
    if (config.output) {
      config.output.publicPath = process.env.PUBLIC_URL || '/proxy/3000/';
    }
    
    // Configure devServer options
    if (config.devServer) {
      config.devServer = {
        ...config.devServer,
        // CRITICAL: Completely disable historyApiFallback
        // This prevents index.html from being served for asset requests
        historyApiFallback: false,
        
        // Set public path
        publicPath: process.env.PUBLIC_URL || '/proxy/3000/',
        
        // Disable all caching and ETag generation
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        
        // Disable ETag generation at webpack-dev-middleware level
        devMiddleware: {
          ...config.devServer.devMiddleware,
          writeToDisk: false,
          // Disable ETag generation
          etag: false,
          lastModified: false,
        },
        
        // Allow all hosts
        allowedHosts: 'all',
        
        // Disable host check
        disableHostCheck: true,
        
        // WebSocket path for HMR
        sockPath: process.env.WDS_SOCKET_PATH || '/proxy/3000/ws',
        
        // Disable watching for changes to node_modules
        watchOptions: {
          ignored: /node_modules/,
        },
      };
    }
    
    // Disable content hashing in development to prevent cache confusion
    if (config.output) {
      config.output.filename = 'static/js/[name].js';
      config.output.chunkFilename = 'static/js/[name].chunk.js';
    }
  }
  
  return config;
};
