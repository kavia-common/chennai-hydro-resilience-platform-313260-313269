#!/bin/bash
# Quick script to apply the proxy cache fix

echo "🔧 Applying proxy cache fix..."
pkill -f "react-scripts start" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
rm -rf node_modules/.cache build 2>/dev/null || true
echo "✓ Caches cleared"
echo ""
echo "🚀 Starting dev server..."
echo "   Access at: https://vscode-internal-27819-beta.beta01.cloud.kavia.ai/proxy/3000/"
echo ""
npm start
