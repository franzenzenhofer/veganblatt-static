#!/bin/bash

# VeganBlatt Static Site - Deployment Validation Script
# Run this after deploying to verify everything is working

echo "=================================="
echo "VeganBlatt Deployment Validator"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -d "public" ]; then
    echo "❌ ERROR: public/ directory not found"
    echo "Run this script from: /Users/franzenzenhofer/dev/veganblatt-migration/static-site/"
    exit 1
fi

# Initialize counters
PASS=0
FAIL=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo "✅ $2"
        ((PASS++))
    else
        echo "❌ MISSING: $2"
        ((FAIL++))
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        COUNT=$(find "$1" -name "*.html" | wc -l | tr -d ' ')
        echo "✅ $2 ($COUNT files)"
        ((PASS++))
    else
        echo "❌ MISSING: $2"
        ((FAIL++))
    fi
}

echo "Checking critical files..."
echo "--------------------------"
check_file "public/index.html" "Homepage"
check_file "public/articles.html" "Articles index"
check_file "public/recipes.html" "Recipes index"
check_file "public/css/styles.css" "Stylesheet"
check_file "public/i/assets/veganblatt-logo.svg" "Logo"
check_file "public/about/impressum.html" "Impressum"
check_file "public/about/datenschutz.html" "Datenschutz"

echo ""
echo "Checking directories..."
echo "-----------------------"
check_dir "public/articles" "Articles directory"
check_dir "public/recipes" "Recipes directory"
check_dir "public/i" "Images directory"

echo ""
echo "Checking content counts..."
echo "--------------------------"
ARTICLES=$(find public/articles -name "*.html" | wc -l | tr -d ' ')
RECIPES=$(find public/recipes -name "*.html" | wc -l | tr -d ' ')
IMAGES=$(find public/i -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.svg" \) | wc -l | tr -d ' ')
TOTAL_HTML=$(find public -name "*.html" | wc -l | tr -d ' ')

echo "📊 Articles: $ARTICLES"
echo "📊 Recipes: $RECIPES"
echo "📊 Images: $IMAGES"
echo "📊 Total HTML files: $TOTAL_HTML"

echo ""
echo "Checking file sizes..."
echo "----------------------"
TOTAL_SIZE=$(du -sh public | cut -f1)
echo "📦 Total size: $TOTAL_SIZE"

if [ $(du -s public | cut -f1) -gt 1048576 ]; then
    echo "⚠️  Warning: Site is larger than 1GB"
fi

echo ""
echo "=================================="
echo "VALIDATION RESULTS"
echo "=================================="
echo "✅ Passed: $PASS checks"
if [ $FAIL -gt 0 ]; then
    echo "❌ Failed: $FAIL checks"
    echo ""
    echo "⚠️  DEPLOYMENT VALIDATION FAILED"
    echo "Please fix the issues above before deploying"
    exit 1
else
    echo ""
    echo "🎉 DEPLOYMENT VALIDATION PASSED!"
    echo "Your VeganBlatt site is ready to deploy!"
    echo ""
    echo "Deploy the 'public/' directory to your hosting provider."
fi

echo ""
echo "Quick deployment commands:"
echo "--------------------------"
echo "GitHub Pages:  git subtree push --prefix public origin gh-pages"
echo "Netlify:       Drag 'public/' folder to app.netlify.com/drop"
echo "Vercel:        cd public && vercel"
echo "Surge:         cd public && surge"
echo ""