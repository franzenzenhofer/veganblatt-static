#!/bin/bash

# Script to generate icon files from SVG using rsvg-convert

SVG_PATH="public/i/assets/icon-logo.svg"
PUBLIC_DIR="public"

echo "🎨 Starting icon generation from SVG..."
echo ""

# Generate PNG files
echo "Generating PNG icons..."
rsvg-convert -w 16 -h 16 "$SVG_PATH" -o "$PUBLIC_DIR/favicon-16x16.png"
echo "✅ Generated: favicon-16x16.png (16x16)"

rsvg-convert -w 32 -h 32 "$SVG_PATH" -o "$PUBLIC_DIR/favicon-32x32.png"
echo "✅ Generated: favicon-32x32.png (32x32)"

rsvg-convert -w 180 -h 180 "$SVG_PATH" -o "$PUBLIC_DIR/apple-touch-icon.png"
echo "✅ Generated: apple-touch-icon.png (180x180)"

rsvg-convert -w 192 -h 192 "$SVG_PATH" -o "$PUBLIC_DIR/android-chrome-192x192.png"
echo "✅ Generated: android-chrome-192x192.png (192x192)"

rsvg-convert -w 512 -h 512 "$SVG_PATH" -o "$PUBLIC_DIR/android-chrome-512x512.png"
echo "✅ Generated: android-chrome-512x512.png (512x512)"

echo ""
echo "Generating favicon.ico..."

# Create temp directory for ICO generation
TEMP_DIR=$(mktemp -d)

# Generate multiple sizes for ICO
rsvg-convert -w 16 -h 16 "$SVG_PATH" -o "$TEMP_DIR/16.png"
rsvg-convert -w 32 -h 32 "$SVG_PATH" -o "$TEMP_DIR/32.png"
rsvg-convert -w 48 -h 48 "$SVG_PATH" -o "$TEMP_DIR/48.png"

# Check if we have ImageMagick's convert command
if command -v convert &> /dev/null; then
    convert "$TEMP_DIR/16.png" "$TEMP_DIR/32.png" "$TEMP_DIR/48.png" "$PUBLIC_DIR/favicon.ico"
    echo "✅ Generated: favicon.ico (16x16, 32x32, 48x48)"
else
    echo "⚠️  ImageMagick not found. Copying 32x32 PNG as fallback favicon.ico"
    cp "$TEMP_DIR/32.png" "$PUBLIC_DIR/favicon.ico"
fi

# Clean up temp directory
rm -rf "$TEMP_DIR"

echo ""
echo "✨ All icons generated successfully!"