# Firebase APNs Configuration Guide

Since I didn't find any `.p8` files in your workspace, you likely need to generate a new one.

Failed push notifications on iOS are almost always due to a missing **APNs Authentication Key**. Firebase needs this key to talk to Apple's Push Notification Service.

Follow these steps exactly:

## 1. Generate Key (Apple Developer Console)
1.  Go to [Apple Developer Console > Certificates, Identifiers & Profiles > Keys](https://developer.apple.com/account/resources/authkeys/list).
2.  Click **(+)** to create a new key.
3.  Name it `Firebase Push Key`.
4.  Check the box for **Apple Push Notifications service (APNs)**.
5.  Click **Continue** -> **Register**.
6.  **Download** the key file (`AuthKey_XXXXXXXXXX.p8`).
    *   *Warning: You can only download this ONCE. Keep it safe.*
7.  Copy the **Key ID** (10-character code, e.g., `XXXXXXXXXX`).
8.  Copy your **Team ID** (found in top right of developer console).

## 2. Upload to Firebase
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Open your Project settings (⚙️ icon).
3.  Click the **Cloud Messaging** tab.
4.  Scroll down to **Apple app configuration**.
5.  Look for **APNs Authentication Key** and click **Upload**.
6.  Upload the `.p8` file you just downloaded.
7.  Enter your **Key ID** and **Team ID**.
8.  Click **Upload**.

## 3. Verify
After uploading, restart your iOS app. 
1.  The app will request a new token.
2.  The server will register it.
3.  Send a test message using `server/scripts/test-push.js` or the Admin Dashboard.
