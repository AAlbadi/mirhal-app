#!/bin/bash

# Simple Frontend Build & Zip for cPanel
echo "🚀 Building frontend for cPanel deployment..."

# Build the frontend
echo "📦 Building..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Create zip of dist folder
echo "📦 Creating dist.zip..."
cd dist
zip -r ../dist.zip . -x "*.DS_Store"
cd ..

echo "✅ Done! Upload dist.zip to your cPanel public_html folder"
echo "📁 File ready: dist.zip"
