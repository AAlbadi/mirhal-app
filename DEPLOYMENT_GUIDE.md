# cPanel Deployment Guide for Mirhal

Follow this guide to deploy the latest updates to your live cPanel server.

## 1. Prepare Frontend Build (React)

First, build the optimized frontend files on your local machine:

1. Open your terminal in VS Code.
2. Run the build command:
   ```bash
   npm run build
   ```
3. This creates a `dist/` folder.
4. Compress this `dist/` folder into a ZIP file named `dist.zip`.

**Upload to cPanel:**
1. Login to cPanel File Manager.
2. Navigate to your frontend directory (usually `public_html` or a subdomain folder).
3. **Backup**: Rename your existing files (e.g., `index.html.bak`) just in case.
4. **Upload** `dist.zip`.
5. **Extract** `dist.zip` into the folder.
6. **Move** contents from `dist/` to the main folder if they extracted into a subfolder.
7.  **IMPORTANT:** Ensure the `.htaccess` file (included in `dist.zip`) is uploaded and hidden files are visible in cPanel. This file fixes the "Connection Refused" (CSP) errors.

---

## 2. Update Backend API (Node.js)

Since we added account deletion (`DELETE /api/users/me`), you must update the backend code.

**What to Upload:**
1. Navigate to your backend directory in cPanel (e.g., `mirhal-api` or where your Node app lives).
2. Upload the updated file:
   - `server/routes/users.js` -> replace existing file in `routes/` folder.
   - `server/package.json` -> if you added new dependencies (none added this time, but good practice).

**Restart Server:**
1. Go to cPanel -> **Setup Node.js App**.
2. Find your Mirhal API application.
3. Click the **Restart** button.

---

## 3. Environment Variables (.env)

Ensure your cPanel environment variables match your local `.env`.

**Frontend (.env in root):**
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct.
- If you change these, you must run `npm run build` again!

**Backend (.env in server folder):**
- Verify `MONGODB_URI` connects to your production database.
- Verify `SUPABASE_URL`, `SUPABASE_KEY` (service role key) are set if utilized by backend.

---

## 4. Verification Checklist

After deployment, check these live:

- [ ] **Homepage**: Loads new design correctly.
- [ ] **Homepage**: Loads new design correctly.
- [ ] **Login**: Sign In with Google works immediately (no loading spinner hang).
- [ ] **CSP Check**: If login fails, check browser console for "Refused to connect" errors. If present, re-upload `.htaccess`.
- [ ] **Forgot Password**: Click link -> receive branded email from `support@mirhal.com`.
- [ ] **Profile**: "Settings" tab is visible.
- [ ] **Delete Account**: (Optional test) Try creating a dummy account and deleting it to verify backend connection.

## Support Config
Your support email is: `support@mirhal.com`
Ensure this email is created in cPanel -> Email Accounts.

---

**Ready for iOS App!**
Once the above is live and tested, your backend/frontend is ready to support the iOS app build.
