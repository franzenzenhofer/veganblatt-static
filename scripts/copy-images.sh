#!/bin/bash

# Copy images from WordPress dump to public directory
echo "🖼️ Copying images to public directory..."

# Source and destination
SOURCE_DIR="/Users/franzenzenhofer/dev/veganblatt-migration/wordpress-dump/wp-content/uploads"
DEST_DIR="public/i"

# Check if source exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Error: Source directory not found: $SOURCE_DIR"
    echo "Looking for alternative locations..."
    
    # Try to find the images
    find /Users/franzenzenhofer/dev -type d -name "uploads" 2>/dev/null | head -5
    exit 1
fi

# Create destination directory
mkdir -p "$DEST_DIR"

# Count images before copy
TOTAL_IMAGES=$(find "$SOURCE_DIR" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.webp" \) | wc -l)
echo "Found $TOTAL_IMAGES images to copy"

# Copy all images (flatten directory structure)
find "$SOURCE_DIR" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.webp" \) -exec cp {} "$DEST_DIR/" \; 2>/dev/null

# Count copied images
COPIED_IMAGES=$(ls -1 "$DEST_DIR"/*.{jpg,jpeg,png,gif,webp} 2>/dev/null | wc -l)
echo "✅ Copied $COPIED_IMAGES images to $DEST_DIR"

# Verify critical images exist
CRITICAL_IMAGES=(
    "veganblatt-logo.svg"
    "bowl-753241_1280.jpg"
    "palm-oil-1022012_1280.jpg"
    "toner-906142_1280.jpg"
)

echo "Verifying critical images..."
for img in "${CRITICAL_IMAGES[@]}"; do
    if [ -f "$DEST_DIR/$img" ] || [ -f "$DEST_DIR/assets/$img" ]; then
        echo "  ✓ $img"
    else
        echo "  ⚠️  Missing: $img"
    fi
done

echo "🖼️ Image copy complete!"