#\!/bin/bash

# Get all recipe files and randomly select 50 using sort -R (macOS compatible)
recipes=$(ls public/r/*.html | sort -R | head -50)

success=0
failed=0
failed_urls=""

echo "🔍 Testing 50 random recipe pages for images on LIVE site..."
echo "=========================================="

for recipe in $recipes; do
    # Extract filename and create URL
    filename=$(basename "$recipe")
    url="https://www.veganblatt.com/r/${filename}"
    
    # Fetch page and check for images
    response=$(curl -s "$url")
    
    # Check if page has an image (either in /i/ or /i/ai/)
    if echo "$response" | grep -q '<img.*src="/i/.*\.jpg"'; then
        # Get the actual image URL
        img_url=$(echo "$response" | grep -o '/i/[^"]*\.jpg' | head -1)
        echo "✅ $filename → has image: $img_url"
        ((success++))
    else
        echo "❌ $filename - NO IMAGE FOUND"
        failed_urls="${failed_urls}\n  - ${url}"
        ((failed++))
    fi
done

echo ""
echo "=========================================="
echo "📊 Results:"
echo "  ✅ Success: $success/50"
echo "  ❌ Failed: $failed/50"

if [ $failed -gt 0 ]; then
    echo ""
    echo "Failed URLs (recipes without images):"
    echo -e "$failed_urls"
fi
