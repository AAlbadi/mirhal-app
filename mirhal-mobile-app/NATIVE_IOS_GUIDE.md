# 🚀 Mirhal iOS Native Launch Checklist

You requested a **strictly native experience**. You are now running the full native iOS project (generated via Expo Prebuild), not a wrapper.

## 🛠 Xcode Setup Steps

1.  **Workspace**: Ensure you opened `Mirhal.xcworkspace` (white icon), NOT `.xcodeproj`.
2.  **Signing**:
    - Select the project root (blue icon "Mirhal") in the left sidebar.
    - Select the **Mirhal** target.
    - Go to **Signing & Capabilities**.
    - Under **Team**, select your Apple ID / Developer Team.
    - *Note: If this fails, ensure your Bundle Identifier (`com.mirhal.mobileapp`) is unique or owned by you.*

## 📱 Running the App

- **Simulator**: Select an iPhone 15/16 Pro simulator from the top bar and press **Play (▶️)**.
- **Real Device**:
    1. Connect your iPhone via USB.
    2. Select your phone in the top bar.
    3. Press **Play**.
    4. *On your phone*: Go to **Settings -> General -> VPN & Device Management** and trust your developer app.

## 💎 Polishing the Native Experience

To ensure it doesn't feel like a web wrapper:

1.  **Splash Screen**:
    - Check `ios/Mirhal/Images.xcassets/SplashScreen.imageset`.
    - Ensure your splash image looks crisp on all device sizes.
    - You can edit the `SplashScreen.storyboard` directly in Xcode for custom animations.

2.  **App Icon**:
    - Check `ios/Mirhal/Images.xcassets/AppIcon.appiconset`.
    - Ensure all sizes are populated correctly (Prebuild usually handles this based on `app.json`).

3.  **Permissions**:
    - Check `ios/Mirhal/Info.plist`.
    - Verify usage descriptions for **Location**, **Camera**, **Photo Library**.
    - Example: `NSLocationWhenInUseUsageDescription` should be user-friendly (e.g., "Mirhal needs your location to find nearby camping spots.").

4.  **Firebase & Google Maps**:
    - **GoogleService-Info.plist**: Drag and drop this file into the root of your Xcode project files (left sidebar) if it's missing. Select "Copy items if needed".
    - **API Keys**: Ensure your API keys in `.env` or `app.json` are unrestricted for your iOS Bundle ID (`com.mirhal.mobileapp`).

## 📦 Preparing for App Store (TestFlight)

1.  In Xcode, go to **Product -> Archive**.
2.  Once built, the **Organizer** window will open.
3.  Click **Distribute App** -> **TestFlight & App Store**.
4.  Follow the prompts to upload.

You are now in full control of the native iOS codebase! 🚀
