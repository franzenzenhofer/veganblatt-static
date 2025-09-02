#!/bin/bash

# VeganBlatt Static Site Health Check Script
# Usage: ./scripts/health-check.sh

SITE_URL="https://82e48f17.veganblatt-static.pages.dev"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "   VeganBlatt Static Site Health Check"
echo "========================================"
echo ""
echo "Site: $SITE_URL"
echo "Time: $(date)"
echo ""

# Function to check URL
check_url() {
    local url=$1
    local name=$2
    local expected_code=$3
    
    response=$(curl -s -o /dev/null -w "%{http_code},%{time_total}" "$url")
    http_code=$(echo $response | cut -d',' -f1)
    time_total=$(echo $response | cut -d',' -f2)
    
    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓${NC} $name"
        echo "  Status: $http_code, Time: ${time_total}s"
    else
        echo -e "${RED}✗${NC} $name"
        echo "  Expected: $expected_code, Got: $http_code, Time: ${time_total}s"
        ((errors++))
    fi
    echo ""
}

errors=0

# Check main pages
echo "Checking Main Pages:"
echo "--------------------"
check_url "$SITE_URL" "Homepage" "200"
check_url "$SITE_URL/articles" "Articles List" "200"
check_url "$SITE_URL/recipes" "Recipes List" "200"
check_url "$SITE_URL/about/impressum" "Impressum" "200"

# Check resources
echo "Checking Resources:"
echo "-------------------"
check_url "$SITE_URL/css/styles.css" "Stylesheet" "200"
check_url "$SITE_URL/i/assets/veganblatt-logo.svg" "Logo" "200"

# Check sample content
echo "Checking Sample Content:"
echo "------------------------"
check_url "$SITE_URL/a/2024-10-30-jackfruit-wraps-mit-avocado.html" "Sample Article" "200"
check_url "$SITE_URL/r/2016-12-18-bunte-spiral-tarte.html" "Sample Recipe" "200"

# Performance check
echo "Performance Check:"
echo "------------------"
start_time=$(date +%s%N)
curl -s -o /dev/null "$SITE_URL"
end_time=$(date +%s%N)
load_time=$(( ($end_time - $start_time) / 1000000 ))

if [ $load_time -lt 500 ]; then
    echo -e "${GREEN}✓${NC} Homepage loads in ${load_time}ms (< 500ms)"
elif [ $load_time -lt 1000 ]; then
    echo -e "${YELLOW}⚠${NC} Homepage loads in ${load_time}ms (< 1s)"
else
    echo -e "${RED}✗${NC} Homepage loads in ${load_time}ms (> 1s)"
    ((errors++))
fi

echo ""
echo "========================================"
if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
else
    echo -e "${RED}✗ $errors check(s) failed${NC}"
    exit 1
fi
echo "========================================"