#!/bin/bash

# Post-deployment verification with version checking
set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Post-Deployment Verification"
echo "================================"
echo ""

# Read local version
LOCAL_VERSION=""
if [ -f "version.json" ]; then
    LOCAL_VERSION=$(grep '"version"' version.json | cut -d'"' -f4)
    echo "📦 Local version: $LOCAL_VERSION"
else
    echo "⚠️  No local version file found"
fi

# Test critical pages
echo ""
echo "🌐 Testing critical pages..."

FAIL_COUNT=0
SUCCESS_COUNT=0

# Function to test URL
test_url() {
    local url=$1
    local name=$2
    
    # Get HTTP status
    # Follow redirects so 301/302/307/308 to canonical URLs are treated as success
    status=$(curl -s -L -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status" = "200" ]; then
        echo -e "  ${GREEN}✓${NC} $name (200 OK)"
        SUCCESS_COUNT=$((SUCCESS_COUNT+1))
    else
        echo -e "  ${RED}✗${NC} $name ($status)"
        FAIL_COUNT=$((FAIL_COUNT+1))
    fi
}

# Test homepage
test_url "https://www.veganblatt.com/" "Homepage"

# Test important pages
test_url "https://www.veganblatt.com/artikel.html" "Articles list"
test_url "https://www.veganblatt.com/rezepte.html" "Recipes list"
test_url "https://www.veganblatt.com/impressum.html" "Impressum"

# Test sample article
test_url "https://www.veganblatt.com/a/2019-09-01-vegane-mythen.html" "Sample article"

# Test sample recipe  
test_url "https://www.veganblatt.com/r/2017-05-07-rohkostkuchen-maca.html" "Sample recipe"

# Test SEO files
echo ""
echo "📄 Testing SEO files..."
test_url "https://www.veganblatt.com/sitemap.xml" "Sitemap index"
test_url "https://www.veganblatt.com/sitemap-articles.xml" "Articles sitemap"
test_url "https://www.veganblatt.com/sitemap-recipes.xml" "Recipes sitemap"
test_url "https://www.veganblatt.com/robots.txt" "Robots.txt"

# Check version on live site
echo ""
echo "🔢 Checking deployed version..."
LIVE_HTML=$(curl -s "https://www.veganblatt.com/" | head -100)
LIVE_VERSION=$(echo "$LIVE_HTML" | grep 'name="version"' | sed 's/.*content="\([^"]*\)".*/\1/')

if [ -n "$LIVE_VERSION" ]; then
    echo "  Live version: $LIVE_VERSION"
    
    if [ "$LOCAL_VERSION" = "$LIVE_VERSION" ]; then
        echo -e "  ${GREEN}✓${NC} Version match confirmed!"
    else
        echo -e "  ${YELLOW}⚠${NC} Version mismatch (Local: $LOCAL_VERSION, Live: $LIVE_VERSION)"
        echo "  This might be due to CDN cache. Waiting 10 seconds..."
        sleep 10
        
        # Retry with cache bypass
        LIVE_VERSION_RETRY=$(curl -s -H "Cache-Control: no-cache" "https://www.veganblatt.com/?nocache=$(date +%s)" | head -100 | grep 'name="version"' | sed 's/.*content="\([^"]*\)".*/\1/')
        if [ "$LOCAL_VERSION" = "$LIVE_VERSION_RETRY" ]; then
            echo -e "  ${GREEN}✓${NC} Version match confirmed after cache bypass!"
        else
            echo -e "  ${YELLOW}⚠${NC} Version still different, CDN may take time to update"
        fi
    fi
else
    echo -e "  ${RED}✗${NC} Could not detect version in live HTML"
fi

# Check sitemap freshness
echo ""
echo "📅 Checking sitemap freshness..."
SITEMAP_DATE=$(curl -s "https://www.veganblatt.com/sitemap.xml" | grep "<lastmod>" | head -1 | sed 's/.*<lastmod>\([^<]*\)<\/lastmod>.*/\1/')
TODAY=$(date +%Y-%m-%d)

if [ "$SITEMAP_DATE" = "$TODAY" ]; then
    echo -e "  ${GREEN}✓${NC} Sitemap updated today ($SITEMAP_DATE)"
else
    echo -e "  ${YELLOW}⚠${NC} Sitemap date: $SITEMAP_DATE (Expected: $TODAY)"
fi

# Performance check (portable across macOS/Linux)
echo ""
echo "⚡ Performance check..."
# Use curl's time_total (seconds, with fractions)
RT_SEC=$(curl -s -o /dev/null -w "%{time_total}" "https://www.veganblatt.com/")
# Convert to milliseconds using bc (portable) and format as integer
RESPONSE_MS=$(printf "%.0f" "$(echo "$RT_SEC * 1000" | bc -l)")

if [ -n "$RESPONSE_MS" ] 2>/dev/null && [ "$RESPONSE_MS" -lt 500 ]; then
    echo -e "  ${GREEN}✓${NC} Homepage response: ${RESPONSE_MS}ms"
elif [ -n "$RESPONSE_MS" ] 2>/dev/null && [ "$RESPONSE_MS" -lt 1000 ]; then
    echo -e "  ${YELLOW}⚠${NC} Homepage response: ${RESPONSE_MS}ms (acceptable)"
else
    echo -e "  ${RED}✗${NC} Homepage response: ${RESPONSE_MS:-unknown}ms (slow or unknown)"
fi

# Content validation
echo ""
echo "📝 Content validation..."

# Check for canonical tag
if curl -s "https://www.veganblatt.com/" | grep -q '<link rel="canonical"'; then
    echo -e "  ${GREEN}✓${NC} Canonical tag present"
else
    echo -e "  ${RED}✗${NC} Canonical tag missing"
    FAIL_COUNT=$((FAIL_COUNT+1))
fi

# Check for Open Graph tags
if curl -s "https://www.veganblatt.com/" | grep -q 'property="og:title"'; then
    echo -e "  ${GREEN}✓${NC} Open Graph tags present"
else
    echo -e "  ${RED}✗${NC} Open Graph tags missing"
    FAIL_COUNT=$((FAIL_COUNT+1))
fi

# Check for NO Twitter tags (as required)
if curl -s "https://www.veganblatt.com/" | grep -q 'twitter:'; then
    echo -e "  ${RED}✗${NC} Twitter tags found (should not exist!)"
    ((FAIL_COUNT++))
else
    echo -e "  ${GREEN}✓${NC} No Twitter tags (correct)"
fi

# Summary
echo ""
echo "================================"
echo "📊 Deployment Summary:"
echo "  ✅ Successful tests: $SUCCESS_COUNT"
echo "  ❌ Failed tests: $FAIL_COUNT"

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
    echo ""
    echo "Site is live at: https://www.veganblatt.com/"
    echo "Version: $LIVE_VERSION"
    
    # Extra sanity: verify Cloudflare Pages custom domain binding for www if credentials are present
    if [ -n "$CLOUDFLARE_API_TOKEN" ] && [ -n "$CLOUDFLARE_ACCOUNT_ID" ]; then
        echo ""
        echo "🔒 Verifying custom domain binding (www)..."
        DOMAIN_STATUS=$(curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" \
          "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/veganblatt-static/domains" \
          | jq -r '.result[] | select(.name=="www.veganblatt.com") | .status')
        if [ "$DOMAIN_STATUS" = "active" ]; then
            echo -e "  ${GREEN}✓${NC} www.veganblatt.com is attached to Pages (active)"
        else
            echo -e "  ${YELLOW}⚠${NC} www.veganblatt.com not active on Pages (status: ${DOMAIN_STATUS:-unknown})"
        fi
    else
        echo ""
        echo "ℹ️  Skipping domain binding verification (no CLOUDFLARE_API_TOKEN/ACCOUNT_ID in env)."
    fi
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  DEPLOYMENT HAS ISSUES${NC}"
    echo "Please review the failures above."
    exit 1
fi
# CSS fingerprint spot checks
echo ""
echo "🧪 CSS fingerprint checks..."

check_css_fingerprint() {
  local url=$1
  local name=$2
  local html
  html=$(curl -s "$url")
  if echo "$html" | grep -qE 'href="/css/styles.css\?v=[^"]+"'; then
    echo -e "  ${GREEN}✓${NC} $name uses versioned CSS"
  else
    echo -e "  ${RED}✗${NC} $name missing CSS fingerprint"
    FAIL_COUNT=$((FAIL_COUNT+1))
  fi
}

check_css_fingerprint "https://www.veganblatt.com/" "Homepage"
check_css_fingerprint "https://www.veganblatt.com/artikel" "Articles list"
check_css_fingerprint "https://www.veganblatt.com/rezepte" "Recipes list"
check_css_fingerprint "https://www.veganblatt.com/impressum" "Impressum"
check_css_fingerprint "https://www.veganblatt.com/a/2019-09-01-vegane-mythen.html" "Sample article"
check_css_fingerprint "https://www.veganblatt.com/r/2017-05-07-rohkostkuchen-maca.html" "Sample recipe"
# Verify HTML Cache-Control headers encourage immediate freshness
echo ""
echo "🧪 HTML cache-control checks..."
check_cc() {
  local url=$1
  local name=$2
  hdr=$(curl -sI "$url" | tr -d '\r' | grep -i '^cache-control')
  if echo "$hdr" | grep -qiE 'no-cache|no-store|max-age=0'; then
    echo -e "  ${GREEN}✓${NC} $name headers: ${hdr#*: }"
  else
    echo -e "  ${YELLOW}⚠${NC} $name headers missing no-cache/no-store (got: ${hdr#*: })"
  fi
}

check_cc "https://www.veganblatt.com/" "Homepage"
check_cc "https://www.veganblatt.com/artikel" "Articles list"
check_cc "https://www.veganblatt.com/rezepte" "Recipes list"
check_cc "https://www.veganblatt.com/impressum" "Impressum"
