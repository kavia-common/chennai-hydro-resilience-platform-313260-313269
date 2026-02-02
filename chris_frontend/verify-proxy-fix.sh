#!/bin/bash

echo "🔍 Verifying proxy path configuration..."
echo ""

cd "$(dirname "$0")"

# Check files exist
echo "1️⃣  Checking configuration files..."
if [ -f ".env.development" ]; then
    echo "   ✓ .env.development exists"
else
    echo "   ✗ .env.development missing!"
    exit 1
fi

if [ -f "src/setupProxy.js" ]; then
    echo "   ✓ setupProxy.js exists"
else
    echo "   ✗ setupProxy.js missing!"
    exit 1
fi

if [ -f "public/index.html" ]; then
    echo "   ✓ index.html exists"
else
    echo "   ✗ index.html missing!"
    exit 1
fi
echo ""

# Check environment variables
echo "2️⃣  Checking environment variables..."
PUBLIC_URL=$(grep "^PUBLIC_URL=" .env.development | cut -d'=' -f2)
WDS_SOCKET=$(grep "^WDS_SOCKET_PATH=" .env.development | cut -d'=' -f2)

if [ "$PUBLIC_URL" = "/proxy/3000" ]; then
    echo "   ✓ PUBLIC_URL correctly set to /proxy/3000"
else
    echo "   ✗ PUBLIC_URL is '$PUBLIC_URL' (should be /proxy/3000)"
fi

if [ "$WDS_SOCKET" = "/proxy/3000/ws" ]; then
    echo "   ✓ WDS_SOCKET_PATH correctly set to /proxy/3000/ws"
else
    echo "   ✗ WDS_SOCKET_PATH is '$WDS_SOCKET' (should be /proxy/3000/ws)"
fi
echo ""

# Check package.json homepage
echo "3️⃣  Checking package.json..."
HOMEPAGE=$(grep '"homepage"' package.json | cut -d'"' -f4)
if [ "$HOMEPAGE" = "/proxy/3000" ]; then
    echo "   ✓ homepage correctly set to /proxy/3000"
else
    echo "   ✗ homepage is '$HOMEPAGE' (should be /proxy/3000)"
fi
echo ""

# Check index.html has %PUBLIC_URL% placeholders
echo "4️⃣  Checking index.html PUBLIC_URL usage..."
if grep -q "%PUBLIC_URL%" public/index.html; then
    echo "   ✓ index.html uses %PUBLIC_URL% placeholders"
else
    echo "   ⚠️  Warning: index.html doesn't use %PUBLIC_URL%"
fi
echo ""

echo "✅ Configuration verification complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Run: chmod +x fix-proxy-cache.sh"
echo "   2. Run: ./fix-proxy-cache.sh"
echo "   3. Access: https://vscode-internal-27819-beta.beta01.cloud.kavia.ai/proxy/3000/"
echo "   4. Check DevTools Network tab - bundle.js should have Content-Type: application/javascript"
echo ""
