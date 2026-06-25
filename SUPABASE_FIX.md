# 🛑 CRITICAL SUPABASE FIX

Your app redirects to `localhost:3000` because **Supabase** is configured that way. You need to change it to `https://mirhal.app`.

## 1. Go to Supabase Dashboard
1. Open your project.
2. Click **Authentication** icon (left sidebar).
3. Click **URL Configuration** (bottom of list).

## 2. Update Site URL
- **Site URL**: Change `http://localhost:3000` to `https://mirhal.app`

## 3. Update Redirect URLs
- Use the **Add URL** button to add these:
  - `https://mirhal.app`
  - `https://mirhal.app/**`
  - `https://mirhal.app/auth/callback`

## 4. Save
- Click **Save**.

## 5. Test (Important!)
1. Go to `https://mirhal.app`.
2. **Log Out** if you are logged in.
3. **Log In** again with Google.
4. Watch the URL bar. It should stay on `mirhal.app` and NOT go to `localhost`.

Once this is fixed, all your other errors (Profile link, Sync error) will disappear automatically.
