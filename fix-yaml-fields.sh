#!/bin/bash

echo "🔧 Fixing misplaced YAML fields in recipe files..."
echo "=============================================="

fixed_count=0

# Find all files with aiGeneratedDate
find /Users/franzenzenhofer/dev/veganblatt-static/src/data/recipes -name "*.md" -type f | while read file; do
  
  # Check if file has aiGeneratedDate field
  if grep -q "^aiGeneratedDate:" "$file"; then
    
    # Check the structure - is aiGeneratedDate inside or outside front matter?
    # Count line numbers of --- markers and aiGeneratedDate
    first_marker=$(grep -n "^---$" "$file" | head -1 | cut -d: -f1)
    second_marker=$(grep -n "^---$" "$file" | head -2 | tail -1 | cut -d: -f1)
    ai_date_line=$(grep -n "^aiGeneratedDate:" "$file" | head -1 | cut -d: -f1)
    
    # If aiGeneratedDate is after the second ---, it's misplaced
    if [[ -n "$second_marker" ]] && [[ -n "$ai_date_line" ]] && [[ "$ai_date_line" -gt "$second_marker" ]]; then
      echo "📝 Fixing: $(basename "$file")"
      
      # Extract the fields that are misplaced
      ai_date=$(grep "^aiGeneratedDate:" "$file")
      featured_img=$(grep "^featuredImage:" "$file")
      
      # Create temp file
      temp_file="${file}.tmp"
      
      # Read file and reconstruct it properly
      {
        # Get everything up to (but not including) the aiGeneratedDate line
        head -n $((ai_date_line - 1)) "$file" | grep -v "^aiGeneratedDate:" | grep -v "^featuredImage:"
        
        # Add the fields properly before closing the front matter
        if [[ -n "$ai_date" ]]; then
          echo "$ai_date"
        fi
        if [[ -n "$featured_img" ]]; then
          echo "$featured_img"
        fi
        
        # Add the closing --- and rest of content
        echo "---"
        
        # Get everything after the second --- marker, skipping ai fields
        tail -n +$((second_marker + 1)) "$file" | grep -v "^aiGeneratedDate:" | grep -v "^featuredImage:"
        
      } > "$temp_file"
      
      # Replace original with fixed version
      mv "$temp_file" "$file"
      fixed_count=$((fixed_count + 1))
      echo "   ✅ Fixed: moved fields into YAML front matter"
    fi
  fi
done

echo ""
echo "=============================================="
echo "✅ COMPLETE: Fixed $fixed_count files"
echo "=============================================="