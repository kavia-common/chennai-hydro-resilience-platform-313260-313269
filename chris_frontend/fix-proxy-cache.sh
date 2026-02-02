#!/bin/bash
set -e

echo "🔧 Fixing proxy cache and dev server configuration..."
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

# Step 1: Kill any running dev server
echo "1️⃣  Stopping any running dev server..."
pkill -f "react-scripts start" 2>/dev/null || true
pkill -f "node.*webpack" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 2
echo "   ✓ Dev server stopped"
echo ""

# Step 2: Clear all webpack caches
echo "2️⃣  Clearing webpack and build caches..."
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf build 2>/dev/null || true
rm -rf .cache 2>/dev/null || true
echo "   ✓ Caches cleared"
echo ""

# Step 3: Verify environment configuration
echo "3️⃣  Verifying environment configuration..."
if grep -q "PUBLIC_URL=/proxy/3000" .env.development 2>/dev/null; then
    echo "   ✓ PUBLIC_URL set in .env.development"
else
    echo "   ⚠️  Setting PUBLIC_URL in .env.development"
    echo "PUBLIC_URL=/proxy/3000" >> .env.development
fi

if grep -q "WDS_SOCKET_PATH=/proxy/3000/ws" .env.development 2>/dev/null; then
    echo "   ✓ WDS_SOCKET_PATH set in .env.development"
else
    echo "   ⚠️  Setting WDS_SOCKET_PATH in .env.development"
    echo "WDS_SOCKET_PATH=/proxy/3000/ws" >> .env.development
fi
echo ""

# Step 4: Display current configuration
echo "4️⃣  Current configuration:"
echo "   PUBLIC_URL: $(grep PUBLIC_URL .env.development | cut -d'=' -f2)"
echo "   WDS_SOCKET_PATH: $(grep WDS_SOCKET_PATH .env.development | cut -d'=' -f2)"
echo "   homepage (package.json): $(grep '"homepage"' package.json | cut -d'"' -f4)"
echo ""

# Step 5: Start dev server
echo "5️⃣  Starting dev server with correct configuration..."
echo "   Access at: https://vscode-internal-27819-beta.beta01.cloud.kavia.ai/proxy/3000/"
echo "   Press Ctrl+C to stop"
echo ""
echo "================================================"
echo ""

# Export env vars and start
export PORT=3000
export DANGEROUSLY_DISABLE_HOST_CHECK=true
export WDS_SOCKET_PATH=/proxy/3000/ws
export PUBLIC_URL=/proxy/3000
export BROWSER=none

npm start
