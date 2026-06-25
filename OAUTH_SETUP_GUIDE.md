# OAuth Providers Setup Guide for Supabase

## Quick Overview
Your UI is ready! All authentication buttons are implemented. You just need to configure the OAuth providers in your Supabase Dashboard.

---

## 1. Apple Sign In Setup

### Prerequisites
- Apple Developer Account ($99/year)
- Supabase Project

### Steps

#### A. Create Service ID in Apple Developer
1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click **+** to create new identifier
3. Select **Services IDs** → Continue
4. Enter:
   - Description: `Mirhal Auth`
   - Identifier: `com.mirhal.auth` (or your bundle ID + `.auth`)
5. Click **Continue** → **Register**

#### B. Configure Service ID
1. Click on your newly created Service ID
2. Enable **Sign in with Apple**
3. Click **Configure**
4. **Primary App ID**: Select your main app ID
5. **Domains and Subdomains**: Add:
   ```
   YOUR_PROJECT_REF.supabase.co
   localhost
   ``` 
6. **Return URLs**: Add:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   http://localhost:3000
   ```
7. Click **Save** → **Continue** → **Register**

#### C. Create Key for Sign in with Apple
1. Go to **Keys** tab
2. Click **+** to create new key
3. Name it `Mirhal Auth Key`
4. Enable **Sign in with Apple**
5. Click **Configure** → Select your Primary App ID
6. Click **Save** → **Continue** → **Register**
7. **IMPORTANT**: Download the `.p8` file (you can only do this once!)
8. Note your **Key ID** (10 characters)

#### D. Get Team ID
1. Go to https://developer.apple.com/account
2. Find your **Team ID** at the top right (10 characters)

#### E. Configure in Supabase
1. Go to your Supabase Dashboard → **Authentication** → **Providers**
2. Find **Apple** and click **Enable**
3. Enter:
   - **Service ID**: `com.mirhal.auth` (from step A)
   - **Team ID**: Your 10-character Team ID
   - **Key ID**: Your 10-character Key ID
   - **Private Key**: Paste entire contents of `.p8` file
4. Click **Save**

✅ Apple Sign In is now configured!

---

## 2. Facebook Login Setup

### Prerequisites
- Facebook Developer Account (free)

### Steps

#### A. Create Facebook App
1. Go to https://developers.facebook.com/apps
2. Click **Create App**
3. Select **Consumer** → **Next**
4. Enter:
   - App Name: `Mirhal`
   - App Contact Email: your email
5. Click **Create App**

#### B. Add Facebook Login Product
1. In your app dashboard, find **Facebook Login**
2. Click **Set Up**
3. Choose **Web** platform
4. Enter your site URL: `http://localhost:3000` (for development)
5. Click **Save** → **Continue**

#### C. Configure OAuth Settings
1. Go to **Facebook Login** → **Settings** (left sidebar)
2. **Valid OAuth Redirect URIs**: Add:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   http://localhost:3000
   ```
3. Click **Save Changes**

#### D. Get App Credentials
1. Go to **Settings** → **Basic** (left sidebar)
2. Note your:
   - **App ID**: 15-16 digit number
   - **App Secret**: Click **Show** to reveal

#### E. Make App Live
1. At the top, toggle from **In Development** to **Live**
2. You may need to add a Privacy Policy URL
3. Click **Switch Mode**

#### F. Configure in Supabase
1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Find **Facebook** and click **Enable**
3. Enter:
   - **Facebook Client ID**: Your App ID
   - **Facebook Client Secret**: Your App Secret
4. Click **Save**

✅ Facebook Login is now configured!

---

## 3. Twitter/X Sign In Setup

### Prerequisites
- Twitter Developer Account (free, but requires approval)

### Steps

#### A. Apply for Developer Account
1. Go to https://developer.twitter.com/en/portal/petition/essential/basic-info
2. Fill out the application (may take 24-48 hours for approval)

#### B. Create Twitter App
1. Once approved, go to https://developer.twitter.com/en/portal/dashboard
2. Click **+ Create Project**
3. Project Name: `Mirhal`
4. Use Case: Select appropriate option
5. Project Description: Describe your app
6. Click **Next** → **Create App**
7. Enter App Name: `Mirhal Auth`

#### C. Enable OAuth 2.0
1. In your app settings, go to **User authentication settings**
2. Click **Set up**
3. **App Permissions**: Select **Read**
4. **Type of App**: Select **Web App**
5. **App Info**:
   - Callback URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Website URL: `https://mirhal.app` or `http://localhost:3000`
6. Click **Save**

#### D. Get API Keys
1. Go to **Keys and tokens** tab
2. Note your:
   - **Client ID**: Long string
   - **Client Secret**: Click **Regenerate** to get (save immediately!)

#### E. Configure in Supabase
1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Find **Twitter** and click **Enable**
3. Enter:
   - **Twitter Client ID**: Your Client ID
   - **Twitter Client Secret**: Your Client Secret
4. Click **Save**

✅ Twitter/X Sign In is now configured!

---

## Testing Checklist

After configuring all providers:

### Local Testing
1. Open `http://localhost:3000` (make sure servers are running)
2. Click "Sign In" button
3. Try each provider:
   - [ ] Click "Apple" → Should redirect to Apple login
   - [ ] Click "Google" → Should redirect to Google (already working)
   - [ ] Click "Facebook" → Should redirect to Facebook
   - [ ] Click "X" → Should redirect to Twitter
4. Complete OAuth flow
5. Verify you're logged in and redirected back

### Common Issues

**Apple:**
- Error `invalid_client`: Check Service ID matches exactly
- Error `invalid_request`: Check Return URLs include Supabase callback

**Facebook:**
- Error `URL Blocked`: Add redirect URI to OAuth settings
- Can't sign in: Make sure app is **Live**, not **In Development**

**Twitter:**
- Error `unauthorized_client`: Check callback URI matches exactly
- No approval: Wait for developer account approval (can take 1-2 days)

---

## Production Setup

Before going live:

1. **Apple**: Update Return URLs to include production domain
2. **Facebook**: 
   - Update Valid OAuth Redirect URIs
   - Add Privacy Policy & Terms of Service URLs
3. **Twitter**: Update Callback URI to production
4. **Supabase**: Update redirect URLs in each provider's settings

---

## Environment Variables

Your `.env.local` already has:
```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_GOOGLE_WEB_CLIENT_ID=...
```

No additional env vars needed for these providers - they're configured entirely in Supabase!

---

## Need Help?

- **Apple**: https://developer.apple.com/documentation/sign_in_with_apple
- **Facebook**: https://developers.facebook.com/docs/facebook-login/web
- **Twitter**: https://developer.twitter.com/en/docs/authentication/oauth-2-0
- **Supabase**: https://supabase.com/docs/guides/auth
