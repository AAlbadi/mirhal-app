#!/bin/bash

# Mirhal Native iOS Setup Script
echo "🍎 Setting up Mirhal for native iOS testing..."

# Navigate to mobile app directory
cd mirhal-mobile-app

# 1. Install JS dependencies to be safe
echo "📦 Installing JavaScript dependencies..."
npm install

# 2. Sync Native Code (Prebuild)
# This ensures app.json config (icons, names, bundle IDs) is written to the iOS project
echo "🔄 Syncing native project with Expo config..."
npx expo prebuild --platform ios --clean

# 3. Install Native Pods
echo "🥥 Installing CocoaPods..."
cd ios
pod install
cd ..

# 4. Open in Xcode
echo "🚀 Opening in Xcode..."
xcode-select -p > /dev/null
if [ $? -eq 0 ]; then
    open ios/mirhal.xcworkspace
    echo "✅ Xcode opened! Select your simulator (e.g., iPhone 16 Pro) and hit the Play button (▶️)."
else
    echo "⚠️ Xcode not detected or command line tools missing."
    echo "Please install Xcode from the Mac App Store."
fi
