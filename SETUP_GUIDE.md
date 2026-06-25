# RV Marketplace Setup Guide

## Overview
This is an Airbnb-style peer-to-peer RV & camper marketplace with integrated Google Maps and advanced search functionality.

## Features
- ✅ Airbnb-style UI with modern design
- ✅ Google Maps integration showing RV locations
- ✅ Advanced search with filters (location, dates, guests, price, vehicle type)
- ✅ Split view: Listings on left, interactive map on right
- ✅ Image carousel on listing cards
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Real-time filtering

## Setup Instructions

### 1. Google Maps API Key
To enable the map functionality, you need a Google Maps API key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API (optional, for autocomplete)
4. Go to "Credentials" and create an API key
5. Copy your API key

### 2. Configure Environment Variables
Open `.env.local` and replace the placeholder:

```env
VITE_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here
```

### 3. Run the Application
```bash
npm install
npm run dev
```

The app will be available at `http://localhost:3000/`

## Features Guide

### Search & Filters
- **Location**: Type city names (Dubai, Muscat, Abu Dhabi, Riyadh)
- **Check-in/Check-out**: Select dates for your trip
- **Guests**: Choose number of travelers
- **Vehicle Type**: Filter by RV, Camper, or Trailer
- **Price Range**: Set min/max daily rate (AED 0-2000)

### Map View
- Click markers to see RV details
- Hover over cards to highlight on map
- Click info windows to view full listing
- Toggle map on/off with the button

### Listing Cards
- Hover to see image carousel navigation
- Click left/right arrows to browse photos
- View rating, price, and key details
- Click card to view full details

## Tech Stack
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **React Router** - Navigation
- **@react-google-maps/api** - Google Maps integration
- **Tailwind CSS** - Styling (utility classes)

## File Structure
```
/components
  - SearchBar.tsx       (Search filters)
  - MapView.tsx         (Google Maps)
  - VehicleCard.tsx     (Listing cards)
  - Header.tsx
  - Footer.tsx

/pages
  - HomePage.tsx        (Main listing page)
  - VehicleDetailPage.tsx
  - HostDashboardPage.tsx
  - RenterDashboardPage.tsx

/data
  - mockData.ts         (Sample RV listings)

/types.ts              (TypeScript interfaces)
```

## Customization

### Adding More RVs
Edit `/data/mockData.ts` and add new vehicles with:
- Coordinates (lat/lng)
- Photos
- Location, price, capacity
- Features and amenities

### Styling
The app uses Tailwind CSS utility classes. Main colors:
- Primary: Pink/Red gradient (`from-pink-500 to-red-500`)
- Backgrounds: White, Gray
- Text: Gray-900, Gray-600

### Google Maps Customization
Edit `/components/MapView.tsx` to change:
- Default zoom level
- Map style/theme
- Marker icons
- Info window design

## Important Notes

⚠️ **Google Maps API Key**: Without a valid API key, the map will show a "For development purposes only" watermark and may not work in production.

💡 **API Key Security**:
- Restrict your API key to specific domains in Google Cloud Console
- Never commit real API keys to version control
- Use environment variables

## Next Steps

1. **Add Authentication**: Implement user login/signup
2. **Booking System**: Create reservation flow
3. **Payment Integration**: Add Stripe/PayPal
4. **Reviews**: Enable user reviews and ratings
5. **Host Management**: Dashboard for RV owners
6. **Real Database**: Connect to Firebase, Supabase, or PostgreSQL

## Support
For issues or questions:
- Check browser console for errors
- Verify Google Maps API key is valid
- Ensure all dependencies are installed
- Check that `.env.local` is properly configured

Enjoy building your RV marketplace! 🚐✨
