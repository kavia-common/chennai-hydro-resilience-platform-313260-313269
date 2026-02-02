/**
 * Diagnostic utility to validate API URL configuration and detect common issues.
 * This helps identify mixed-content, proxy, and URL construction problems.
 */

// PUBLIC_INTERFACE
/**
 * Run comprehensive diagnostics on API URL configuration.
 * @returns {object} Diagnostic results with status and issues
 */
export const runApiDiagnostics = () => {
  const results = {
    status: 'PASS',
    issues: [],
    warnings: [],
    info: [],
  };

  // Check environment variables
  const apiBase = process.env.REACT_APP_API_BASE;
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  if (!apiBase && !backendUrl) {
    results.status = 'FAIL';
    results.issues.push('No backend URL configured (missing REACT_APP_API_BASE and REACT_APP_BACKEND_URL)');
  }

  const baseUrl = apiBase || backendUrl;

  if (baseUrl) {
    results.info.push(`Backend URL: ${baseUrl}`);

    // Check protocol
    if (!baseUrl.startsWith('https://')) {
      results.status = 'FAIL';
      results.issues.push(`Backend URL must use HTTPS, got: ${baseUrl.split('://')[0]}`);
    }

    // Check port
    if (!baseUrl.includes(':3001')) {
      results.status = 'FAIL';
      results.issues.push(`Backend URL missing port 3001: ${baseUrl}`);
    }

    // Check for trailing path (should not have /api/v1)
    if (baseUrl.includes('/api/v1')) {
      results.warnings.push('Backend URL should not include /api/v1 path (will be added automatically)');
    }
  }

  // Check window location (frontend URL)
  const frontendUrl = window.location.origin;
  results.info.push(`Frontend URL: ${frontendUrl}`);

  if (!frontendUrl.startsWith('https://')) {
    results.warnings.push('Frontend is not served over HTTPS - this may cause mixed-content errors');
  }

  // Check if frontend and backend are on same host
  try {
    if (baseUrl) {
      const backendHost = new URL(baseUrl).hostname;
      const frontendHost = new URL(frontendUrl).hostname;
      
      if (backendHost === frontendHost) {
        results.info.push('Frontend and backend are on the same host (good for CORS)');
      } else {
        results.warnings.push(`Frontend (${frontendHost}) and backend (${backendHost}) are on different hosts`);
      }
    }
  } catch (error) {
    results.warnings.push(`Failed to parse URLs: ${error.message}`);
  }

  // Check for common proxy issues
  if (baseUrl && !baseUrl.includes(':3001')) {
    results.issues.push('Port 3001 not detected - API calls may be proxied incorrectly');
  }

  return results;
};

// PUBLIC_INTERFACE
/**
 * Validate a constructed API URL before making a request.
 * @param {string} url - The URL to validate
 * @returns {object} Validation result with isValid flag and issues
 */
export const validateApiUrl = (url) => {
  const result = {
    isValid: true,
    issues: [],
  };

  if (!url) {
    result.isValid = false;
    result.issues.push('URL is empty or undefined');
    return result;
  }

  // Check protocol
  if (!url.startsWith('https://')) {
    result.isValid = false;
    result.issues.push(`URL must use HTTPS, got: ${url.split('://')[0] || 'no protocol'}`);
  }

  // Check port
  if (!url.includes(':3001')) {
    result.isValid = false;
    result.issues.push('URL missing port 3001');
  }

  // Check for /api/v1 path
  if (!url.includes('/api/v1/')) {
    result.isValid = false;
    result.issues.push('URL missing /api/v1/ path');
  }

  // Check for common mistakes
  if (url.includes(':3000')) {
    result.isValid = false;
    result.issues.push('URL incorrectly uses port 3000 (frontend) instead of 3001 (backend)');
  }

  if (url.startsWith('http://') && !url.startsWith('https://')) {
    result.isValid = false;
    result.issues.push('URL uses HTTP instead of HTTPS - will cause mixed-content errors');
  }

  return result;
};

// PUBLIC_INTERFACE
/**
 * Log diagnostic information to console.
 */
export const logApiDiagnostics = () => {
  console.group('🔍 API Configuration Diagnostics');
  
  const diagnostics = runApiDiagnostics();
  
  console.log('Status:', diagnostics.status);
  
  if (diagnostics.issues.length > 0) {
    console.group('❌ Issues:');
    diagnostics.issues.forEach(issue => console.error(`  - ${issue}`));
    console.groupEnd();
  }
  
  if (diagnostics.warnings.length > 0) {
    console.group('⚠️  Warnings:');
    diagnostics.warnings.forEach(warning => console.warn(`  - ${warning}`));
    console.groupEnd();
  }
  
  if (diagnostics.info.length > 0) {
    console.group('ℹ️  Info:');
    diagnostics.info.forEach(info => console.info(`  - ${info}`));
    console.groupEnd();
  }
  
  console.groupEnd();
  
  return diagnostics;
};

export default {
  runApiDiagnostics,
  validateApiUrl,
  logApiDiagnostics,
};
