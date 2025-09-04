#!/bin/bash

# Script to fix German grammar issues with "vegan" in recipe titles
# This script will fix common patterns where vegan appears in wrong position or form

RECIPE_DIR="/Users/franzenzenhofer/dev/veganblatt-static/src/data/recipes"
LOG_FILE="/Users/franzenzenhofer/dev/veganblatt-static/logs/vegan-grammar-fixes-$(date +%Y%m%d-%H%M%S).log"

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

echo "Starting vegan grammar fixes at $(date)" >> "$LOG_FILE"
echo "Processing recipe files in: $RECIPE_DIR" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Counter for fixed files
fixed_count=0

# Pattern 1: Fix "adjective vegane/r/s noun" to "adjective Vegane/r/s noun" 
# Pattern 2: Fix "noun vegane/r/s noun" to "Vegane/r/s noun noun"
# Pattern 3: Capitalize standalone "vegane/r/s" when it should be "Vegane/r/s"

echo "=== Fixing German grammar patterns ===" >> "$LOG_FILE"

# Find all markdown files in the recipes directory
find "$RECIPE_DIR" -name "*.md" -type f | while read -r file; do
    original_title=$(grep '^title:' "$file" | head -1)
    
    if [[ -n "$original_title" ]]; then
        modified_title="$original_title"
        
        # Pattern fixes (avoiding already correct capitalized forms)
        # Fix "X vegane Y" -> "X Vegane Y" (but not if X vegane is part of larger construct)
        modified_title=$(echo "$modified_title" | sed -E 's/^(title: [^"'\'']*[[:space:]])([[:alpha:]]+[[:space:]])vegane([[:space:]][^"'\'']*)/\1\2Vegane\3/g')
        modified_title=$(echo "$modified_title" | sed -E 's/^(title: [^"'\'']*[[:space:]])([[:alpha:]]+[[:space:]])veganer([[:space:]][^"'\'']*)/\1\2Veganer\3/g')
        modified_title=$(echo "$modified_title" | sed -E 's/^(title: [^"'\'']*[[:space:]])([[:alpha:]]+[[:space:]])veganes([[:space:]][^"'\'']*)/\1\2Veganes\3/g')
        
        # Fix patterns with quotes around title
        modified_title=$(echo "$modified_title" | sed -E 's/^(title: ['\''"][^"'\'']*[[:space:]])([[:alpha:]]+[[:space:]])vegane([[:space:]][^"'\'']*['\''"])/\1\2Vegane\3/g')
        modified_title=$(echo "$modified_title" | sed -E 's/^(title: ['\''"][^"'\'']*[[:space:]])([[:alpha:]]+[[:space:]])veganer([[:space:]][^"'\'']*['\''"])/\1\2Veganer\3/g')
        modified_title=$(echo "$modified_title" | sed -E 's/^(title: ['\''"][^"'\'']*[[:space:]])([[:alpha:]]+[[:space:]])veganes([[:space:]][^"'\'']*['\''"])/\1\2Veganes\3/g')
        
        # Fix "Noun vegane/r/s Noun" patterns to "Vegane/r/s Noun Noun"
        # This handles cases like "Cashew vegane Milch" -> "Vegane Cashew-Milch"
        modified_title=$(echo "$modified_title" | sed -E 's/^(title: [^"'\'']*[[:space:]])([[:alpha:]]+)([[:space:]])vegane([[:space:]])([[:alpha:]]+[^"'\'']*)/\1Vegane \2-\5/g')
        modified_title=$(echo "$modified_title" | sed -E 's/^(title: [^"'\'']*[[:space:]])([[:alpha:]]+)([[:space:]])veganer([[:space:]])([[:alpha:]]+[^"'\'']*)/\1Veganer \2-\5/g')  
        modified_title=$(echo "$modified_title" | sed -E 's/^(title: [^"'\'']*[[:space:]])([[:alpha:]]+)([[:space:]])veganes([[:space:]])([[:alpha:]]+[^"'\'']*)/\1Veganes \2-\5/g')
        
        # Same patterns with quotes
        modified_title=$(echo "$modified_title" | sed -E 's/^(title: ['\''"][^"'\'']*[[:space:]])([[:alpha:]]+)([[:space:]])vegane([[:space:]])([[:alpha:]]+[^"'\'']*['\''"])/\1Vegane \2-\5/g')
        modified_title=$(echo "$modified_title" | sed -E 's/^(title: ['\''"][^"'\'']*[[:space:]])([[:alpha:]]+)([[:space:]])veganer([[:space:]])([[:alpha:]]+[^"'\'']*['\''"])/\1Veganer \2-\5/g')
        modified_title=$(echo "$modified_title" | sed -E 's/^(title: ['\''"][^"'\'']*[[:space:]])([[:alpha:]]+)([[:space:]])veganes([[:space:]])([[:alpha:]]+[^"'\'']*['\''"])/\1Veganes \2-\5/g')
        
        # Check if we made any changes
        if [[ "$original_title" != "$modified_title" ]]; then
            # Create backup
            cp "$file" "${file}.backup-$(date +%Y%m%d-%H%M%S)"
            
            # Apply the change
            sed -i '' "1,10s|^title:.*|$modified_title|" "$file"
            
            echo "FIXED: $(basename "$file")" >> "$LOG_FILE"
            echo "  FROM: $original_title" >> "$LOG_FILE"
            echo "    TO: $modified_title" >> "$LOG_FILE"
            echo "" >> "$LOG_FILE"
            
            ((fixed_count++))
        fi
    fi
done

echo "=== Summary ===" >> "$LOG_FILE"
echo "Total files fixed: $fixed_count" >> "$LOG_FILE"
echo "Completed at: $(date)" >> "$LOG_FILE"
echo ""
echo "Fixed $fixed_count files. Check log at: $LOG_FILE"