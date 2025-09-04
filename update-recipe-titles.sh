#!/bin/bash

# File to process all recipes that need vegan/vegane added to title

recipes_file="/tmp/recipes_to_update.txt"
/Users/franzenzenhofer/dev/veganblatt-static/find-non-vegan-recipes.sh > "$recipes_file"

total=$(wc -l < "$recipes_file")
current=0

echo "Found $total recipes to update"

while IFS=':' read -r file title; do
    current=$((current + 1))
    echo "[$current/$total] Processing: $file"
    
    # Read the file
    content=$(cat "$file")
    
    # Determine if we should use "Vegane" or "Veganer" based on the title
    # Default to "Vegane" for most cases
    new_title=""
    
    # Check for specific patterns to determine the correct form
    if echo "$title" | grep -qi "kuchen\|brot\|shake\|salat\|eintopf\|smoothie\|pudding\|auflauf\|strudel"; then
        # Masculine nouns - use "Veganer"
        new_title="Veganer $title"
    elif echo "$title" | grep -qi "pasta\|pizza\|sauce\|creme\|torte\|tarte\|suppe\|bowl"; then
        # Feminine nouns - use "Vegane"  
        new_title="Vegane $title"
    elif echo "$title" | grep -qi "eis\|curry\|dressing\|pesto\|müsli\|frühstück\|konfekt\|dessert"; then
        # Neuter nouns - use "Veganes"
        new_title="Veganes $title"
    elif echo "$title" | grep -qi "muffins\|kekse\|cookies\|brownies\|pancakes\|nudeln\|fritten"; then
        # Plural - use "Vegane"
        new_title="Vegane $title"
    else
        # Default to "Vegane" for everything else
        new_title="Vegane $title"
    fi
    
    # Update the title in the file
    sed -i '' "s/^title: $title$/title: $new_title/" "$file"
    
    echo "  Updated: $title -> $new_title"
done < "$recipes_file"

echo "All recipes updated!"