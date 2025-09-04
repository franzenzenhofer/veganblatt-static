#!/bin/bash
# Script to extract all recipe titles for review

find /Users/franzenzenhofer/dev/veganblatt-static/src/data/recipes -name "*.md" -type f | sort | while read file; do
  filename=$(basename "$file")
  # Extract title more carefully, handling quotes
  title=$(grep -m1 "^title:" "$file" | sed 's/^title: *//' | sed 's/^"//' | sed 's/"$//' | sed "s/^'//" | sed "s/'$//")
  echo "$filename | $title"
done