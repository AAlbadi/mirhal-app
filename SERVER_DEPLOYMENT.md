# Server Deployment Checklist for mirhal.app

## 📋 What You Need to Do on cPanel

### **Step 1: Clean the `/mirhal` Folder**

1. Go to **cPanel File Manager**
2. Navigate to `/home/cnatfrqfjx/mirhal/`
3. You'll see folders like:
   - `server/`
   - `node_modules/`
   - Old files

4. **Delete ONLY these old files** (keep the folders):
   - Any `.zip` files
   - Any old `.env` files in the root
   - Any stray JavaScript files

5. **Keep these folders:**
   - ✅ `server/` (we'll update files inside)
   - ✅ `node_modules/` (if it exists)

### **Step 2: Upload Backend .env File**

1. In File Manager, navigate to `/home/cnatfrqfjx/mirhal/server/`
2. **Delete** the old `.env` file if it exists
3. **Upload** `production.env` from your Downloads folder
4. **Rename** `production.env` to `.env`

### **Step 3: Restart Node.js App**

1. Go to **Setup Node.js App** in cPanel
2. Find your `mirhal.app` application
3. Click **"Run NPM Install"** (wait for it to finish)
4. Click **"Restart"**

### **Step 4: Clean Frontend (public_html)**

1. Navigate to `/home/cnatfrqfjx/public_html/`
2. **Delete ALL files** (select all → delete)
3. **Upload** `FINAL_FRONTEND.zip`
4. **Right-click** → **Extract**
5. **Delete** the zip file after extraction

### **Step 5: Verify**

1. Go to **mirhal.app** in your browser
2. **Hard refresh** (Cmd+Shift+R)
3. Check:
   - ✅ Site loads
   - ✅ Backend API works (spots load)
   - ✅ No 503 errors in console

---

## 📁 Files You Need

**From your Downloads folder:**
- `FINAL_FRONTEND.zip` → Upload to `public_html`
- `production.env` → Upload to `mirhal/server/` (rename to `.env`)

---

## ⚠️ Important Notes

- **Don't delete** `node_modules` unless you're sure you'll run NPM install
- **Don't delete** the `server` folder itself
- **Always restart** the Node.js app after changing `.env`

---

## 🔧 If Backend Still Shows 503

1. Check `/mirhal/server/.env` exists
2. Check it has `MONGODB_URI` and `SUPABASE_KEY`
3. Go to **Setup Node.js App** → **Restart**
4. Check error logs in cPanel

Your backend will connect to:
- MongoDB Atlas (production database)
- Supabase (authentication)
