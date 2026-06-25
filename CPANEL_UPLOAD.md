# 🚀 cPanel Upload Instructions

## Quick Steps:

1. **Login to cPanel** at your hosting provider
2. **Open File Manager**
3. **Navigate to `public_html`** (or your domain's root folder)
4. **Delete old files** (backup first if needed!)
5. **Upload `dist.zip`**
6. **Extract the zip** (right-click → Extract)
7. **Upload `.htaccess`** file (enable "Show Hidden Files" in File Manager settings)
8. **Done!** Visit your website

## Important Notes:

### .htaccess File
- This file is **required** for React Router to work
- Make sure to enable "Show Hidden Files" in cPanel File Manager settings
- The .htaccess handles:
  - React Router redirects
  - HTTPS enforcement
  - GZIP compression
  - Browser caching

### File Permissions
- Files should be: `644`
- Directories should be: `755`
- cPanel usually sets these automatically

### Testing
After upload, test:
- ✓ Homepage loads
- ✓ Navigation works (try /about, /search, etc.)
- ✓ Images load correctly
- ✓ HTTPS is working
- ✓ Mobile view works

### Troubleshooting

**404 errors on routes?**
→ Make sure .htaccess is uploaded and mod_rewrite is enabled

**Assets not loading?**
→ Check file paths and permissions

**Blank page?**
→ Check browser console for errors
→ Verify environment variables were set correctly before build

## Need to rebuild?

If you need to update the site:
1. Make your changes locally
2. Run: `npm run build`
3. Run: `./build-for-cpanel.sh` (or manually zip the dist folder)
4. Upload new dist.zip to cPanel
5. Extract and replace files

---

**Your dist.zip is ready to upload!** 📦
