#!/bin/bash

find /Users/franzenzenhofer/dev/veganblatt-static/src/data/recipes -name "*.md" -type f | while read file; do
  title=$(grep -m1 "^title:" "$file" 2>/dev/null | cut -d':' -f2- | xargs)
  if [ -n "$title" ]; then
    # Check if title contains "vegan" (case insensitive)
    echo "$title" | grep -qi "vegan"
    if [ $? -ne 0 ]; then
      echo "$file:$title"
    fi
  fi
done