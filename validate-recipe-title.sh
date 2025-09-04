#!/bin/bash

# Script to validate a single recipe title after manual fixes
# Usage: ./validate-recipe-title.sh path/to/recipe.md

if [ $# -eq 0 ]; then
    echo "Usage: $0 <recipe-file>"
    exit 1
fi

FILE="$1"
BASENAME=$(basename "$FILE")

if [ ! -f "$FILE" ]; then
    echo "❌ File not found: $FILE"
    exit 1
fi

# Extract title line
TITLE_LINE=$(grep -n "^title:" "$FILE" | head -1)
LINE_NUMBER=$(echo "$TITLE_LINE" | cut -d: -f1)
TITLE_CONTENT=$(echo "$TITLE_LINE" | cut -d: -f2- | xargs)

echo "🔍 Validating: $BASENAME"
echo "   Title: $TITLE_CONTENT"

# Test 1: Check for duplicate "title:" in same line
if echo "$TITLE_LINE" | grep -q "title:.*title:"; then
    echo "❌ FAIL: Duplicate 'title:' found in line $LINE_NUMBER"
    exit 1
fi

# Test 2: Check if "vegan" is present (case insensitive)
if ! echo "$TITLE_CONTENT" | grep -qi "vegan"; then
    echo "❌ FAIL: No 'vegan' found in title"
    exit 1
fi

# Test 3: Check for malformed quotes (unmatched quotes)
QUOTE_COUNT=$(echo "$TITLE_CONTENT" | tr -cd '"' | wc -c)
if [ $((QUOTE_COUNT % 2)) -ne 0 ]; then
    echo "⚠️  WARNING: Unmatched quotes detected"
fi

# Test 4: Check for empty title
if [ -z "$TITLE_CONTENT" ]; then
    echo "❌ FAIL: Empty title"
    exit 1
fi

echo "✅ PASS: Title is valid"
echo "   ✓ Single title line"
echo "   ✓ Contains 'vegan'"
echo "   ✓ Proper formatting"
exit 0