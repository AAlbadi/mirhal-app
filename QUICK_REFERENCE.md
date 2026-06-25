# Mirhal Codebase - Quick Reference Guide

## Quick Navigation

### Key File Locations
- **Main App**: `/Users/aziz/Downloads/mirhal-–-peer-to-peer-rv-&-camper-marketplace/App.tsx`
- **Main Page**: `/pages/HomePage.tsx` (split view: listing + map)
- **Listing Card**: `/components/VehicleCard.tsx` (PRIMARY WIDGET)
- **Search Widget**: `/components/SearchBar.tsx`
- **Styling Config**: `/index.html` (Tailwind config in script tag)
- **Types**: `/types.ts` (Vehicle, Booking, Review interfaces)

---

## Color Palette Reference

```
BROWNS (Primary Palette):
  brand-brown-dark    #4a2c2a  (Headers, Dark Sections)
  brand-brown-medium  #a37b73  (Header Background)
  brand-brown-light   #d5b9b2  (Borders, Secondary Text)
  brand-sand          #f3e9e1  (Page Background)

ACCENTS (Interactive):
  brand-accent-teal   #008080  (Primary Buttons, Links)
  brand-accent-orange #d95f02  (Secondary Actions)

SEMANTIC:
  brand-success       #2a9d8f  (Success States)
  brand-error         #e76f51  (Errors, Warnings)

USAGE:
  ✓ Text: text-brand-brown-dark (primary), text-brand-brown-medium (secondary)
  ✓ Buttons: bg-brand-accent-teal or bg-brand-brown-dark
  ✓ Backgrounds: bg-brand-sand (page), bg-white (cards)
  ✓ Borders: border-brand-brown-light (default), border-brand-accent-teal (accent)
```

---

## Typography System

```
FONT: Urbanist (Google Fonts)
  Weights: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
  
USAGE PATTERNS:
  Page Headings:    text-3xl font-extrabold (brand name)
  Section Titles:   text-2xl font-semibold or text-xl font-bold
  Card Titles:      text-base font-bold
  Labels:           text-sm font-semibold
  Body Text:        text-sm to text-base
  Small Text:       text-xs
```

---

## Component Tree

```
App.tsx
├── I18nProvider (Internationalization)
├── AuthProvider (Authentication)
├── Header (Navigation, Language Toggle)
├── Routes (React Router)
│   ├── HomePage
│   │   ├── SearchBar
│   │   ├── VehicleCard (repeating in grid)
│   │   └── MapView
│   ├── VehicleDetailPage
│   ├── BookingModal
│   ├── HostDashboard / AdminDashboard
│   └── ...other pages
└── Footer

COMPONENT LOCATIONS:
  Layout:    /components/Header.tsx, Footer.tsx
  Listings:  /components/VehicleCard.tsx (main widget)
  Search:    /components/SearchBar.tsx
  Forms:     /components/*Form.tsx
  Dialogs:   /components/BookingModal.tsx
```

---

## Responsive Grid Layout

**VehicleCard Grid in HomePage.tsx:**
```
Mobile (default):  1 column
Tablet (sm):       2 columns
Desktop (lg):      3 columns
Large (xl):        4 columns
Gap:               24px (gap-6)
```

---

## Styling Approach

**Method**: Tailwind CSS (CDN-based)
- Location: Configured in `/index.html` within `<script>` tag
- No external CSS files
- All colors custom-defined in tailwind.config
- Animations via inline `<style>` tags in components

**Key Classes Used**:
```
Layout:      flex, grid grid-cols-*, space-x, space-y
Colors:      text-*, bg-*, border-*, shadow-*
Effects:     hover:*, transition, duration-*
Responsive:  sm:, md:, lg:, xl:
```

---

## Data Structure (Key Types)

```typescript
// Main Vehicle Type
interface Vehicle {
  id: string;
  hostId: string;
  title: string;
  type: 'RV' | 'Camper' | 'Trailer';
  pricePerDay: number;
  location: string;
  coordinates: { lat: number; lng: number };
  rating: number;
  reviewCount: number;
  photos: string[];
  capacity: number;
  features: string[];
  description: string;
  addons: Addon[];
  withDriver: boolean;
  deliveryAvailable: boolean;
}

// Booking Types
interface Booking {
  id: string;
  renterId: string;
  hostId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
}
```

---

## Important Styling Patterns

### VehicleCard Example
```jsx
<div className="border border-brand-brown-light rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all">
  <div className="aspect-square bg-brand-sand overflow-hidden">
    <img className="hover:scale-105 transition-transform" src={photo} />
  </div>
  <div className="p-4">
    <h3 className="text-base font-bold text-brand-brown-dark">{location}</h3>
    <span className="text-lg font-bold text-brand-brown-dark">AED {price}</span>
  </div>
</div>
```

### SearchBar Example
```jsx
<div className="bg-white rounded-full shadow-lg border border-brand-brown-light">
  <button className="bg-brand-accent-teal text-white rounded-full p-4">Search</button>
  <select className="border-2 border-brand-brown-light rounded-xl focus:ring-2 focus:ring-brand-accent-teal">
</div>
```

### Header Example
```jsx
<header className="bg-brand-brown-medium">
  <a className="text-3xl font-extrabold text-white">Brand</a>
  <button className="text-white hover:text-brand-sand">Link</button>
</header>
```

---

## Key Dependencies

```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-router-dom": "^7.9.4",
  "typescript": "~5.8.2",
  "@stripe/react-stripe-js": "^5.3.0",
  "@react-google-maps/api": "^2.20.7",
  "firebase": "^12.4.0",
  "@auth0/auth0-react": "^2.8.0",
  "date-fns": "^4.1.0",
  "react-day-picker": "^9.11.1"
}
```

**Build**: Vite 6.2.0
**Dev Server**: localhost:3000
**API Server**: localhost:5001

---

## Environment Variables

Key configs in `.env.local`:
```
VITE_API_URL=http://localhost:5001
VITE_STRIPE_PUBLISHABLE_KEY=pk_...
VITE_GOOGLE_MAPS_API_KEY=...
GEMINI_API_KEY=...
```

---

## Internationalization (i18n)

- **Context**: `/contexts/I18nContext.tsx`
- **Languages**: Arabic (ar) and English (en)
- **Usage**: `const { t, lang, setLang, dir } = useI18n();`
- **Dir Attribute**: RTL for Arabic (dir={dir})

---

## Authentication

- **Providers**: Auth0 + Firebase
- **Context**: `/contexts/AuthContext.tsx`
- **Usage**: `const { currentUser, getIdToken } = useAuth();`

