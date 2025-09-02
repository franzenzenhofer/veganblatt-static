#!/bin/bash

# Post-deployment verification script
# Automatically runs after npm run deploy

SITE_URL="${1:-https://82e48f17.veganblatt-static.pages.dev}"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "=========================================="
echo -e "${BLUE}  🚀 POST-DEPLOYMENT VERIFICATION${NC}"
echo "=========================================="
echo "Site: $SITE_URL"
echo "Time: $(date)"
echo ""

# Function to test URL
test_url() {
    local url=$1
    local name=$2
    
    response=$(curl -s -o /dev/null -w "%{http_code},%{time_total},%{size_download}" "$url" 2>/dev/null)
    http_code=$(echo $response | cut -d',' -f1)
    time_total=$(echo $response | cut -d',' -f2)
    size=$(echo $response | cut -d',' -f3)
    
    # Convert time to milliseconds
    time_ms=$(echo "$time_total * 1000" | bc | cut -d'.' -f1)
    
    # Convert size to KB
    size_kb=$(echo "scale=1; $size / 1024" | bc)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "308" ]; then
        echo -e "${GREEN}✓${NC} $name"
        echo "  Status: $http_code | Time: ${time_ms}ms | Size: ${size_kb}KB"
        return 0
    else
        echo -e "${RED}✗${NC} $name"
        echo "  Expected: 200, Got: $http_code"
        return 1
    fi
}

errors=0

# Test critical pages
echo -e "${BLUE}Testing Critical Pages:${NC}"
echo "------------------------"
test_url "$SITE_URL" "Homepage" || ((errors++))
test_url "$SITE_URL/articles" "Articles List" || ((errors++))
test_url "$SITE_URL/recipes" "Recipes List" || ((errors++))
test_url "$SITE_URL/about/impressum" "Impressum" || ((errors++))
echo ""

# Test sample content
echo -e "${BLUE}Testing Sample Content:${NC}"
echo "------------------------"
test_url "$SITE_URL/a/2024-10-30-jackfruit-wraps-mit-avocado.html" "Article: Jackfruit Wraps" || ((errors++))
test_url "$SITE_URL/r/2016-12-18-bunte-spiral-tarte" "Recipe: Spiral Tarte" || ((errors++))
test_url "$SITE_URL/a/2024-10-27-die-besten-veganen-kuerbisrezepte.html" "Article: Kürbisrezepte" || ((errors++))
echo ""

# Test resources
echo -e "${BLUE}Testing Resources:${NC}"
echo "------------------"
test_url "$SITE_URL/css/styles.css" "Stylesheet" || ((errors++))
test_url "$SITE_URL/i/assets/veganblatt-logo.svg" "Logo SVG" || ((errors++))
test_url "$SITE_URL/i/jackfruit-wraps-1-2.jpg" "Sample Image" || ((errors++))
echo ""

# Performance benchmark
echo -e "${BLUE}Performance Benchmark:${NC}"
echo "----------------------"
total_time=0
for i in {1..5}; do
    response_time=$(curl -s -o /dev/null -w "%{time_total}" "$SITE_URL" 2>/dev/null)
    time_ms=$(echo "$response_time * 1000" | bc | cut -d'.' -f1)
    total_time=$(echo "$total_time + $time_ms" | bc)
    echo "  Run $i: ${time_ms}ms"
done
avg_time=$(echo "$total_time / 5" | bc)
echo -e "  ${YELLOW}Average: ${avg_time}ms${NC}"
echo ""

# CDN edge test
echo -e "${BLUE}CDN Edge Server Test:${NC}"
echo "----------------------"
cf_ray=$(curl -sI "$SITE_URL" | grep -i "cf-ray" | cut -d' ' -f2 | tr -d '\r')
cf_cache=$(curl -sI "$SITE_URL" | grep -i "cf-cache-status" | cut -d' ' -f2 | tr -d '\r')
echo "  CF-Ray: $cf_ray"
echo "  Cache Status: ${cf_cache:-MISS}"
echo ""

# Security headers check
echo -e "${BLUE}Security Headers:${NC}"
echo "-----------------"
headers=$(curl -sI "$SITE_URL")
echo "$headers" | grep -qi "strict-transport-security" && echo -e "  ${GREEN}✓${NC} HSTS" || echo -e "  ${YELLOW}⚠${NC} HSTS missing"
echo "$headers" | grep -qi "x-content-type-options" && echo -e "  ${GREEN}✓${NC} X-Content-Type-Options" || echo -e "  ${YELLOW}⚠${NC} X-Content-Type-Options missing"
echo "$headers" | grep -qi "x-frame-options" && echo -e "  ${GREEN}✓${NC} X-Frame-Options" || echo -e "  ${YELLOW}⚠${NC} X-Frame-Options missing"
echo ""

# Summary
echo "=========================================="
if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✅ DEPLOYMENT VERIFIED SUCCESSFULLY!${NC}"
    echo -e "${GREEN}All tests passed. Site is live and healthy.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  DEPLOYMENT ISSUES DETECTED${NC}"
    echo -e "${RED}$errors test(s) failed. Please investigate.${NC}"
    exit 1
fi