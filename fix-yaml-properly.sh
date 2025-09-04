#!/bin/bash

echo "🔧 Fixing misplaced YAML fields in recipe files..."
echo "=============================================="

fixed_count=0
total_count=0

# Process each recipe file
find /Users/franzenzenhofer/dev/veganblatt-static/src/data/recipes -name "*.md" -type f | while read file; do
  total_count=$((total_count + 1))
  
  # Check if file has aiGeneratedDate OUTSIDE the front matter
  # Pattern: aiGeneratedDate appears, then --- appears after it
  if grep -q "^aiGeneratedDate:" "$file"; then
    # Get line numbers
    ai_line=$(grep -n "^aiGeneratedDate:" "$file" | head -1 | cut -d: -f1)
    featured_line=$(grep -n "^featuredImage:" "$file" | head -1 | cut -d: -f1)
    
    # Find the closing --- that comes AFTER aiGeneratedDate
    closing_marker=$(awk '/^aiGeneratedDate:/ {found=NR} /^---$/ && NR>found && found {print NR; exit}' "$file")
    
    if [[ -n "$closing_marker" ]]; then
      echo "📝 Fixing: $(basename "$file")"
      
      # Extract the misplaced fields
      ai_date=$(grep "^aiGeneratedDate:" "$file" | head -1)
      featured_img=$(grep "^featuredImage:" "$file" | head -1)
      
      # Create temp file with corrected structure
      temp_file="${file}.tmp"
      
      # Process line by line
      awk -v ai="$ai_date" -v feat="$featured_img" '
        /^aiGeneratedDate:/ { next }  # Skip misplaced aiGeneratedDate
        /^featuredImage:/ { next }     # Skip misplaced featuredImage
        /^---$/ && NR > 1 {            # When we hit the closing ---
          if (ai) print ai              # Insert aiGeneratedDate before it
          if (feat) print feat          # Insert featuredImage before it
          print                         # Then print the ---
          next
        }
        { print }                       # Print all other lines as-is
      ' "$file" > "$temp_file"
      
      # Replace original file
      mv "$temp_file" "$file"
      fixed_count=$((fixed_count + 1))
      echo "   ✅ Fixed: moved fields into YAML front matter"
    fi
  fi
done

echo ""
echo "=============================================="
echo "✅ COMPLETE: Processed $total_count files, fixed $fixed_count"
echo "=============================================="