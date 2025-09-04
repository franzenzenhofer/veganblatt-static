#\!/bin/bash

# Get 50 random recipe files
recipes=$(ls public/r/*.html | sort -R | head -50)

success=0
failed=0
no_images=()

echo "🔍 Testing 50 random recipes on LIVE site with curl..."
echo "=========================================="

for recipe in $recipes; do
    filename=$(basename "$recipe")
    url="https://www.veganblatt.com/r/${filename}"
    
    # Use curl to fetch the page
    html=$(curl -s -L "$url")
    
    # Check for any image in the content
    if echo "$html" | grep -q 'class="image-container".*<img.*src="/i/.*\.jpg"'; then
        # Extract the image path
        img_path=$(echo "$html" | grep -o 'src="/i/[^"]*\.jpg"' | head -1 | cut -d'"' -f2)
        
        # Test if the image actually loads
        img_url="https://www.veganblatt.com${img_path}"
        img_status=$(curl -s -o /dev/null -w "%{http_code}" "$img_url")
        
        if [ "$img_status" = "200" ]; then
            echo "✅ ${filename} → Image OK: ${img_path}"
            ((success++))
        else
            echo "⚠️  ${filename} → Image 404: ${img_path}"
            no_images+=("${filename}")
            ((failed++))
        fi
    else
        echo "❌ ${filename} → No image in HTML"
        no_images+=("${filename}")
        ((failed++))
    fi
done

echo ""
echo "=========================================="
echo "📊 Final Results:"
echo "  ✅ Working images: $success/50"
echo "  ❌ Missing/broken: $failed/50"

if [ ${#no_images[@]} -gt 0 ]; then
    echo ""
    echo "Recipes without working images:"
    for recipe in "${no_images[@]}"; do
        echo "  - $recipe"
    done
fi
