#!/bin/bash

# API Setup Validation Script
# Run this to quickly validate the API configuration is correct

echo "========================================="
echo "CHRIS Frontend - API Setup Validator"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}✗ ERROR: .env file not found${NC}"
    echo "  Create a .env file with required variables"
    exit 1
fi

echo -e "${GREEN}✓ .env file found${NC}"
echo ""

# Load environment variables
source .env

echo "Checking environment variables..."
echo "================================="

# Check REACT_APP_API_BASE
if [ -z "$REACT_APP_API_BASE" ]; then
    echo -e "${RED}✗ REACT_APP_API_BASE is not set${NC}"
    exit 1
else
    echo -e "REACT_APP_API_BASE: ${GREEN}$REACT_APP_API_BASE${NC}"
    
    # Validate HTTPS
    if [[ ! "$REACT_APP_API_BASE" == https://* ]]; then
        echo -e "${RED}  ✗ ERROR: Must use HTTPS protocol${NC}"
        exit 1
    fi
    
    # Validate port 3001
    if [[ ! "$REACT_APP_API_BASE" == *:3001* ]]; then
        echo -e "${YELLOW}  ⚠ WARNING: Port 3001 not found in URL${NC}"
    fi
fi

# Check REACT_APP_BACKEND_URL
if [ -z "$REACT_APP_BACKEND_URL" ]; then
    echo -e "${YELLOW}⚠ REACT_APP_BACKEND_URL is not set (optional)${NC}"
else
    echo -e "REACT_APP_BACKEND_URL: ${GREEN}$REACT_APP_BACKEND_URL${NC}"
fi

echo ""
echo "Testing backend connectivity..."
echo "==============================="

# Extract host from REACT_APP_API_BASE
BACKEND_URL="${REACT_APP_API_BASE:-$REACT_APP_BACKEND_URL}"

if [ -z "$BACKEND_URL" ]; then
    echo -e "${RED}✗ No backend URL configured${NC}"
    exit 1
fi

# Test health endpoint
HEALTH_URL="$BACKEND_URL/api/v1/health"
echo "Testing: $HEALTH_URL"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$HEALTH_URL" 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Backend is reachable (HTTP $HTTP_CODE)${NC}"
elif [ "$HTTP_CODE" = "000" ]; then
    echo -e "${YELLOW}⚠ Cannot connect to backend (connection failed)${NC}"
    echo "  Make sure backend is running on port 3001"
else
    echo -e "${YELLOW}⚠ Backend responded with HTTP $HTTP_CODE${NC}"
fi

echo ""
echo "Checking file structure..."
echo "=========================="

# Check critical files
FILES=(
    "src/services/api.js"
    "src/config/apiConfig.js"
    "src/utils/apiUrlValidator.js"
    "src/utils/apiMonitor.js"
    "src/setupProxy.js"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (missing)"
    fi
done

echo ""
echo "========================================="
echo "Validation Complete"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Start dev server: npm start"
echo "2. Open browser console"
echo "3. Run: window.runApiTests()"
echo "4. Check Network tab for HTTPS requests"
echo ""
echo "For detailed testing, see TESTING_API_FIX.md"
