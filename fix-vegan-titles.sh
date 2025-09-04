#!/bin/bash

# Script to fix malformed vegan titles created by the previous script
set -e

RECIPES_DIR="/Users/franzenzenhofer/dev/veganblatt-static/src/data/recipes"
FIXED_COUNT=0

echo "Fixing malformed vegan titles..."

find "$RECIPES_DIR" -name "*.md" -type f | while read file; do
    # Check if file has malformed title patterns
    if grep -q "^title.*uvegan\|^title.*title:" "$file"; then
        echo "Fixing: $file"
        
        # Try to restore from backup if it exists
        if [ -f "${file}.bak" ]; then
            cp "${file}.bak" "$file"
            rm "${file}.bak"
            echo "  Restored from backup"
        else
            # Manual fix for specific patterns
            sed -i.bak2 's/^title: uveganer /title: Veganer /' "$file"
            sed -i.bak2 's/^title: uvegane /title: Vegane /' "$file"
            sed -i.bak2 's/^title: uveganes /title: Veganes /' "$file"
            
            # Fix malformed titles with duplicate content
            sed -i.bak2 's/^title:.*title: "\([^"]*\)".*$/title: "\1"/' "$file"
            
            # Clean up backup
            rm -f "${file}.bak2"
            
            echo "  Fixed patterns"
        fi
        
        FIXED_COUNT=$((FIXED_COUNT + 1))
    fi
done

echo "Fixed $FIXED_COUNT files."