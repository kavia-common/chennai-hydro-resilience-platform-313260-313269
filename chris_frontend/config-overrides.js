/**
 * Webpack configuration overrides for Create React App.
 * Requires react-app-rewired to load.
 * 
 * CRITICAL FIX: Configure historyApiFallback to never rewrite static assets.
 * The key is to use 'rewrites' with explicit asset exclusion patterns.
 */

module.exports = function override(config, env) {
  // Only apply in development
  if (env === 'development') {
    // Ensure output.publicPath matches PUBLIC_URL
    if (config.output) {
      config.output.publicPath = process.env.PUBLIC_URL || '/proxy/3000/';
      console.log('✓ Set output.publicPath to:', config.output.publicPath);
    }
    
    // Configure devServer - this is the CRITICAL section
    if (!config.devServer) {
      config.devServer = {};
    }
    
    // CRITICAL: Configure historyApiFallback with explicit rewrites
    // that EXCLUDE all static assets
    config.devServer.historyApiFallback = {
      // Disable the dot rule so files with extensions are not automatically excluded
      disableDotRule: true,
      
      // Explicitly define what gets rewritten
      rewrites: [
        // EXCLUDE all static assets - these should NEVER be rewritten
        { from: /\.js$/, to: (context) => context.parsedUrl.pathname },
        { from: /\.jsx$/, to: (context) => context.parsedUrl.pathname },
        { from: /\.ts$/, to: (context) => context.parsedUrl.pathname },
        { from: /\.tsx$/, to: (context) => context.parsedUrl.pathname },
        { from: /\.css$/, to: (context) => context.parsedUrl.pathname },
        { from: /\.json$/, to: (context) => context.parsedUrl.pathname },
        { from: /\.map$/, to: (context) => context.parsedUrl.pathname },
        { from: /\.ico$/, to: (context) => context.parsedUrl.pathname },
        { from: /\.png$/, to: (context) => context.parsedUrl.pathname },
        { from: /\.jpg$/, to: (context) => context.parsedUrl.pathname },
        { from: /\.jpeg$/, to: (context) => context.parsedUrl.pathname },
        { from: /\.gif$/, to: (context) => context.parsedUrl.pathname },
        { from: /\.svg$/, to: (context) => context.parsedUrl.pathname },
        { from: /\.woff$/, to: (context) => context.parsedUrl.pathname },
        { from: /\.woff2$/, to: (context) => context.parsedUrl.pathname },
        { from: /\.ttf$/, to: (context) => context.parsedUrl.pathname },
        { from: /\.eot$/, to: (context) => context.parsedUrl.pathname },
        { from: /\.webp$/, to: (context) => context.parsedUrl.pathname },
        
        // ONLY rewrite navigation requests (no extension) to index.html
        { 
          from: /^\/proxy\/3000\/[^.]*$/,
          to: '/proxy/3000/index.html'
        },
        // Rewrite root to index.html (for SPA routing)
        { 
          from: /^\/proxy\/3000\/?$/,
          to: '/proxy/3000/index.html'
        }
      ],
      
      // Verbose logging to debug
      verbose: true
    };
    
    // Set public path
    config.devServer.publicPath = process.env.PUBLIC_URL || '/proxy/3000/';
    
    // Disable all caching and ETag generation
    config.devServer.headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
    
    // Configure devMiddleware
    if (!config.devServer.devMiddleware) {
      config.devServer.devMiddleware = {};
    }
    
    config.devServer.devMiddleware = {
      ...config.devServer.devMiddleware,
      writeToDisk: false,
      // Disable ETag generation
      etag: false,
      lastModified: false,
      index: 'index.html',
      publicPath: process.env.PUBLIC_URL || '/proxy/3000/',
    };
    
    // CRITICAL: Bind to 0.0.0.0 so proxy can connect
    config.devServer.host = '0.0.0.0';
    config.devServer.port = 3000;
    
    // Allow all hosts
    config.devServer.allowedHosts = 'all';
    
    // WebSocket path for HMR
    if (!config.devServer.client) {
      config.devServer.client = {};
    }
    
    config.devServer.client.webSocketURL = {
      pathname: process.env.WDS_SOCKET_PATH || '/proxy/3000/ws',
    };
    
    // Disable watching node_modules
    config.devServer.watchOptions = {
      ignored: /node_modules/,
    };
    
    // Add static configuration for public directory
    config.devServer.static = {
      directory: require('path').join(__dirname, 'public'),
      publicPath: process.env.PUBLIC_URL || '/proxy/3000/',
      serveIndex: false,
      watch: true,
    };
    
    console.log('✓ Dev server configured with explicit asset exclusion from historyApiFallback');
  }
  
  return config;
};
