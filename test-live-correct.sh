#\!/bin/bash

# Get 50 random recipe files  
recipes=$(ls public/r/*.html | sort -R | head -50)

success=0
failed=0

echo "🔍 Testing 50 random recipes on LIVE site (correct URLs without .html)..."
echo "=========================================="

for recipe in $recipes; do
    filename=$(basename "$recipe" .html)  # Remove .html extension
    url="https://www.veganblatt.com/r/${filename}"  # URL without .html
    
    # Use curl to fetch the page
    html=$(curl -s -L "$url")
    
    # Check for images
    if echo "$html" | grep -q '<img.*src="/i/.*\.jpg"'; then
        img_path=$(echo "$html" | grep -o 'src="/i/[^"]*\.jpg"' | head -1 | cut -d'"' -f2)
        echo "✅ ${filename} → Image found: ${img_path}"
        ((success++))
    else
        echo "❌ ${filename} → No image"
        ((failed++))
    fi
done

echo ""
echo "=========================================="
echo "📊 Results:"
echo "  ✅ With images: $success/50"
echo "  ❌ Without images: $failed/50"
