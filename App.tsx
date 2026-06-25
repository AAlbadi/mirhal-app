import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getApiUrl } from './utils/api';
import { mockUsers, mockSpots } from './data/mockData';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import MobileBottomNav from './components/MobileBottomNav';
import MobileOnboarding from './components/MobileOnboarding';
import { usePushNotifications } from './hooks/usePushNotifications';
import splashBg from './src/assets/splash-bg.jpg';

import SpotDetailPage from './pages/SpotDetailPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import AdminDashboard from './pages/AdminDashboard';
import AboutPage from './pages/AboutPage';
import HelpPage from './pages/HelpPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import ContactPage from './pages/ContactPage';
import SavedSpotsPage from './pages/SavedSpotsPage';
import TripsPage from './pages/TripsPage';
import TrailsPage from './pages/TrailsPage';
import TrailDetailPage from './pages/TrailDetailPage';
import AddTrailPage from './pages/AddTrailPage';
import UserProfilePage from './pages/UserProfilePage';
import BecomeHostPage from './pages/BecomeHostPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ScreenshotStudio from './pages/ScreenshotStudio';

import { I18nProvider, useI18n } from './contexts/I18nContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import type { SpotListing } from './types';
import { Category } from './types';

const AppContent: React.FC = () => {
  const { t } = useI18n();
  const { currentUser } = useAuth();
  const [spots, setSpots] = useState<SpotListing[]>([]);

  // Initialize Push Notifications
  usePushNotifications();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch spots from API
  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const apiUrl = getApiUrl();
        console.log('Fetching spots from:', apiUrl);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30s

        // Explicitly fetch all spots (up to 1000) for the initial load
        const response = await fetch(`${apiUrl}/api/vehicles?limit=1000`, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Failed to fetch spots: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const rawSpots: any[] = data.vehicles || [];

        const transformedSpots: SpotListing[] = rawSpots.map((v) => {
          // Category mapping based on TERRAIN/LOCATION TYPE
          let category = Category.DESERT; // Default to desert for GCC
          const type = (v.type || '').toLowerCase();
          const features = (v.amenities || v.features || []).map((f: string) => f.toLowerCase());
          const emoji = v.emoji || '';

          // Prioritize Emoji First (User Selection)
          if (emoji === '🚐') category = Category.RV_SERVICES;
          else if (emoji === '🏕️' || emoji === '⛺') category = Category.PAID_CAMPING;
          else if (emoji === '🐪' || emoji === '🏜️') category = Category.DESERT;
          else if (emoji === '🏖️' || emoji === '🏄') category = Category.BEACH;
          else if (emoji === '⛰️' || emoji === '🏔️') category = Category.MOUNTAIN;
          else {
            // Fallback to Business Types if no emoji match
            // Prioritize business types first
            // Normalize type for comparison
            const normalizedType = type.toLowerCase().replace(/\s+/g, ''); // "rvservices", "paidcamping", "camping" 

            if (['rvservices', 'rvservice'].some(t => normalizedType.includes(t))) category = Category.RV_SERVICES;
            else if (['camping', 'campsite', 'campground'].some(t => normalizedType.includes(t))) category = Category.PAID_CAMPING;
            // Then prioritize terrain type from the 'type' field
            else if (type.includes('beach') || type.includes('coast') || type.includes('sea')) category = Category.BEACH;
            else if (type.includes('mountain') || type.includes('hill') || type.includes('peak')) category = Category.MOUNTAIN;
            else if (type.includes('desert') || type.includes('sand')) category = Category.DESERT;
            // Fallback to features if type doesn't indicate terrain
            else if (features.includes('beach') || features.includes('lake')) category = Category.BEACH;
            else if (features.includes('mountain')) category = Category.MOUNTAIN;
            else if (features.includes('desert')) category = Category.DESERT;
          }

          return {
            id: v._id || v.id,
            hostId: typeof v.hostId === 'object' ? v.hostId?._id : v.hostId,
            name: v.title || v.name || 'Untitled Spot',
            nameAr: v.titleAr || v.nameAr,
            approvalStatus: v.approvalStatus,
            location: v.location?.formattedAddress || v.location?.city || v.location?.address || (typeof v.location === 'string' ? v.location : 'Unknown Location'),
            locationAr: v.location?.addressAr || v.locationAr,
            city: v.location?.city,
            state: v.location?.state,
            country: v.location?.country,
            coordinates: {
              lat: Number(v.coordinates?.lat) || Number(v.location?.coordinates?.lat) || 0,
              lng: Number(v.coordinates?.lng) || Number(v.location?.coordinates?.lng) || 0,
            },
            rating: Number(v.rating?.average || v.rating) || 0,
            reviewCount: Number(v.rating?.count || v.reviewCount) || 0,
            photos: Array.isArray(v.images) ? v.images : (Array.isArray(v.photos) ? v.photos : []),
            features: Array.isArray(v.amenities) ? v.amenities : (Array.isArray(v.features) ? v.features : []),
            host: typeof v.hostId === 'object' ? {
              name: v.hostId.name,
              email: v.hostId.email,
              picture: v.hostId.picture
            } : undefined,
            contactPhone: typeof v.hostId === 'object' ? v.hostId?.hostProfile?.phone : undefined,
            price: Number(v.price) || 0,
            description: v.description || '',
            descriptionAr: v.descriptionAr,
            category: category,
            type: v.type,
            emoji: v.emoji,
          };
        });

        if (transformedSpots.length === 0) {
          console.warn('⚠️ API returned 0 spots. Falling back to MOCK DATA.');
          setSpots(mockSpots);
        } else {
          console.log('✅ Loaded spots:', transformedSpots.length);
          setSpots(transformedSpots);
        }
      } catch (error: any) {
        console.error('Error fetching spots:');
        if (error.message) console.error('Error Message:', error.message);
        if (error.status) console.error('Error Status:', error.status);
        if (error.name) console.error('Error Name:', error.name);
        try {
          console.error('Full Error:', JSON.stringify(error));
        } catch (e) {
          console.error('Error object not stringifiable');
        }

        console.warn('⚠️ Falling back to MOCK DATA due to error.');
        // Don't show error UI, just use mocks
        setSpots(mockSpots);
      } finally {
        setLoading(false);
      }
    };

    fetchSpots();

    return () => {
      // We could use a ref to store the controller if we wanted to abort externaly
      // but inside the effect we can just let it finish or use a local variable.
    };
  }, []);

  // Modern 2026 approach: Show skeleton UI instead of loading screen
  // This creates perception of instant loading
  const SkeletonSpot = () => (
    <div className="bg-white dark:bg-stone-900 rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-stone-200 dark:bg-stone-800" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-3/4" />
        <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded w-1/2" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-black min-h-screen font-sans flex flex-col transition-colors duration-500">
        <Navbar />
        <main className="flex-grow pb-32 md:pb-0">
          {/* Hero skeleton */}
          <div className="relative h-[60vh] bg-gradient-to-b from-stone-100 to-white dark:from-stone-900 dark:to-black animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="h-12 w-96 bg-stone-200 dark:bg-stone-800 rounded-xl mx-auto" />
                <div className="h-6 w-64 bg-stone-200 dark:bg-stone-800 rounded-lg mx-auto" />
              </div>
            </div>
          </div>

          {/* Spots grid skeleton */}
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => <SkeletonSpot key={i} />)}
            </div>
          </div>
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-stone-50 dark:bg-stone-900 min-h-screen font-sans flex items-center justify-center">
        <div className="text-center bg-white p-12 rounded-3xl shadow-xl border-2 border-red-300 max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-black text-stone-900 mb-2">{t('connectionError')}</h2>
          <p className="text-stone-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-brand-orange text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors"
          >
            {t('retryConnection')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-black min-h-screen font-sans flex flex-col transition-colors duration-500">
      <Navbar />
      <main className="flex-grow pb-32 md:pb-0">
        <Routes>
          <Route path="/" element={<HomePage spots={spots} />} />
          <Route path="/spot/:id" element={<SpotDetailPage spots={spots} users={mockUsers} />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route
            path="/admin/dashboard"
            element={
              currentUser?.email === 'abdulazizalbadi91@gmail.com'
                ? <AdminDashboard />
                : <Navigate to="/" replace />
            }
          />
          <Route path="/saved-spots" element={<SavedSpotsPage spots={spots} />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/trails" element={<TrailsPage />} />
          <Route path="/trails/:id" element={<TrailDetailPage />} />
          <Route path="/trails/new" element={<AddTrailPage />} />
          <Route path="/profile" element={<UserProfilePage />} />
          <Route
            path="/dashboard/host"
            element={
              currentUser?.email === 'abdulazizalbadi91@gmail.com'
                ? <AdminDashboard />
                : <Navigate to="/" replace />
            }
          />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/become-host" element={<BecomeHostPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/studio" element={<ScreenshotStudio />} />
        </Routes>
      </main>
      <MobileBottomNav />
      <MobileOnboarding />
      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <FavoritesProvider>
            <AppContent />
          </FavoritesProvider>
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  );
};

export default App;
