#!/bin/bash

echo "🔧 Fixing misplaced YAML fields in recipe files..."
echo "=============================================="

fixed_count=0
total_count=0

# Find all markdown files in recipes directory
find /Users/franzenzenhofer/dev/veganblatt-static/src/data/recipes -name "*.md" -type f | while read file; do
  total_count=$((total_count + 1))
  
  # Read the entire file
  content=$(cat "$file")
  
  # Check if file has misplaced aiGeneratedDate or featuredImage after the last ---
  # Look for pattern where these fields appear after the closing --- marker
  if echo "$content" | grep -E "^---$" | tail -1 > /dev/null; then
    # Get line number of the last --- marker
    last_marker_line=$(grep -n "^---$" "$file" | tail -1 | cut -d: -f1)
    
    # Check if there are aiGeneratedDate or featuredImage fields after this line
    if tail -n +$((last_marker_line + 1)) "$file" | grep -E "^(aiGeneratedDate|featuredImage):" > /dev/null; then
      echo "📝 Fixing: $(basename "$file")"
      
      # Extract the misplaced fields
      ai_date=$(tail -n +$((last_marker_line + 1)) "$file" | grep "^aiGeneratedDate:" | head -1)
      featured_img=$(tail -n +$((last_marker_line + 1)) "$file" | grep "^featuredImage:" | head -1)
      
      # Create a temporary file
      temp_file="${file}.tmp"
      
      # Process the file line by line
      in_frontmatter=false
      frontmatter_count=0
      while IFS= read -r line; do
        if [[ "$line" == "---" ]]; then
          frontmatter_count=$((frontmatter_count + 1))
          if [[ $frontmatter_count -eq 1 ]]; then
            in_frontmatter=true
            echo "$line" >> "$temp_file"
          elif [[ $frontmatter_count -eq 2 ]]; then
            # Before closing the front matter, add the fields if they exist
            if [[ -n "$ai_date" ]]; then
              echo "$ai_date" >> "$temp_file"
            fi
            if [[ -n "$featured_img" ]]; then
              echo "$featured_img" >> "$temp_file"
            fi
            echo "$line" >> "$temp_file"
            in_frontmatter=false
          else
            echo "$line" >> "$temp_file"
          fi
        elif [[ "$line" =~ ^aiGeneratedDate: ]] || [[ "$line" =~ ^featuredImage: ]]; then
          # Skip these lines if they're outside front matter
          if [[ "$in_frontmatter" == true ]]; then
            echo "$line" >> "$temp_file"
          fi
        else
          echo "$line" >> "$temp_file"
        fi
      done < "$file"
      
      # Replace the original file with the fixed one
      mv "$temp_file" "$file"
      fixed_count=$((fixed_count + 1))
      echo "   ✅ Fixed: moved fields into YAML front matter"
    fi
  fi
done

echo ""
echo "=============================================="
echo "✅ COMPLETE: Fixed $fixed_count files with misplaced YAML fields"
echo "=============================================="