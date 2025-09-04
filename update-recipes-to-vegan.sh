#!/bin/bash

# Script to update recipe titles to include appropriate German form of "vegan"
# Usage: ./update-recipes-to-vegan.sh

set -e

RECIPES_DIR="/Users/franzenzenhofer/dev/veganblatt-static/src/data/recipes"
LOG_FILE="/tmp/vegan-updates-$(date +%Y%m%d-%H%M%S).log"
PROCESSED_COUNT=0

echo "Starting vegan title updates..." | tee "$LOG_FILE"

# Function to determine appropriate German vegan form
determine_vegan_form() {
    local title="$1"
    
    # Check for specific patterns to determine gender
    # Masculine (der) - use "veganer" 
    if echo "$title" | grep -qiE '(kuchen|salat|shake|eintopf|sirup|aufstrich|smoothie)'; then
        echo "veganer"
        return
    fi
    
    # Feminine (die) - use "vegane"
    if echo "$title" | grep -qiE '(pasta|pizza|suppe|torte|sauce|creme|milch|sauce|limonade|marmelade)'; then
        echo "vegane"
        return
    fi
    
    # Neuter (das) - use "veganes"  
    if echo "$title" | grep -qiE '(eis|curry|frühstück|trifle|mousse|risotto|rezept|dhal)'; then
        echo "veganes"
        return
    fi
    
    # Plural forms - use "vegane"
    if echo "$title" | grep -qiE '(kekse|muffins|pancakes|riegel|wraps|tacos|nudeln|schnecken|pommes|chips|balls?|sticks|tartlettes)'; then
        echo "vegane"
        return
    fi
    
    # Default to "vegane" for most cases
    echo "vegane"
}

# Find all recipe files that don't already have "vegan" in the title
find "$RECIPES_DIR" -name "*.md" -type f | while read file; do
    # Extract current title
    title=$(grep -m1 "^title:" "$file" 2>/dev/null | sed 's/^title: *//; s/^"//; s/"$//; s/^'\''//; s/'\''$//')
    
    if [ -n "$title" ]; then
        # Check if title already contains "vegan" (case insensitive)
        if ! echo "$title" | grep -qi "vegan"; then
            # Determine appropriate vegan form
            vegan_form=$(determine_vegan_form "$title")
            
            # Create new title - try to place vegan appropriately
            if echo "$title" | grep -qE '^[A-Z][a-z]+ '; then
                # If title starts with adjective, add vegan after first word
                new_title=$(echo "$title" | sed "s/^\([A-Z][a-z]*\) /\1 $vegan_form /")
            else
                # Otherwise add vegan at the beginning
                new_title="$(echo $vegan_form | sed 's/.*/\u&/') $title"
            fi
            
            # Update the file
            if grep -q '^title: "' "$file"; then
                # Title is quoted with double quotes
                sed -i.bak "s/^title: \".*\"/title: \"$new_title\"/" "$file"
            elif grep -q "^title: '" "$file"; then
                # Title is quoted with single quotes
                sed -i.bak "s/^title: '.*'/title: '$new_title'/" "$file"
            else
                # Title is not quoted
                sed -i.bak "s/^title: .*/title: $new_title/" "$file"
            fi
            
            if [ $? -eq 0 ]; then
                echo "✓ Updated: $file" | tee -a "$LOG_FILE"
                echo "  Old: $title" | tee -a "$LOG_FILE"
                echo "  New: $new_title" | tee -a "$LOG_FILE"
                echo "" | tee -a "$LOG_FILE"
                PROCESSED_COUNT=$((PROCESSED_COUNT + 1))
                
                # Remove backup file
                rm -f "${file}.bak"
            else
                echo "✗ Failed: $file" | tee -a "$LOG_FILE"
            fi
        fi
    fi
done

echo "Completed! Updated $PROCESSED_COUNT recipe titles." | tee -a "$LOG_FILE"
echo "Log saved to: $LOG_FILE" | tee -a "$LOG_FILE"