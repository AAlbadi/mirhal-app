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
