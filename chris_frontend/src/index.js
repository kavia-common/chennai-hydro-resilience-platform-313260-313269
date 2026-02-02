import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { validateEnvironmentURLs } from './utils/urlValidator';

// Validate environment URLs on startup to catch mixed-content issues early
validateEnvironmentURLs();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
