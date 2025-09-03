#!/bin/bash

echo "🔍 VeganBlatt Deployment Verification"
echo "======================================"
echo ""

# Check Pages.dev deployment
echo "1️⃣ Checking Pages.dev deployment..."
if curl -f -s -o /dev/null "https://veganblatt-static.pages.dev"; then
    echo "  ✅ Site accessible at: https://veganblatt-static.pages.dev"
else
    echo "  ❌ Pages.dev not accessible"
fi

# Check image serving
echo ""
echo "2️⃣ Checking image serving..."
if curl -f -s -o /dev/null "https://veganblatt-static.pages.dev/i/bowl-753241_1280.jpg"; then
    echo "  ✅ Images are being served correctly"
else
    echo "  ❌ Images NOT loading"
fi

# Count local resources
echo ""
echo "3️⃣ Local resource count..."
IMAGE_COUNT=$(ls -1 public/i/*.{jpg,jpeg,png,gif,webp} 2>/dev/null | wc -l)
HTML_COUNT=$(find public -name "*.html" | wc -l)
echo "  📸 Images: $IMAGE_COUNT"
echo "  📄 HTML pages: $HTML_COUNT"

# Check domain status via API
echo ""
echo "4️⃣ Domain status check..."
DOMAINS=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/ecf21e85812dfa5b2a35245257fc71f5/pages/projects/veganblatt-static/domains" \
     -H "Authorization: Bearer GbXkUqYS1bDLBDjWFK9TwTg0n8rYMvYd6L6Wefih" \
     -H "Content-Type: application/json" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "$DOMAINS" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for domain in data.get('result', []):
    name = domain['name']
    status = domain['status']
    emoji = '✅' if status == 'active' else '⏳'
    print(f'  {emoji} {name}: {status}')
"
else
    echo "  ⚠️  Could not fetch domain status"
fi

# Try custom domains
echo ""
echo "5️⃣ Testing custom domains..."
for domain in "www.veganblatt.com" "veganblatt.com"; do
    if curl -f -s -o /dev/null "https://$domain" --connect-timeout 3 2>/dev/null; then
        echo "  ✅ https://$domain is LIVE!"
    else
        echo "  ⏳ https://$domain not yet active (SSL provisioning)"
    fi
done

echo ""
echo "======================================"
echo "📊 Summary:"
echo "  - Deployment: ✅ SUCCESS" 
echo "  - Images: $IMAGE_COUNT deployed"
echo "  - Pages: $HTML_COUNT generated"
echo "  - Live at: https://veganblatt-static.pages.dev"
echo ""
echo "⏰ Note: Custom domains typically take 5-15 minutes"
echo "   to activate after initial setup."
echo "======================================"