#!/usr/bin/env node

/**
 * Validation script to check API URL configuration.
 * Run this to verify the HTTPS fix is working correctly.
 * 
 * Usage: node validate-api-urls.js
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('CHRIS Frontend - API URL Configuration Validator');
console.log('='.repeat(60));
console.log();

let hasErrors = false;

// Check 1: Verify .env file has correct URLs
console.log('✓ Checking environment variables...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const apiBase = envContent.match(/REACT_APP_API_BASE=(.*)/);
  const backendUrl = envContent.match(/REACT_APP_BACKEND_URL=(.*)/);
  
  if (apiBase) {
    const url = apiBase[1].trim();
    console.log(`  REACT_APP_API_BASE: ${url}`);
    
    if (!url.startsWith('https://')) {
      console.error('  ❌ ERROR: Must use HTTPS protocol');
      hasErrors = true;
    }
    if (!url.includes(':3001')) {
      console.error('  ❌ ERROR: Must include port 3001');
      hasErrors = true;
    }
    if (url.includes('/api/v1')) {
      console.warn('  ⚠️  WARNING: Should not include /api/v1 in env var (interceptor adds it)');
    }
  } else {
    console.error('  ❌ ERROR: REACT_APP_API_BASE not found');
    hasErrors = true;
  }
  
  if (backendUrl) {
    const url = backendUrl[1].trim();
    console.log(`  REACT_APP_BACKEND_URL: ${url}`);
    
    if (!url.startsWith('https://')) {
      console.error('  ❌ ERROR: Must use HTTPS protocol');
      hasErrors = true;
    }
    if (!url.includes(':3001')) {
      console.error('  ❌ ERROR: Must include port 3001');
      hasErrors = true;
    }
  }
} else {
  console.error('  ❌ ERROR: .env file not found');
  hasErrors = true;
}
console.log();

// Check 2: Verify apiConfig.js returns origin only
console.log('✓ Checking apiConfig.js...');
const apiConfigPath = path.join(__dirname, 'src', 'config', 'apiConfig.js');
if (fs.existsSync(apiConfigPath)) {
  const apiConfigContent = fs.readFileSync(apiConfigPath, 'utf-8');
  
  if (apiConfigContent.includes('urlObj.origin')) {
    console.log('  ✓ Returns origin only (correct)');
  } else {
    console.error('  ❌ ERROR: Should return urlObj.origin');
    hasErrors = true;
  }
  
  if (apiConfigContent.includes('startsWith(\'http://\')')) {
    console.log('  ✓ Has HTTP validation check');
  } else {
    console.warn('  ⚠️  WARNING: Missing HTTP validation');
  }
} else {
  console.error('  ❌ ERROR: apiConfig.js not found');
  hasErrors = true;
}
console.log();

// Check 3: Verify api.js has manual URL construction
console.log('✓ Checking api.js...');
const apiPath = path.join(__dirname, 'src', 'services', 'api.js');
if (fs.existsSync(apiPath)) {
  const apiContent = fs.readFileSync(apiPath, 'utf-8');
  
  if (apiContent.includes('/api/v1/${path}')) {
    console.log('  ✓ Has manual URL construction in interceptor');
  } else {
    console.error('  ❌ ERROR: Missing manual URL construction');
    hasErrors = true;
  }
  
  if (apiContent.includes('config.baseURL = BASE_URL')) {
    console.log('  ✓ Sets baseURL in interceptor');
  } else {
    console.warn('  ⚠️  WARNING: May not be setting baseURL correctly');
  }
  
  if (apiContent.includes(':3001')) {
    console.log('  ✓ Has port 3001 validation');
  } else {
    console.warn('  ⚠️  WARNING: Missing port validation');
  }
} else {
  console.error('  ❌ ERROR: api.js not found');
  hasErrors = true;
}
console.log();

// Check 4: Verify component API calls use clean paths
console.log('✓ Checking component API calls...');
const componentsToCheck = [
  { file: 'src/pages/Dashboard.js', calls: ['citywide-risk'] },
  { file: 'src/pages/ZoneExplorer.js', calls: ['map/sponge-zones'] },
  { file: 'src/pages/Forecast.js', calls: ['forecast'] },
];

for (const component of componentsToCheck) {
  const componentPath = path.join(__dirname, component.file);
  if (fs.existsSync(componentPath)) {
    const content = fs.readFileSync(componentPath, 'utf-8');
    let allGood = true;
    
    for (const call of component.calls) {
      if (content.includes(`'${call}'`) || content.includes(`"${call}"`)) {
        // Check it's not using leading slash
        if (content.includes(`'/${call}'`) || content.includes(`"/${call}"`)) {
          console.error(`  ❌ ERROR: ${component.file} uses leading slash in '${call}'`);
          hasErrors = true;
          allGood = false;
        }
      }
    }
    
    if (allGood) {
      console.log(`  ✓ ${component.file} - API calls OK`);
    }
  } else {
    console.warn(`  ⚠️  WARNING: ${component.file} not found`);
  }
}
console.log();

// Summary
console.log('='.repeat(60));
if (hasErrors) {
  console.log('❌ VALIDATION FAILED - Please fix the errors above');
  console.log('='.repeat(60));
  process.exit(1);
} else {
  console.log('✅ VALIDATION PASSED - API URL configuration looks good!');
  console.log('='.repeat(60));
  console.log();
  console.log('Next steps:');
  console.log('1. Start the dev server: npm start');
  console.log('2. Check browser console for correct HTTPS URLs');
  console.log('3. Verify no mixed-content warnings');
  console.log('4. Test Dashboard, Zone Explorer, and Forecast pages');
  process.exit(0);
}
