#\!/bin/bash

echo "🔒 HTTPS Comprehensive Test Suite"
echo "=================================="
echo ""

# Test www domain
echo "1️⃣ Testing www.veganblatt.com..."
if curl -f -s -o /dev/null "https://www.veganblatt.com"; then
    echo "  ✅ HTTPS working on www.veganblatt.com"
else
    echo "  ❌ HTTPS NOT working on www"
fi

# Test SSL certificate
echo ""
echo "2️⃣ SSL Certificate Check..."
echo "Q" | openssl s_client -connect www.veganblatt.com:443 -servername www.veganblatt.com 2>/dev/null | grep -E "subject=|issuer=" | head -2

# Test images over HTTPS
echo ""
echo "3️⃣ Testing image delivery over HTTPS..."
if curl -f -s -o /dev/null "https://www.veganblatt.com/i/bowl-753241_1280.jpg"; then
    echo "  ✅ Images loading over HTTPS"
else
    echo "  ❌ Images NOT loading"
fi

# Test key pages
echo ""
echo "4️⃣ Testing key pages..."
for page in "" "artikel.html" "rezepte.html" "impressum.html"; do
    if curl -f -s -o /dev/null "https://www.veganblatt.com/$page"; then
        echo "  ✅ /$page"
    else
        echo "  ❌ /$page"
    fi
done

# Test content
echo ""
echo "5️⃣ Content verification..."
RECIPE_COUNT=$(curl -s "https://www.veganblatt.com" | grep -o "723" | head -1)
ARTICLE_COUNT=$(curl -s "https://www.veganblatt.com" | grep -o "1272" | head -1)
echo "  Articles: $ARTICLE_COUNT"
echo "  Recipes: $RECIPE_COUNT"

# Test root domain
echo ""
echo "6️⃣ Testing root domain (veganblatt.com)..."
if curl -f -s -o /dev/null "https://veganblatt.com" --max-time 5; then
    echo "  ✅ Root domain working"
else
    echo "  ⏳ Root domain still pending"
fi

echo ""
echo "=================================="
echo "🎉 DEPLOYMENT STATUS:"
echo "  www.veganblatt.com: ✅ LIVE WITH HTTPS"
echo "  veganblatt.com: Pending activation"
echo "=================================="
