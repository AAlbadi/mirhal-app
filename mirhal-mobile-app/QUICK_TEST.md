# ⚡️ Quick Native Test Guide

To run your app natively on your **physical iPhone** without manually fighting Xcode errors:

## 1. The Magic Command
Run this in your terminal:
```bash
cd mirhal-mobile-app
npx expo run:ios --device
```

## 2. What it does
- Builds the native iOS app (fixing pods automatically)
- Installs it on your connected iPhone
- Launches the development server

## 3. Troubleshooting
If it asks you to select a "Development Team", you'll see a prompt. Use the arrow keys to select your **Apple ID (Personal Team)**.

## 4. Manual Xcode Method (Fallback)
If you prefer opening Xcode:
1. `cd mirhal-mobile-app/ios`
2. `open Mirhal.xcworkspace` (ensure this file exists!)
3. Select your phone in top bar -> Play (▶️)
