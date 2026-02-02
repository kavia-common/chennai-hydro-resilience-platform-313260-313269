/**
 * Webpack configuration overrides for Create React App.
 * Requires react-app-rewired or craco to load.
 * 
 * This fixes the dev server to properly serve assets under /proxy/3000 path
 * and prevents HTML being served for JS/JSON files.
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
        // Disable historyApiFallback that causes all 404s to return index.html
        historyApiFallback: false,
        // Set public path
        publicPath: process.env.PUBLIC_URL || '/proxy/3000/',
        // Disable caching
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        // Allow all hosts
        allowedHosts: 'all',
        // Disable host check
        disableHostCheck: true,
        // WebSocket path for HMR
        sockPath: process.env.WDS_SOCKET_PATH || '/proxy/3000/ws',
      };
    }
  }
  
  return config;
};
