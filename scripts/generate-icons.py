#!/usr/bin/env python3

import os
import sys
from pathlib import Path
import subprocess

# Try to import required libraries
try:
    from PIL import Image
    import cairosvg
except ImportError:
    print("Installing required packages...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow", "cairosvg"])
    from PIL import Image
    import cairosvg

# Paths
script_dir = Path(__file__).parent
public_dir = script_dir.parent / "public"
svg_path = public_dir / "i" / "assets" / "icon-logo.svg"

# Icon sizes
icon_sizes = [
    ("favicon-16x16.png", 16),
    ("favicon-32x32.png", 32),
    ("android-chrome-192x192.png", 192),
    ("android-chrome-512x512.png", 512),
    ("apple-touch-icon.png", 180),
]

def svg_to_png(svg_path, output_path, size):
    """Convert SVG to PNG at specified size"""
    cairosvg.svg2png(
        url=str(svg_path),
        write_to=str(output_path),
        output_width=size,
        output_height=size
    )
    print(f"✅ Generated: {output_path.name} ({size}x{size})")

def create_favicon_ico(public_dir):
    """Create favicon.ico from multiple PNG sizes"""
    sizes = [(16, 16), (32, 32), (48, 48)]
    images = []
    
    for size in sizes:
        temp_path = public_dir / f"temp_{size[0]}.png"
        svg_to_png(svg_path, temp_path, size[0])
        img = Image.open(temp_path)
        images.append(img)
        temp_path.unlink()  # Delete temp file
    
    # Save as ICO
    ico_path = public_dir / "favicon.ico"
    images[0].save(
        str(ico_path),
        format='ICO',
        sizes=sizes,
        append_images=images[1:]
    )
    print(f"✅ Generated: favicon.ico (16x16, 32x32, 48x48)")

def main():
    print("🎨 Starting icon generation from SVG...\n")
    
    if not svg_path.exists():
        print(f"❌ SVG file not found: {svg_path}")
        sys.exit(1)
    
    # Generate PNG icons
    for filename, size in icon_sizes:
        output_path = public_dir / filename
        svg_to_png(svg_path, output_path, size)
    
    # Generate favicon.ico
    create_favicon_ico(public_dir)
    
    print("\n✨ All icons generated successfully!")

if __name__ == "__main__":
    main()