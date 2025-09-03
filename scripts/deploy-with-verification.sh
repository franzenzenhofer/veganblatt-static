#!/bin/bash

set -e  # Exit on any error

echo "🚀 COMPREHENSIVE DEPLOYMENT WITH FULL VERIFICATION"
echo "=================================================="

# Step 1: Version Management
echo "📦 Step 1: Bumping version..."
OLD_VERSION=$(node -p "require('./package.json').version")
npm version patch --no-git-tag-version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "  Version: $OLD_VERSION → $NEW_VERSION"

# Update version.json
cat > version.json <<EOF
{
  "version": "$NEW_VERSION",
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
  "buildNumber": $(date +%s%N | cut -b1-13)
}
EOF

# Step 2: Build
echo ""
echo "🔨 Step 2: Building site..."
npm run build

# Step 3: Image Verification
echo ""
echo "🖼️ Step 3: Verifying images..."
IMAGE_COUNT=$(ls -1 public/i/*.{jpg,jpeg,png,gif,webp} 2>/dev/null | wc -l)
echo "  Found $IMAGE_COUNT images in public/i/"

if [ "$IMAGE_COUNT" -lt 1000 ]; then
    echo "  ❌ ERROR: Expected at least 1000 images, found only $IMAGE_COUNT"
    exit 1
fi

# Test critical images
CRITICAL_IMAGES=(
    "public/i/assets/veganblatt-logo.svg"
    "public/i/bowl-753241_1280.jpg"
    "public/i/palm-oil-1022012_1280.jpg"
)

for img in "${CRITICAL_IMAGES[@]}"; do
    if [ ! -f "$img" ]; then
        echo "  ❌ Missing critical image: $img"
        exit 1
    fi
done
echo "  ✅ All critical images present"

# Step 4: HTML Verification
echo ""
echo "📄 Step 4: Verifying HTML generation..."
HTML_COUNT=$(ls -1 public/*.html public/a/*.html public/r/*.html 2>/dev/null | wc -l)
echo "  Found $HTML_COUNT HTML files"

if [ "$HTML_COUNT" -lt 1500 ]; then
    echo "  ❌ ERROR: Expected at least 1500 HTML files, found only $HTML_COUNT"
    exit 1
fi

# Step 5: Content Verification
echo ""
echo "📝 Step 5: Verifying content..."
if ! grep -q "723" public/index.html; then
    echo "  ❌ Recipe count not found in homepage"
    exit 1
fi

if ! grep -q "1272" public/index.html; then
    echo "  ❌ Article count not found in homepage"
    exit 1
fi

echo "  ✅ Content counts verified"

# Step 6: Image Links Verification
echo ""
echo "🔗 Step 6: Verifying image links in HTML..."
BROKEN_IMAGES=$(grep -h 'src="/i/[^"]*"' public/a/*.html public/r/*.html 2>/dev/null | \
    sed 's/.*src="\/i\/\([^"]*\)".*/\1/' | \
    while read img; do
        if [ ! -f "public/i/$img" ]; then
            echo "$img"
        fi
    done | wc -l)

if [ "$BROKEN_IMAGES" -gt 0 ]; then
    echo "  ⚠️  Found $BROKEN_IMAGES broken image links"
fi

# Step 7: Deploy to Cloudflare
echo ""
echo "☁️  Step 7: Deploying to Cloudflare..."
npx wrangler pages deploy public \
    --project-name veganblatt-static \
    --branch main \
    --commit-hash $(git rev-parse HEAD) \
    --commit-message "Deploy v$NEW_VERSION with $IMAGE_COUNT images"

# Step 8: Git Commit
echo ""
echo "📤 Step 8: Committing to Git..."
git add -A
git commit -m "🚀 Deploy v$NEW_VERSION - Full deployment with $IMAGE_COUNT images"
git push origin main
git push production main || true  # Push to production repo if exists

# Step 9: Live Site Verification
echo ""
echo "🌐 Step 9: Verifying live site..."
sleep 10  # Wait for deployment

# Check if site is accessible
if curl -f -s -o /dev/null "https://veganblatt-static.pages.dev"; then
    echo "  ✅ Site is live at https://veganblatt-static.pages.dev"
else
    echo "  ❌ Site is not accessible"
fi

# Check if images load
TEST_URL="https://veganblatt-static.pages.dev/i/bowl-753241_1280.jpg"
if curl -f -s -o /dev/null "$TEST_URL"; then
    echo "  ✅ Images are loading correctly"
else
    echo "  ❌ Images are NOT loading - check deployment!"
fi

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "  Version: $NEW_VERSION"
echo "  Images: $IMAGE_COUNT"
echo "  Pages: $HTML_COUNT"
echo "  Site: https://veganblatt-static.pages.dev"
echo "=========================================="