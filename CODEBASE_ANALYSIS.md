# Mirhal RV & Camper Marketplace - Codebase Analysis

## 1. UI Framework

### Framework Stack
- **Primary Framework**: React 19.2.0 (latest)
- **Build Tool**: Vite 6.2.0
- **Package Manager**: npm
- **Dev Server**: Runs on localhost:3000

### Key Dependencies
- **react**: ^19.2.0
- **react-dom**: ^19.2.0
- **react-router-dom**: ^7.9.4 (for routing)
- **TypeScript**: ~5.8.2 (full type safety)

### Styling Approach
- **Tailwind CSS**: Used via CDN (https://cdn.tailwindcss.com)
- **Inline Tailwind Configuration**: Configured in `index.html` via script tag
- **No external CSS files**: No separate CSS files in the project root
- **Styled Components**: Not used
- **CSS Modules**: Not used
- **Styled with inline `<style>` tags**: Used for animations and keyframes in components

## 2. Main Components Location

### Root Structure
```
/Users/aziz/Downloads/mirhal-–-peer-to-peer-rv-&-camper-marketplace/
├── components/          # Core UI components
├── pages/              # Page-level components
├── contexts/           # React Context providers
├── data/               # Mock data
├── server/             # Backend server files
├── App.tsx             # Root app component
├── index.tsx           # React DOM render entry
└── index.html          # HTML entry point
```

### Components Directory (`/components/`)
All components are React functional components with TypeScript:

**Layout Components:**
- `Header.tsx` - Navigation header with language toggle and auth
- `Footer.tsx` - Footer with links and copyright

**Feature Components:**
- `VehicleCard.tsx` - Individual vehicle listing card widget
- `SearchBar.tsx` - Search and filtering interface
- `MapView.tsx` - Google Maps integration
- `BookingModal.tsx` - Booking dialog with Stripe integration
- `DateRangePicker.tsx` - Date selection component
- `AuthButton.tsx` - Authentication button

**Form Components:**
- `BecomeHostForm.tsx` - Host registration form
- `BookingForm.tsx` - Booking submission form
- `AdminAddVehicleForm.tsx` - Admin vehicle management

**Card Components:**
- `HostBookingCard.tsx` - Host booking display
- `GuestBookingCard.tsx` - Guest booking display

**Utility:**
- `Icon.tsx` - Icon component wrapper

### Pages Directory (`/pages/`)
Page-level components using React Router:

- `HomePage.tsx` - Main listing page with split view (list + map)
- `VehicleDetailPage.tsx` - Individual vehicle detail page
- `HostDashboardPage.tsx` - Host dashboard
- `RenterDashboardPage.tsx` - Renter/guest dashboard
- `BecomeHostPage.tsx` - Host signup flow
- `VerifyEmailPage.tsx` - Email verification
- `AdminDashboard.tsx` - Admin interface (older version)
- `AdminDashboardEnhanced.tsx` - Enhanced admin interface
- `MyBookings.tsx` - User bookings list
- `HostDashboard.tsx` - Updated host dashboard

### Contexts Directory (`/contexts/`)
React Context for state management:

- `AuthContext.tsx` - Authentication state and user info
- `I18nContext.tsx` - Internationalization (i18n) context for multi-language support

## 3. Current Styling/Theming System

### Tailwind Configuration (in index.html)

```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        'brand-brown-dark': '#4a2c2a',
        'brand-brown-medium': '#a37b73',
        'brand-brown-light': '#d5b9b2',
        'brand-sand': '#f3e9e1',
        'brand-accent-teal': '#008080',
        'brand-accent-orange': '#d95f02',
        'brand-success': '#2a9d8f',
        'brand-error': '#e76f51',
      },
      fontFamily: {
        sans: ['Urbanist', 'sans-serif'],
      }
    }
  }
}
```

### Color System
- **Primary Brown Palette**: 
  - `brand-brown-dark`: #4a2c2a (darkest brown)
  - `brand-brown-medium`: #a37b73 (medium brown)
  - `brand-brown-light`: #d5b9b2 (light brown)
- **Background**: 
  - `brand-sand`: #f3e9e1 (warm cream/sand)
- **Accent Colors**:
  - `brand-accent-teal`: #008080 (primary action)
  - `brand-accent-orange`: #d95f02 (secondary action)
- **Semantic Colors**:
  - `brand-success`: #2a9d8f (success/positive)
  - `brand-error`: #e76f51 (error/warning)

### Font System
- **Font Family**: Urbanist (from Google Fonts)
- **Font Weights Available**: 400, 500, 600, 700
- **Font Import**: Via Google Fonts CDN in index.html
- **Default**: Applied globally as `font-sans`

### Styling Patterns in Use

#### Tailwind Classes
- Responsive design: `sm:`, `md:`, `lg:`, `xl:` prefixes
- Spacing: `px-`, `py-`, `gap-`, `mt-`, `mb-`, etc.
- Colors: Brand custom colors (e.g., `text-brand-brown-dark`, `bg-brand-sand`)
- Layouts: Flexbox (`flex`, `items-center`, `justify-between`), Grid (`grid grid-cols-`)
- Effects: Shadows (`shadow-lg`, `shadow-xl`), Hover states (`hover:bg-`, `hover:text-`)
- Animations: Transitions (`transition`, `duration-300`), Transforms

#### Component-Level Inline Styles
Some components use inline `<style>` tags for animations:
- `SearchBar.tsx`: `slideDown` animation
- `HomePage.tsx`: `fadeInUp` animation

### No Global CSS
- No `global.css` file
- No `tailwind.css` import
- All styling via Tailwind utility classes and inline styles

## 4. Listing Widgets/Components

### Primary Listing Component: VehicleCard.tsx

**Location**: `/components/VehicleCard.tsx`

**Features**:
- Image carousel with navigation buttons (previous/next)
- Image count dots at bottom
- Favorite/heart button (top-right)
- Location as heading
- Vehicle title and type
- Capacity (guest count)
- Star rating with review count
- Price per night in AED currency
- Hover effects: Scale image zoom, Shadow expansion
- Responsive design with rounded corners (rounded-2xl)

**Styling**:
- Border: `border border-brand-brown-light`
- Background: `bg-white`
- Shadow: `shadow-lg` with `hover:shadow-xl`
- Image aspect: `aspect-square`
- Image container background: `bg-brand-sand`

**Layout Props**:
```typescript
interface VehicleCardProps {
  vehicle: Vehicle;
}
```

**Vehicle Data Structure**:
```typescript
interface Vehicle {
  id: string;
  hostId: string;
  title: string;
  type: VehicleType; // 'RV' | 'Camper' | 'Trailer'
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
```

### Listing Grid Display

**Location**: `/pages/HomePage.tsx`

**Grid Configuration**:
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
```

**Responsive Breakdown**:
- Mobile: 1 column
- Tablet (sm): 2 columns
- Desktop (lg): 3 columns
- Large (xl): 4 columns
- Gap: 24px (gap-6)

**Filtering Features**:
- Location-based filtering
- Vehicle type filtering
- Guest capacity filtering
- Date range filtering
- Price range filtering

### Other Widget Components

1. **SearchBar.tsx** - Search and filter interface
   - Location input with autocomplete
   - Check-in/check-out dates
   - Guest count selector
   - Vehicle type dropdown
   - Price range slider
   - Expandable advanced filters

2. **MapView.tsx** - Google Maps integration
   - Displays vehicle locations
   - Integrated with listing view

3. **BookingModal.tsx** - Booking widget
   - Date selection
   - Stripe payment integration
   - Guest details collection
   - Special requests field

## 5. Font and Color Configuration

### Font Configuration

**Primary Font**: Urbanist
- **Source**: Google Fonts CDN
- **URL**: `https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700&display=swap`
- **Weights**: 
  - 400: Regular (default text)
  - 500: Medium (slightly emphasized)
  - 600: Semibold (headings, labels)
  - 700: Bold (strong headings, accents)
- **Applied As**: Default `font-sans` class in Tailwind config
- **Fallback**: sans-serif

### Font Usage in Components

**Headers/Titles**:
- Large headings: `text-3xl font-extrabold` (e.g., brand name)
- Section titles: `text-lg font-bold` to `text-2xl font-semibold`
- Card titles: `text-base font-bold`
- Labels: `text-xs font-semibold` to `text-sm font-semibold`

**Body Text**:
- Default: `text-sm` to `text-base` with `font-medium` or regular weight
- Secondary: `text-xs` to `text-sm` with lighter colors

### Complete Color Palette

#### Brand Colors (Custom Tailwind Extensions)
```
Primary Brown Family (Warm/Earthy):
- brand-brown-dark: #4a2c2a
- brand-brown-medium: #a37b73
- brand-brown-light: #d5b9b2
- brand-sand: #f3e9e1

Accent Colors (Action/Interactive):
- brand-accent-teal: #008080
- brand-accent-orange: #d95f02

Semantic Colors (Status):
- brand-success: #2a9d8f
- brand-error: #e76f51
```

#### Standard Tailwind Colors (Also Available)
The project uses CDN-based Tailwind, so all standard colors available:
- grays, reds, blues, greens, etc.
- But brand colors are preferred for consistency

### Color Usage Patterns

**Backgrounds**:
- Page backgrounds: `bg-brand-sand`
- Card backgrounds: `bg-white`
- Header: `bg-brand-brown-medium`
- Footer: `bg-brand-brown-dark`
- Dark sections: `bg-brand-brown-dark`

**Text Colors**:
- Primary text: `text-brand-brown-dark`
- Secondary text: `text-brand-brown-medium`
- Tertiary text: `text-brand-brown-light`
- Light backgrounds: `text-brand-sand`

**Interactive Elements**:
- Primary buttons: `bg-brand-accent-teal` or `bg-brand-brown-dark`
- Secondary buttons: Border with `border-brand-accent-teal`, `text-brand-accent-teal`
- Hover states: Often use `hover:bg-white/20`, `hover:scale-105`, etc.

**Borders**:
- Default borders: `border-brand-brown-light`
- Accent borders: `border-brand-accent-teal`

### Theme Consistency

**Applied Globally**:
- Header: Brown medium background with white text
- Footer: Brown dark background with sand/light text
- Main content: Sand background with brown text
- Cards: White background with brown text and brown/light borders

**No Dark Mode**: 
- No dark theme implementation currently
- Single light theme with warm brown tones

## Additional Context

### Authentication
- Using Auth0 (`@auth0/auth0-react`)
- Firebase (`firebase`)
- Custom AuthContext for state management

### External Libraries
- **Maps**: `@react-google-maps/api`
- **Payments**: Stripe (`@stripe/react-stripe-js`, `@stripe/stripe-js`)
- **Date handling**: `date-fns`
- **Calendar**: `react-day-picker`
- **Internationalization**: Custom I18nContext (supports AR/EN)

### Build Configuration
- **Vite config**: `vite.config.ts`
- **TypeScript config**: `tsconfig.json`
- **No PostCSS config**: Tailwind loaded via CDN
- **Alias support**: `@/` points to project root

### Server Setup
- Separate server directory with Node/Express backend
- API endpoints on localhost:5001
- Environment variables via `.env.local` and `.env.example`
