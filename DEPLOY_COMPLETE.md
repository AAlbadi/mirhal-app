# 🚀 MIRHAL - Complete Deployment (One File)

## Step 1: Delete Old Files
1. In cPanel File Manager, go to your web root (usually `public_html` or `mirhal`)
2. **Delete** the entire `mirhal` folder if it exists

## Step 2: Upload & Extract
1. **Upload** `mirhal_complete.zip`
2. **Extract** it (you'll get `dist` and `server` folders)

## Step 3: Add Environment File
1. Go into the `server` folder
2. **Create a file** named `.env`
3. Copy the contents of your local `server/.env` file into it
   - Or just **upload** your local `.env` file to the `server` folder

## Step 4: Install Dependencies
1. Go to **Setup Node.js App** in cPanel
2. **Create/Edit Application**:
   - Application Root: `/home/[username]/mirhal/server`
   - Application Startup File: `index.js`
   - Node.js Version: Latest (14+ or 16+)
3. Click **"Run NPM Install"**
4. Wait for it to finish (1-2 minutes)
5. Click **"Start"** or **"Restart"**

## Step 5: Test
Go to https://mirhal.app and everything should work! 🎉

---

**Note:** The zip includes:
- ✅ Frontend (`dist/` folder) - Ready to serve
- ✅ Backend (`server/` folder) - All code, routes, models
- ❌ `.env` file - You must add this manually (security)
- ❌ `node_modules` - Will be installed by "Run NPM Install"
