#!/bin/bash

# Final script to ensure all remaining recipes get "vegan" added to their titles
set -e

RECIPES_DIR="/Users/franzenzenhofer/dev/veganblatt-static/src/data/recipes"
UPDATED_COUNT=0

echo "Final vegan title updates..."

# Process all remaining files that don't have "vegan" in their titles
./find-non-vegan-recipes.sh 2>/dev/null | while IFS=':' read -r file title; do
    if [ -n "$file" ] && [ -n "$title" ]; then
        echo "Processing: $(basename "$file")"
        
        # Determine appropriate vegan form based on patterns
        vegan_form="Vegane"
        
        # Masculine (der) - use "Veganer" 
        if echo "$title" | grep -qiE '\b(kuchen|salat|shake|eintopf|sirup|aufstrich|smoothie|gulasch|auflauf)\b'; then
            vegan_form="Veganer"
        # Neuter (das) - use "Veganes"
        elif echo "$title" | grep -qiE '\b(eis|curry|frühstück|trifle|mousse|risotto|rezept|dhal|tiramisu)\b'; then
            vegan_form="Veganes"
        # Default to "Vegane" for feminine and plurals
        fi
        
        # Create the new title by prepending the vegan form
        new_title="$vegan_form $title"
        
        # Update the file (handle different quote styles)
        if grep -q '^title: "' "$file"; then
            # Double quoted
            sed -i.bak "s/^title: \".*\"/title: \"$new_title\"/" "$file"
        elif grep -q "^title: '" "$file"; then
            # Single quoted
            sed -i.bak "s/^title: '.*'/title: '$new_title'/" "$file"
        else
            # Unquoted
            sed -i.bak "s/^title: .*/title: $new_title/" "$file"
        fi
        
        if [ $? -eq 0 ]; then
            echo "  Updated to: $new_title"
            rm -f "${file}.bak" 2>/dev/null
            UPDATED_COUNT=$((UPDATED_COUNT + 1))
        else
            echo "  Failed to update"
        fi
    fi
done

echo "Final update completed! Updated $UPDATED_COUNT additional recipe titles."