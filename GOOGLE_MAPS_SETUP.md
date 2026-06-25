# Google Maps API Setup Instructions

## Current Issue
The map is showing "For development purposes only" because the API key needs proper configuration in Google Cloud Console.

## Your Current API Key
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDK5_SlB95tlSqFC4ZnhS6CbLrpoeDVvZs
```

## Steps to Fix

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 2. Enable Required APIs
Make sure these APIs are enabled for your project:
- **Maps JavaScript API** ✓ (Required for map display)
- **Places API** (Optional, for location search)
- **Geocoding API** (Optional, for address lookup)

### 3. Configure API Key
1. Go to **APIs & Services > Credentials**
2. Find your API key: `AIzaSyDK5_SlB95tlSqFC4ZnhS6CbLrpoeDVvZs`
3. Click "Edit" on the key

### 4. Set Application Restrictions
- Choose **HTTP referrers (web sites)**
- Add these URLs:
  ```
  http://localhost:3000/*
  http://localhost:*
  https://yourdomain.com/*
  ```

### 5. Enable Billing (Required!)
⚠️ **This is the most common cause** - Google Maps requires billing to be enabled
1. Go to **Billing** in Cloud Console
2. Link a billing account to your project
3. Don't worry - Google provides $200 free credits per month

### 6. API Restrictions
Restrict the key to only these APIs:
- Maps JavaScript API
- Places API (if using search)
- Geocoding API (if using geocoding)

## Alternative: Create a New API Key

If the above doesn't work, create a fresh API key:

1. Go to **APIs & Services > Credentials**
2. Click **+ CREATE CREDENTIALS > API key**
3. Copy the new key
4. Replace in `.env.local`:
   ```
   VITE_GOOGLE_MAPS_API_KEY=YOUR_NEW_API_KEY_HERE
   ```
5. Restart your dev server: `npm run dev`

## Testing
After configuration:
1. Wait 2-5 minutes for changes to propagate
2. Refresh your browser (hard refresh: Cmd+Shift+R / Ctrl+Shift+R)
3. The "for development purposes only" watermark should disappear

## Need Help?
Contact Google Cloud Support or check:
- https://developers.google.com/maps/documentation/javascript/get-api-key
- https://console.cloud.google.com/google/maps-apis/
