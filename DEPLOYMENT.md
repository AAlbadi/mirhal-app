# Deployment Guide - Mirhal Marketplace

This guide outlines the steps to deploy the Mirhal Marketplace "State of the Art" application.

## 1. Prerequisites

- **GitHub Repository**: Ensure your code is pushed to a GitHub repository.
- **Accounts**:
    - [Vercel](https://vercel.com) (for Frontend)
    - [Render](https://render.com) or [Heroku](https://heroku.com) (for Backend)
    - [MongoDB Atlas](https://www.mongodb.com/atlas) (for Database)
    - [Auth0](https://auth0.com) (for Authentication)

## 2. Backend Deployment (Render)

The backend is a Node.js/Express application.

1.  **Create a Web Service** on Render.
2.  **Connect your GitHub repo**.
3.  **Settings**:
    - **Root Directory**: `server`
    - **Build Command**: `npm install`
    - **Start Command**: `node index.js`
4.  **Environment Variables**:
    Add the following variables from your `server/.env` file:
    - `MONGODB_URI`: Your production MongoDB connection string.
    - `AUTH0_DOMAIN`: Your Auth0 domain.
    - `AUTH0_AUDIENCE`: Your Auth0 API audience.
    - `FRONTEND_URL`: The URL of your deployed frontend (e.g., `https://mirhal-app.vercel.app`).
    - `STRIPE_SECRET_KEY`: Your Stripe secret key.
    - `SENDGRID_API_KEY`: Your SendGrid API key.

## 3. Frontend Deployment (Vercel)

The frontend is a Vite + React application.

1.  **Import Project** on Vercel.
2.  **Settings**:
    - **Framework Preset**: Vite
    - **Root Directory**: `./` (default)
    - **Build Command**: `npm run build`
    - **Output Directory**: `dist`
3.  **Environment Variables**:
    Add the following variables from your `.env.local` file:
    - `VITE_API_URL`: The URL of your deployed backend (e.g., `https://mirhal-api.onrender.com/api`).
    - `VITE_AUTH0_DOMAIN`: Your Auth0 domain.
    - `VITE_AUTH0_CLIENT_ID`: Your Auth0 Client ID.
    - `VITE_AUTH0_AUDIENCE`: Your Auth0 API audience.
    - `VITE_GOOGLE_MAPS_API_KEY`: Your Google Maps API Key.
    - `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe Publishable Key.

## 4. Mobile App Deployment (Expo)

To publish the mobile app:

1.  **Install EAS CLI**: `npm install -g eas-cli`
2.  **Login**: `eas login`
3.  **Configure**: `eas build:configure`
4.  **Build**:
    - **Android**: `eas build -p android`
    - **iOS**: `eas build -p ios` (Requires Apple Developer Account)
5.  **Submit**: `eas submit`

## 5. Final Checks

- **CORS**: Ensure your Backend `FRONTEND_URL` matches your Vercel URL exactly.
- **Auth0 Callbacks**: Add your Vercel URL to the "Allowed Callback URLs", "Allowed Logout URLs", and "Allowed Web Origins" in your Auth0 Application settings.
- **Google Maps**: Add your Vercel URL to the allowed referrers in your Google Cloud Console credentials.
