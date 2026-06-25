#!/bin/bash

# Mirhal Marketplace - cPanel Deployment Script
# This script builds the frontend and prepares files for cPanel upload

echo "🚀 Starting Mirhal Marketplace Deployment Build..."
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Clean previous builds
echo -e "${BLUE}📦 Step 1: Cleaning previous builds...${NC}"
rm -rf dist/
rm -rf cpanel-deploy/
echo -e "${GREEN}✓ Cleaned${NC}"

# Step 2: Build the frontend
echo -e "${BLUE}📦 Step 2: Building frontend...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed! Please fix errors and try again.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Frontend built successfully${NC}"

# Step 3: Create deployment directory
echo -e "${BLUE}📦 Step 3: Creating deployment package...${NC}"
mkdir -p cpanel-deploy/public_html
mkdir -p cpanel-deploy/server

# Step 4: Copy frontend files
echo -e "${BLUE}📦 Step 4: Copying frontend files...${NC}"
cp -r dist/* cpanel-deploy/public_html/
cp .htaccess cpanel-deploy/public_html/ 2>/dev/null || echo "No .htaccess found, creating one..."

# Create .htaccess if it doesn't exist
if [ ! -f cpanel-deploy/public_html/.htaccess ]; then
    cat > cpanel-deploy/public_html/.htaccess << 'EOF'
# Enable Rewrite Engine
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Handle React Router - send all requests to index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Enable GZIP Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
  ExpiresByType application/pdf "access plus 1 month"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>
EOF
    echo -e "${GREEN}✓ Created .htaccess${NC}"
fi

echo -e "${GREEN}✓ Frontend files copied${NC}"

# Step 5: Copy server files (if deploying backend to cPanel)
echo -e "${BLUE}📦 Step 5: Copying server files...${NC}"
cp -r server/* cpanel-deploy/server/
echo -e "${GREEN}✓ Server files copied${NC}"

# Step 6: Create deployment instructions
cat > cpanel-deploy/UPLOAD_INSTRUCTIONS.txt << 'EOF'
╔════════════════════════════════════════════════════════════════╗
║          MIRHAL MARKETPLACE - cPanel Upload Instructions        ║
╚════════════════════════════════════════════════════════════════╝

📋 FRONTEND DEPLOYMENT (public_html folder)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Login to your cPanel
2. Open "File Manager"
3. Navigate to public_html (or your domain's root directory)
4. Upload ALL files from the "cpanel-deploy/public_html" folder
5. Make sure .htaccess is uploaded (enable "Show Hidden Files" if needed)

📋 BACKEND DEPLOYMENT (server folder)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Option A: Deploy to cPanel Node.js App
1. In cPanel, go to "Setup Node.js App"
2. Create New Application:
   - Node.js version: 18.x or higher
   - Application mode: Production
   - Application root: server
   - Application URL: api.yourdomain.com (or subdomain)
   - Application startup file: index.js
3. Upload all files from "cpanel-deploy/server" to the server directory
4. Click "Run NPM Install"
5. Set Environment Variables (see below)
6. Start the application

Option B: Deploy Backend Separately (Recommended)
- Use Render.com, Railway.app, or Heroku for the backend
- Update VITE_API_URL in your frontend environment variables

📋 ENVIRONMENT VARIABLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Backend (.env in server directory):
- MONGODB_URI=your_mongodb_connection_string
- JWT_SECRET=your_jwt_secret
- FRONTEND_URL=https://yourdomain.com
- STRIPE_SECRET_KEY=your_stripe_secret
- SENDGRID_API_KEY=your_sendgrid_key
- PORT=3001

Frontend (already built into the files):
- VITE_API_URL=https://api.yourdomain.com/api
- VITE_GOOGLE_MAPS_API_KEY=your_maps_key
- VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_public_key
- VITE_AUTH0_DOMAIN=your_auth0_domain
- VITE_AUTH0_CLIENT_ID=your_auth0_client_id

📋 POST-DEPLOYMENT CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Verify .htaccess is working (test a route like /about)
✓ Check that images and assets load correctly
✓ Test API connection from frontend
✓ Verify SSL certificate is active (HTTPS)
✓ Test authentication flow
✓ Check mobile responsiveness
✓ Test payment processing (in test mode first!)

📋 TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Issue: 404 errors on routes
→ Make sure .htaccess is uploaded and mod_rewrite is enabled

Issue: Assets not loading
→ Check file permissions (644 for files, 755 for directories)

Issue: API not connecting
→ Verify CORS settings in backend allow your domain
→ Check VITE_API_URL is correct in build

Issue: White screen
→ Check browser console for errors
→ Verify all environment variables are set correctly

Need help? Check the logs in cPanel or contact your hosting support.
EOF

# Step 7: Create a quick deployment checklist
cat > cpanel-deploy/DEPLOYMENT_CHECKLIST.md << 'EOF'
# 🚀 Deployment Checklist

## Before Deployment
- [ ] Update environment variables in `.env.local`
- [ ] Test application locally (`npm run dev`)
- [ ] Run build script (`./deploy-cpanel.sh`)
- [ ] Review build output for errors

## During Deployment
- [ ] Upload `public_html` contents to cPanel File Manager
- [ ] Upload `.htaccess` file (show hidden files)
- [ ] Set up Node.js app for backend (if using cPanel)
- [ ] Configure environment variables in cPanel
- [ ] Install dependencies (`npm install` in server)

## After Deployment
- [ ] Test homepage loads
- [ ] Test routing (navigate to different pages)
- [ ] Test API connectivity
- [ ] Test authentication
- [ ] Test image uploads
- [ ] Test search functionality
- [ ] Test on mobile devices
- [ ] Check SSL certificate
- [ ] Monitor error logs

## DNS & Domain Setup
- [ ] Point domain A record to server IP
- [ ] Set up SSL certificate (Let's Encrypt in cPanel)
- [ ] Configure subdomain for API if needed
- [ ] Update CORS settings with production domain

## External Services
- [ ] Update Auth0 callback URLs
- [ ] Update Stripe webhook URLs
- [ ] Update Google Maps API restrictions
- [ ] Update Firebase authorized domains
- [ ] Test email delivery (SendGrid)

## Performance
- [ ] Enable GZIP compression (check .htaccess)
- [ ] Enable browser caching (check .htaccess)
- [ ] Optimize images
- [ ] Test page load speed
- [ ] Check mobile performance

## Security
- [ ] Verify HTTPS is enforced
- [ ] Check environment variables are not exposed
- [ ] Review CORS settings
- [ ] Test rate limiting
- [ ] Review file permissions
EOF

# Step 8: Create environment template
cat > cpanel-deploy/.env.production.template << 'EOF'
# Backend Environment Variables (server/.env)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mirhal?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this
FRONTEND_URL=https://yourdomain.com
PORT=3001

# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key

# SendGrid
SENDGRID_API_KEY=SG.your_sendgrid_api_key

# Firebase Admin (if using)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----\n"

# Frontend Environment Variables (already baked into build)
# These should be set in .env.local BEFORE running build
# VITE_API_URL=https://api.yourdomain.com/api
# VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
# VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
# VITE_AUTH0_DOMAIN=your-tenant.auth0.com
# VITE_AUTH0_CLIENT_ID=your_auth0_client_id
# VITE_AUTH0_AUDIENCE=https://api.yourdomain.com
EOF

# Step 9: Create ZIP archive for easy upload
echo -e "${BLUE}📦 Step 6: Creating ZIP archives...${NC}"

# Create the full deployment package (for root level deployment)
cd cpanel-deploy
zip -r ../mirhal-full-deployment.zip . -x "*.DS_Store"
cd ..

# Create a FRONTEND ONLY zip (flat) for uploading directly into public_html
cd dist
zip -r ../mirhal-frontend.zip . -x "*.DS_Store"
cd ..

echo -e "${GREEN}✓ ZIP archive created: mirhal-full-deployment.zip (Full Server + Client)${NC}"
echo -e "${GREEN}✓ ZIP archive created: mirhal-frontend.zip (Frontend Files ONLY - Upload to public_html)${NC}"

# Final summary
echo ""
echo -e "${GREEN}=================================================="
echo -e "✅ Deployment packages ready!"
echo -e "==================================================${NC}"
echo ""
echo -e "${BLUE}📦 Option A (Frontend Only): ${NC}mirhal-frontend.zip"
echo -e "   -> Upload this INSIDE public_html and extract. No nested folders."
echo ""
echo -e "${BLUE}📦 Option B (Full Project): ${NC}mirhal-full-deployment.zip"
echo -e "   -> Upload this to root directory (above public_html)."
echo ""
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Review UPLOAD_INSTRUCTIONS.txt"
echo "2. Upload files to cPanel"
echo "3. Configure environment variables"
echo "4. Test your deployment"
echo ""
echo -e "${GREEN}Good luck with your deployment! 🚀${NC}"
