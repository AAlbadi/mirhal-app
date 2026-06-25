#!/bin/bash

# Mirhal Frontend Deployment Script
# This script builds and packages ONLY the latest files

echo "🚀 Starting Mirhal Frontend Deployment..."

# Step 1: Clean old dist folder
echo "🧹 Cleaning old build files..."
rm -rf dist

# Step 2: Build fresh
echo "🔨 Building fresh frontend..."
npm run build

# Step 3: Remove old zip if exists
echo "📦 Removing old zip..."
rm -f FINAL_FRONTEND.zip

# Step 4: Create clean zip with ONLY new files
echo "📦 Creating deployment package..."
cd dist && zip -r ../FINAL_FRONTEND.zip . && cd ..

# Step 5: Show what's inside
echo "✅ Package created! Contents:"
unzip -l FINAL_FRONTEND.zip | grep "index-.*\.js" | head -5

echo ""
echo "🎉 FINAL_FRONTEND.zip is ready!"
echo ""
echo "📋 Deployment Instructions:"
echo "1. Go to cPanel File Manager"
echo "2. Navigate to public_html"
echo "3. DELETE ALL FILES in public_html"
echo "4. Upload FINAL_FRONTEND.zip"
echo "5. Extract the zip"
echo "6. Delete the zip file"
echo "7. Hard refresh browser (Cmd+Shift+R)"
echo ""
echo "✨ Your site will have ONLY the latest files!"
