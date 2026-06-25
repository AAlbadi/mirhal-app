# Mirhal RV Marketplace - Setup Guide

This guide will help you set up and run the Mirhal peer-to-peer RV marketplace with Auth0 authentication, MongoDB backend, and SendGrid email notifications.

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **MongoDB** (v5 or higher) - Local or MongoDB Atlas account
- **Auth0 Account** (Free tier works)
- **SendGrid Account** (Free tier works)

## Setup Steps

### 1. Auth0 Configuration

1. Go to [Auth0 Dashboard](https://manage.auth0.com)
2. Create a new Application (Single Page Application)
3. Note down your:
   - **Domain** (e.g., `your-tenant.auth0.com`)
   - **Client ID**
4. Configure Application Settings:
   - **Allowed Callback URLs**: `http://localhost:3000`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`
5. Create an API:
   - Go to Applications > APIs > Create API
   - Name: `Mirhal API`
   - Identifier: `https://mirhal-api` (or your choice)
   - Note down the **API Identifier** (this is your audience)

### 2. SendGrid Configuration

1. Go to [SendGrid Dashboard](https://app.sendgrid.com)
2. Create an API Key:
   - Settings > API Keys > Create API Key
   - Choose "Full Access" or "Restricted Access" with Mail Send permissions
   - Copy the API Key (you won't see it again!)
3. Verify a Sender Identity:
   - Settings > Sender Authentication
   - Verify a Single Sender email address

### 3. MongoDB Setup

#### Option A: Local MongoDB
Install MongoDB locally (macOS):
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

Your connection string will be: mongodb://localhost:27017/mirhal-marketplace

#### Option B: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Add your IP address to IP Whitelist
4. Create a database user
5. Get your connection string (replace password)

### 4. Frontend Environment Configuration

Update `.env.local` in the root directory with your Auth0 credentials:

VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_auth0_client_id
VITE_AUTH0_AUDIENCE=https://mirhal-api
VITE_API_URL=http://localhost:5000/api

### 5. Backend Environment Configuration

Update `server/.env` with your credentials:

MONGODB_URI=mongodb://localhost:27017/mirhal-marketplace
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://mirhal-api
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

## Running the Application

### 1. Install Dependencies
npm install
cd server && npm install && cd ..

### 2. Start MongoDB
brew services start mongodb-community

### 3. Start the Backend Server
cd server && npm run dev

### 4. Start the Frontend
npm run dev

The app will be available at: http://localhost:3000

## Key Features Implemented

- Auth0 social login
- JWT token validation
- Role-based access control (Renter, Host, Both)
- Host application workflow
- Email verification with SendGrid
- Vehicle listing CRUD operations
- MongoDB database with Mongoose

## API Endpoints

### Authentication
- POST /api/auth/register - Register/login user
- POST /api/auth/request-host - Request to become a host
- GET /api/auth/verify-email/:token - Verify email
- GET /api/auth/me - Get current user profile

### Vehicles
- GET /api/vehicles - Get all vehicles
- GET /api/vehicles/:id - Get single vehicle
- POST /api/vehicles - Create vehicle (host only)
- PUT /api/vehicles/:id - Update vehicle (owner only)
- DELETE /api/vehicles/:id - Delete vehicle (owner only)

Happy hosting!
