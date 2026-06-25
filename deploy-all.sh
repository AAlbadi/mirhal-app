#!/bin/bash

echo "🚀 Mirhal Deployment Script"
echo "============================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Build Frontend
echo -e "\n${BLUE}Step 1: Building Frontend...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend built successfully${NC}"

# Step 2: Create Frontend deployment package
echo -e "\n${BLUE}Step 2: Creating Frontend package...${NC}"
cd dist
zip -r ../frontend-deploy.zip . -x "*.DS_Store"
cd ..
echo -e "${GREEN}✅ Created: frontend-deploy.zip${NC}"

# Step 3: Create Backend deployment package
echo -e "\n${BLUE}Step 3: Creating Backend package...${NC}"
cd server
zip -r ../backend-deploy.zip . \
    -x "node_modules/*" \
    -x ".git/*" \
    -x "*.DS_Store" \
    -x ".env.example"
cd ..
echo -e "${GREEN}✅ Created: backend-deploy.zip${NC}"

# Done
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ All packages ready for deployment!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${BLUE}📦 Upload Instructions:${NC}"
echo ""
echo "1️⃣  Frontend (frontend-deploy.zip):"
echo "   → Upload to: public_html/"
echo "   → Extract it there"
echo "   → DELETE old files first!"
echo ""
echo "2️⃣  Backend (backend-deploy.zip):"
echo "   → Upload to: /mirhal/server/"
echo "   → Extract it there"
echo "   → Make sure .env file has your passwords!"
echo ""
echo "3️⃣  Don't forget to upload:"
echo "   → server/serviceAccountKey.json (from Firebase)"
echo "   → ios/App/App/GoogleService-Info.plist (from Firebase)"
echo "   → android/app/google-services.json (from Firebase)"
echo ""
echo -e "${BLUE}🎯 Files created in current directory:${NC}"
ls -lh frontend-deploy.zip backend-deploy.zip

echo -e "\n${GREEN}Done! 🎉${NC}"
