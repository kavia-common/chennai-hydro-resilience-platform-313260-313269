import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { getApiBaseURL } from './config/apiConfig';
import { validateApiUrl, logApiEnvironment } from './utils/apiValidator';

// Validate API configuration on startup
console.log('='.repeat(60));
console.log('CHRIS Frontend - API Configuration Validation');
console.log('='.repeat(60));

// Log environment
logApiEnvironment();

// Validate base URL
const baseUrl = getApiBaseURL();
const isValid = validateApiUrl(baseUrl + '/test');

if (!isValid) {
  console.error('CRITICAL: API configuration validation FAILED!');
  console.error('All API requests will likely fail due to mixed-content or invalid URLs.');
} else {
  console.log('SUCCESS: API configuration is valid');
}

console.log('='.repeat(60));

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
