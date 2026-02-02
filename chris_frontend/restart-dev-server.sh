#!/bin/bash

# Restart script for React dev server with proxy configuration
# This ensures all webpack cache is cleared and the server starts with correct PUBLIC_URL

echo "🔄 Restarting React dev server with proxy configuration..."
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

# Check if dev server is running and warn user
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 3000 is in use. Please stop the current dev server first (Ctrl+C in the terminal where it's running)"
    echo ""
    exit 1
fi

# Clear webpack cache
echo "🧹 Clearing webpack cache..."
find node_modules/.cache -type f -delete 2>/dev/null || true
echo "✓ Cache cleared"
echo ""

# Verify configuration
echo "📋 Verifying configuration..."
if grep -q "PUBLIC_URL=/proxy/3000" .env 2>/dev/null; then
    echo "✓ PUBLIC_URL is set in .env"
else
    echo "⚠️  PUBLIC_URL not found in .env - setting it now..."
    echo "PUBLIC_URL=/proxy/3000" >> .env
fi

if grep -q "homepage.*proxy/3000" package.json 2>/dev/null; then
    echo "✓ homepage is set in package.json"
else
    echo "⚠️  homepage not found in package.json"
fi
echo ""

# Start the dev server
echo "🚀 Starting dev server..."
echo "   Access at: https://your-proxy-domain/proxy/3000/"
echo "   Press Ctrl+C to stop"
echo ""

npm start
