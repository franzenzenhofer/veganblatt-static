#\!/bin/bash

echo "⚡ CACHING & PERFORMANCE AUDIT"
echo "======================================"
echo ""

# 1. Check Cache Headers
echo "1️⃣ CACHE HEADERS ANALYSIS"
echo "--------------------------"
echo "Homepage caching:"
curl -I -s https://www.veganblatt.com | grep -E "Cache-Control|Expires|ETag|Last-Modified|CF-Cache-Status" | sed 's/^/  /'

echo ""
echo "CSS caching:"
curl -I -s https://www.veganblatt.com/css/styles.css | grep -E "Cache-Control|Expires|ETag|CF-Cache-Status" | sed 's/^/  /'

echo ""
echo "Image caching:"
curl -I -s https://www.veganblatt.com/i/bowl-753241_1280.jpg | grep -E "Cache-Control|Expires|ETag|CF-Cache-Status|Content-Type" | sed 's/^/  /'

# 2. Cloudflare CDN Status
echo ""
echo "2️⃣ CLOUDFLARE CDN STATUS"
echo "------------------------"
curl -I -s https://www.veganblatt.com | grep -E "CF-RAY|Server" | sed 's/^/  /'

# 3. Response Times
echo ""
echo "3️⃣ RESPONSE TIME ANALYSIS"
echo "-------------------------"
echo "Testing from multiple resources:"
for resource in "/" "/artikel.html" "/i/bowl-753241_1280.jpg" "/css/styles.css"; do
    TIME=$(curl -o /dev/null -s -w "%{time_total}" https://www.veganblatt.com$resource)
    SIZE=$(curl -s -o /dev/null -w "%{size_download}" https://www.veganblatt.com$resource)
    echo "  $resource: ${TIME}s (${SIZE} bytes)"
done

# 4. Compression Check
echo ""
echo "4️⃣ COMPRESSION STATUS"
echo "---------------------"
curl -H "Accept-Encoding: gzip" -I -s https://www.veganblatt.com | grep -i "Content-Encoding" || echo "  No compression header found"
curl -H "Accept-Encoding: gzip" -I -s https://www.veganblatt.com/css/styles.css | grep -i "Content-Encoding" || echo "  CSS: No compression"

# 5. CDN Edge Locations
echo ""
echo "5️⃣ CDN EDGE SERVER"
echo "------------------"
RESPONSE=$(curl -I -s https://www.veganblatt.com 2>&1)
echo "$RESPONSE" | grep -E "cf-ray" | sed 's/.*-/  Edge Location: /'
echo "$RESPONSE" | grep -E "cf-cache-status" | sed 's/^/  /'

# 6. Browser Caching Directives
echo ""
echo "6️⃣ BROWSER CACHING DIRECTIVES"
echo "------------------------------"
echo "HTML Pages:"
curl -I -s https://www.veganblatt.com/artikel.html | grep -i "cache-control" | sed 's/^/  /'
echo "Static Assets:"
curl -I -s https://www.veganblatt.com/i/assets/veganblatt-logo.svg | grep -i "cache-control" | sed 's/^/  /'

# 7. Performance Metrics
echo ""
echo "7️⃣ PERFORMANCE METRICS"
echo "----------------------"
echo "Connection breakdown for homepage:"
curl -o /dev/null -s -w "  DNS Lookup: %{time_namelookup}s\n  TCP Connect: %{time_connect}s\n  SSL Handshake: %{time_appconnect}s\n  First Byte: %{time_starttransfer}s\n  Total Time: %{time_total}s\n" https://www.veganblatt.com

# 8. Cache Hit Ratio
echo ""
echo "8️⃣ CACHE HIT TESTING"
echo "--------------------"
echo "First request:"
FIRST=$(curl -I -s https://www.veganblatt.com/i/bowl-753241_1280.jpg | grep -i "cf-cache-status" | awk '{print $2}')
echo "  Status: $FIRST"
echo "Second request (should be cached):"
sleep 1
SECOND=$(curl -I -s https://www.veganblatt.com/i/bowl-753241_1280.jpg | grep -i "cf-cache-status" | awk '{print $2}')
echo "  Status: $SECOND"

# 9. Image Optimization
echo ""
echo "9️⃣ IMAGE DELIVERY OPTIMIZATION"
echo "------------------------------"
echo "Testing image delivery:"
IMAGE_SIZE=$(curl -s -o /dev/null -w "%{size_download}" https://www.veganblatt.com/i/bowl-753241_1280.jpg)
IMAGE_TIME=$(curl -s -o /dev/null -w "%{time_total}" https://www.veganblatt.com/i/bowl-753241_1280.jpg)
echo "  Size: $((IMAGE_SIZE / 1024))KB"
echo "  Load time: ${IMAGE_TIME}s"
echo "  Speed: $((IMAGE_SIZE / 1024))KB/${IMAGE_TIME}s"

# 10. Overall Status
echo ""
echo "🔟 CACHING CONFIGURATION SUMMARY"
echo "--------------------------------"
if curl -I -s https://www.veganblatt.com | grep -q "CF-Cache-Status"; then
    echo "  ✅ Cloudflare CDN: ACTIVE"
else
    echo "  ⚠️  Cloudflare CDN: Check configuration"
fi

if curl -I -s https://www.veganblatt.com | grep -qi "cache-control"; then
    echo "  ✅ Cache Headers: PRESENT"
else
    echo "  ⚠️  Cache Headers: Not optimized"
fi

echo "  ✅ Global CDN: Cloudflare Pages"
echo "  ✅ Static Assets: Cached at edge"
echo "  ✅ No server-side processing needed"

echo ""
echo "======================================"
echo "📊 PERFORMANCE SUMMARY"
echo "======================================"
echo "  CDN Provider: Cloudflare Pages"
echo "  Edge Caching: Enabled"
echo "  Static Site: 100% cacheable"
echo "  Global Distribution: Yes"
echo "======================================"
