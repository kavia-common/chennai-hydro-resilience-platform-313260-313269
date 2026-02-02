import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { enableAPIUrlMonitoring } from './utils/apiUrlValidator';

// Enable API URL monitoring in development mode
if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_NODE_ENV === 'development') {
  enableAPIUrlMonitoring();
  console.log('[CHRIS] API URL monitoring enabled for development');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
