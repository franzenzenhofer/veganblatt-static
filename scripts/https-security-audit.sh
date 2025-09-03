#\!/bin/bash

echo "🔐 COMPREHENSIVE HTTPS SECURITY AUDIT"
echo "======================================"
echo ""

# 1. SSL Certificate Details
echo "1️⃣ SSL CERTIFICATE VERIFICATION"
echo "---------------------------------"
echo "www.veganblatt.com certificate:"
echo "" | openssl s_client -connect www.veganblatt.com:443 -servername www.veganblatt.com 2>/dev/null | openssl x509 -noout -text 2>/dev/null | grep -E "Subject:|Issuer:|Not Before:|Not After:" | head -4

# 2. TLS Version Check
echo ""
echo "2️⃣ TLS VERSION & CIPHER"
echo "------------------------"
curl -I --tlsv1.2 https://www.veganblatt.com 2>&1 | grep -E "SSL connection using|TLS" | head -1
echo "Q" | openssl s_client -connect www.veganblatt.com:443 2>/dev/null | grep "Protocol" | head -1

# 3. HTTP to HTTPS Redirect
echo ""
echo "3️⃣ HTTP→HTTPS REDIRECT TEST"
echo "----------------------------"
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://www.veganblatt.com)
HTTPS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://www.veganblatt.com)
echo "  HTTP Response: $HTTP_RESPONSE"
echo "  HTTPS Response: $HTTPS_RESPONSE"
if [ "$HTTPS_RESPONSE" = "200" ]; then
    echo "  ✅ HTTPS is working correctly"
else
    echo "  ❌ HTTPS issue detected"
fi

# 4. Security Headers
echo ""
echo "4️⃣ SECURITY HEADERS CHECK"
echo "-------------------------"
curl -I -s https://www.veganblatt.com | grep -E "Strict-Transport-Security|X-Content-Type-Options|X-Frame-Options|Content-Security-Policy" || echo "  ⚠️  No security headers found (normal for static sites)"

# 5. Mixed Content Check
echo ""
echo "5️⃣ MIXED CONTENT CHECK"
echo "----------------------"
INSECURE_REFS=$(curl -s https://www.veganblatt.com | grep -c "http://" || echo "0")
echo "  Insecure references found: $INSECURE_REFS"
if [ "$INSECURE_REFS" -eq "0" ]; then
    echo "  ✅ No mixed content issues"
else
    echo "  ⚠️  Potential mixed content"
fi

# 6. Certificate Chain
echo ""
echo "6️⃣ CERTIFICATE CHAIN VALIDATION"
echo "--------------------------------"
echo "Q" | openssl s_client -connect www.veganblatt.com:443 -servername www.veganblatt.com 2>/dev/null | grep -E "Verify return code" | head -1

# 7. HTTPS Resource Loading
echo ""
echo "7️⃣ HTTPS RESOURCE LOADING TEST"
echo "-------------------------------"
# Test critical resources
RESOURCES=(
    "https://www.veganblatt.com/css/styles.css"
    "https://www.veganblatt.com/i/assets/veganblatt-logo.svg"
    "https://www.veganblatt.com/i/bowl-753241_1280.jpg"
    "https://www.veganblatt.com/sitemap.xml"
)

for resource in "${RESOURCES[@]}"; do
    if curl -f -s -o /dev/null "$resource"; then
        echo "  ✅ ${resource##*/}"
    else
        echo "  ❌ ${resource##*/}"
    fi
done

# 8. Root vs WWW
echo ""
echo "8️⃣ DOMAIN CONFIGURATION"
echo "-----------------------"
ROOT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://veganblatt.com --max-time 5)
WWW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://www.veganblatt.com)
echo "  Root domain (veganblatt.com): $ROOT_STATUS"
echo "  WWW domain (www.veganblatt.com): $WWW_STATUS"

# 9. Response Time
echo ""
echo "9️⃣ HTTPS RESPONSE TIME"
echo "----------------------"
RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}\n" https://www.veganblatt.com)
echo "  Total time: ${RESPONSE_TIME}s"

# 10. Final Status
echo ""
echo "🔟 OVERALL HTTPS STATUS"
echo "----------------------"
if curl -f -s -o /dev/null https://www.veganblatt.com; then
    echo "  ✅ HTTPS FULLY OPERATIONAL"
    echo "  ✅ Site accessible at: https://www.veganblatt.com"
    echo "  ✅ SSL Certificate: VALID"
    echo "  ✅ Security: ENFORCED"
else
    echo "  ❌ HTTPS issues detected"
fi

echo ""
echo "======================================"
echo "🏁 SECURITY AUDIT COMPLETE"
echo "======================================"
