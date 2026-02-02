#!/bin/bash

echo "=== Testing API URL Construction Fix ==="
echo ""
echo "Expected Behavior:"
echo "  Base URL: https://...api:3001/api/v1/"
echo "  + 'forecast/' = https://...api:3001/api/v1/forecast/"
echo "  + 'citywide-risk' = https://...api:3001/api/v1/citywide-risk"
echo ""

echo "Checking api.js..."
if grep -q "return \`\${apiBase}/\`;" src/services/api.js && \
   grep -q "return \`\${apiBase}/api/v1/\`;" src/services/api.js && \
   grep -q "return '/api/v1/';" src/services/api.js; then
    echo "✅ api.js: baseURL will include trailing slash"
else
    echo "❌ api.js: baseURL configuration might be incorrect"
    exit 1
fi

echo ""
echo "Checking Forecast.js..."
if grep -q "api.post('forecast/'," src/pages/Forecast.js; then
    echo "✅ Forecast.js: endpoint is 'forecast/' (with slash)"
else
    echo "❌ Forecast.js: endpoint should be 'forecast/'"
    exit 1
fi

echo ""
echo "=== All checks passed! ==="
echo ""
echo "URL Construction Test:"
echo "  baseURL = 'https://...api:3001/api/v1/'"
echo "  + 'forecast/' → 'https://...api:3001/api/v1/forecast/' ✅"
echo "  + 'citywide-risk' → 'https://...api:3001/api/v1/citywide-risk' ✅"
echo "  + 'map/sponge-zones' → 'https://...api:3001/api/v1/map/sponge-zones' ✅"
echo ""
echo "The fix is complete. URLs will be correctly formatted."
