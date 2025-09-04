#!/bin/bash

# Complete deployment pipeline with version management and GitHub push
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 VeganBlatt Full Deployment Pipeline${NC}"
echo "======================================"
echo ""

# Step 1: Bump version
echo "📦 Step 1: Bumping version..."
npx tsx src/scripts/bump-version.ts

# Get new version
VERSION=$(grep '"version"' version.json | cut -d'"' -f4)
echo "  New version: $VERSION"
echo ""

# Step 2: Build with new version
echo "🔨 Step 2: Building site..."
npm run lint && npm run build:css && npm run generate
echo -e "  ${GREEN}✓${NC} Build complete"
echo ""

# Step 3: Deploy to Cloudflare
echo "☁️  Step 3: Deploying to Cloudflare..."
npx wrangler pages deploy public --project-name=veganblatt-static --commit-dirty=true
echo -e "  ${GREEN}✓${NC} Deployed to Cloudflare"
echo ""

# Step 3b: Purge Cloudflare cache (if credentials present)
echo "🧹 Step 3b: Purging Cloudflare cache..."
bash ./scripts/purge-cloudflare-cache.sh || true
echo ""

# Step 4: Commit and push to GitHub
echo "📤 Step 4: Pushing to GitHub..."
git add -A
git commit -m "🚀 Deploy v${VERSION}

- Auto-generated version: ${VERSION}
- Build time: $(date)
- Deployed to: https://www.veganblatt.com/
" || true

git push origin main
echo -e "  ${GREEN}✓${NC} Pushed to GitHub"
echo ""

# Step 5: Run post-deployment checks
echo "🔍 Step 5: Running post-deployment checks..."
sleep 5  # Give CDN time to update
./scripts/post-deploy-check.sh

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN} ✅ Deployment Complete - v${VERSION}${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo "  📍 Live: https://www.veganblatt.com/"
echo "  📦 Version: ${VERSION}"
echo "  🐙 GitHub: Pushed to main branch"
echo ""
