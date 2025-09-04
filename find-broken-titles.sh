#!/bin/bash

echo "Finding recipes with duplicate 'title:' in the same line..."
echo "================================================"

find /Users/franzenzenhofer/dev/veganblatt-static/src/data/recipes -name "*.md" -type f | while read file; do
    # Check if line has "title: title:" pattern (duplicate)
    if grep -E "^title:.*title:" "$file" > /dev/null 2>&1; then
        echo "BROKEN: $file"
        grep -E "^title:" "$file"
        echo ""
    fi
done