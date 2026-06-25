
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import clsx from 'clsx';
import SearchBar, { SearchFilters } from '../components/SearchBar';
import CategoryBar from '../components/CategoryBar';
import { useI18n } from '../contexts/I18nContext';
import SpotCard from '../components/SpotCard';
import MapView from '../components/MapView';
import { Category, SpotListing } from '../types';

interface HomePageProps {
    spots: SpotListing[];
}

const HomePage: React.FC<HomePageProps> = ({ spots }) => {
    const { t } = useI18n();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeCategory, setActiveCategory] = useState<string>(searchParams.get('category') || Category.ALL);
    const [searchCriteria, setSearchCriteria] = useState<SearchFilters | null>(null);
    const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);
    const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);
    const [explicitSearchCenter, setExplicitSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
    const [mobileListExpanded, setMobileListExpanded] = useState(false); // Default to minimized (Map View)
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Minimum swipe distance (in px) 
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientY);
    };

    const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientY);

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        // Up Swipe (Expand)
        if (distance > minSwipeDistance) {
            setMobileListExpanded(true);
        }
        // Down Swipe (Minimize)
        if (distance < -minSwipeDistance) {
            setMobileListExpanded(false);
        }
    };

    // Derived Initial Center from URL (for deep linking)
    const initialUrlCenter = useMemo(() => {
        const lat = parseFloat(searchParams.get('lat') || '');
        const lng = parseFloat(searchParams.get('lng') || '');
        if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
        return null;
    }, []); // Only once on mount

    // Sync searchParams with internal state
    useEffect(() => {
        const location = searchParams.get('location') || '';
        const checkIn = searchParams.get('checkIn') || '';
        const checkOut = searchParams.get('checkOut') || '';
        const guests = parseInt(searchParams.get('guests') || '1');
        const category = searchParams.get('category') || Category.ALL;

        setActiveCategory(category);
        setSearchCriteria({
            location,
            checkIn,
            checkOut,
            guests: { adults: guests, children: 0, infants: 0 }
        });
    }, [searchParams]);

    // Helper: Haversine Distance
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Derived State: Filtered Spots with Fallback (Never Empty)
    const { filteredSpots, isFallbackMode } = useMemo(() => {
        // 1. Strict filtering
        const strict = spots.filter(s => {
            const matchesCategory = activeCategory === Category.ALL || s.category === activeCategory;
            let matchesLocation = true;
            if (searchCriteria?.location && searchCriteria.location !== 'Anywhere') {
                matchesLocation = s.location.toLowerCase().includes(searchCriteria.location.toLowerCase()) ||
                    s.name.toLowerCase().includes(searchCriteria.location.toLowerCase());
            }
            const hasExplicitLocation = !!(searchCriteria?.location && searchCriteria.location !== 'Anywhere');
            let matchesBounds = true;

            // Only enforce bounds if we are NOT searching for a specific location
            if (!hasExplicitLocation && mapBounds && s.coordinates) {
                matchesBounds = mapBounds.contains(new google.maps.LatLng(s.coordinates.lat, s.coordinates.lng));
            }
            return matchesCategory && matchesLocation && matchesBounds;
        });

        if (strict.length > 0) return { filteredSpots: strict, isFallbackMode: false };

        // 2. Proximity Fallback (120km Radius)
        // Only trigger this if we have a specific search center (from geocoding result)
        if (explicitSearchCenter) {
            const nearby120km = spots
                .filter(s => activeCategory === Category.ALL || s.category === activeCategory)
                .map(s => ({
                    spot: s,
                    distance: calculateDistance(explicitSearchCenter.lat, explicitSearchCenter.lng, s.coordinates.lat, s.coordinates.lng)
                }))
                .filter(item => item.distance <= 120)
                .sort((a, b) => a.distance - b.distance)
                .map(item => item.spot);

            if (nearby120km.length > 0) return { filteredSpots: nearby120km, isFallbackMode: true };

            // Explicitly searched but nothing in 120km -> return empty
            return { filteredSpots: [], isFallbackMode: false };
        }

        // 3. Viewport Fallback (for map panning without specific search)
        const nearbyInView = spots.filter(s => {
            const matchesCategory = activeCategory === Category.ALL || s.category === activeCategory;
            let matchesBounds = true;
            if (mapBounds && s.coordinates) {
                matchesBounds = mapBounds.contains(new google.maps.LatLng(s.coordinates.lat, s.coordinates.lng));
            }
            return matchesCategory && matchesBounds;
        });

        // 4. Ultimate Fallback: Just show everything in the category if no specific search
        // This prevents the "flash and disappear" issue where initial bounds might be empty
        const allInCategory = spots.filter(s => activeCategory === Category.ALL || s.category === activeCategory);

        // Check if we are in "Browse Mode" (No specific location search)
        const isBrowseMode = !searchCriteria?.location || searchCriteria.location === 'Anywhere';

        if (isBrowseMode) {
            if (nearbyInView.length > 0) {
                return { filteredSpots: nearbyInView, isFallbackMode: false };
            }

            // Fallback: If map is panned to an empty area, show spots within 120km of center
            if (mapBounds) {
                const center = mapBounds.getCenter();
                const nearby120km = allInCategory.map(s => ({
                    spot: s,
                    distance: calculateDistance(center.lat(), center.lng(), s.coordinates.lat, s.coordinates.lng)
                }))
                    .filter(item => item.distance <= 120)
                    .sort((a, b) => a.distance - b.distance)
                    .map(item => item.spot);

                if (nearby120km.length > 0) {
                    return { filteredSpots: nearby120km, isFallbackMode: true };
                }
            }

            // Ultimate Fallback: If truly nothing nearby, show ALL spots (e.g. initial load or far ocean)
            return { filteredSpots: allInCategory, isFallbackMode: false };
        }

        console.log('Fallthrough return (should trigger for specific search with no hits):', nearbyInView.length);
        return { filteredSpots: nearbyInView, isFallbackMode: false };
    }, [spots, activeCategory, searchCriteria, mapBounds, explicitSearchCenter]);

    // Sync Map Movement to URL (Discovery Mode)
    const handleBoundsChange = (bounds: google.maps.LatLngBounds, zoom: number) => {
        setMapBounds(bounds);

        // Update URL with center and zoom
        const center = bounds.getCenter();
        const newParams = new URLSearchParams(searchParams);
        newParams.set('lat', center.lat().toFixed(4));
        newParams.set('lng', center.lng().toFixed(4));
        newParams.set('zoom', zoom.toString());

        setSearchParams(newParams, { replace: true });

        // Only reset explicitSearchCenter if user manually panned (not from search)
        // Check if current center is far from searchCenter
        if (explicitSearchCenter) {
            const distance = Math.sqrt(
                Math.pow(center.lat() - explicitSearchCenter.lat, 2) +
                Math.pow(center.lng() - explicitSearchCenter.lng, 2)
            );
            // Only reset if user panned more than ~5km away
            if (distance > 0.05) {
                setExplicitSearchCenter(null);
            }
        }
    };

    const urlZoom = useMemo(() => {
        const z = parseInt(searchParams.get('zoom') || '6');
        return isNaN(z) ? 6 : z;
    }, [searchParams]);

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col overflow-hidden bg-white dark:bg-stone-950 transition-colors duration-500 pt-20">
            {/* Top Navigation / Filters Area */}
            <div className="z-30 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-100 dark:border-stone-800 px-6 py-4 flex flex-col gap-4 shrink-0 relative">
                <div className="flex justify-center">
                    <SearchBar
                        onSearch={async (criteria) => {
                            console.log('HomePage: Search triggered with criteria', criteria);
                            const params = new URLSearchParams(searchParams); // Initialize with existing params
                            if (criteria.location) {
                                params.set('location', criteria.location);

                                // Use coordinates from criteria if already provided (from suggestion click)
                                if (criteria.lat && criteria.lng) {
                                    console.log('HomePage: Using coordinates from criteria', criteria.lat, criteria.lng);
                                    params.set('lat', criteria.lat.toFixed(4));
                                    params.set('lng', criteria.lng.toFixed(4));
                                    params.set('zoom', '12');
                                    setExplicitSearchCenter({ lat: criteria.lat, lng: criteria.lng });
                                } else {
                                    // Fallback: Geocode the location text
                                    console.log('HomePage: Geocoding location', criteria.location);
                                    try {
                                        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(criteria.location)}&limit=1&countrycodes=ae,sa,qa,om,kw,bh`);
                                        const data = await resp.json();
                                        console.log('HomePage: Geocoding response', data);
                                        if (data && data[0]) {
                                            const lat = parseFloat(data[0].lat);
                                            const lng = parseFloat(data[0].lon);
                                            console.log('HomePage: Setting explicitSearchCenter to', lat, lng);
                                            params.set('lat', lat.toFixed(4));
                                            params.set('lng', lng.toFixed(4));
                                            params.set('zoom', '12');
                                            setExplicitSearchCenter({ lat, lng });
                                        } else {
                                            console.warn('HomePage: No geocoding results found');
                                        }
                                    } catch (e) {
                                        console.error('Geocoding failed', e);
                                    }
                                }
                            }
                            if (criteria.type) params.set('type', criteria.type);
                            if (criteria.checkIn) params.set('checkIn', criteria.checkIn);
                            if (criteria.checkOut) params.set('checkOut', criteria.checkOut);
                            const total = criteria.guests.adults + criteria.guests.children;
                            params.set('guests', total.toString());
                            params.set('category', activeCategory);
                            console.log('HomePage: Setting search params', params.toString());
                            setSearchParams(params);
                        }}
                        variant="navbar"
                    />
                </div>
                <div className="max-w-7xl mx-auto w-full">
                    <CategoryBar
                        selected={activeCategory}
                        onSelect={(cat) => setActiveCategory(cat)}
                    />
                </div>
            </div>

            {/* Main Content: Split Layout */}
            <div className="flex-grow flex flex-row overflow-hidden relative">

                {/* Left Side: Scrollable Listing Cards (Mobile: Bottom Sheet) */}
                <div
                    className={clsx(
                        "transition-all duration-500 ease-in-out flex flex-col",
                        // Desktop Styles
                        "lg:w-[60%] xl:w-[55%] lg:bg-stone-50 lg:dark:bg-stone-950 lg:static lg:h-auto lg:shadow-none lg:rounded-none",
                        // Mobile Styles (Fixed Bottom Sheet)
                        "fixed inset-x-0 z-40 bg-stone-50 dark:bg-stone-950 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.25)] lg:shadow-none",
                        mobileListExpanded
                            ? "top-[140px] bottom-[85px] lg:top-auto lg:bottom-auto lg:h-auto" // Expanded: More map visible (lower top)
                            : "h-[280px] bottom-[85px] lg:h-auto lg:bottom-auto" // Minimized: Taller to show 1 listing
                    )}
                >
                    {/* Mobile Drag Handle (Sticky/Static) */}
                    <div
                        className="lg:hidden w-full flex-shrink-0 flex flex-col items-center justify-center pt-5 pb-2 cursor-grab active:cursor-grabbing touch-none active:opacity-70 transition-opacity rounded-t-[2.5rem] bg-stone-50 dark:bg-stone-950 z-30"
                        onClick={() => setMobileListExpanded(!mobileListExpanded)}
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        <div className="w-16 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full mb-2 shadow-sm" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 select-none">
                            {mobileListExpanded ? "Swipe down for Map" : "Swipe up for List"}
                        </span>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="flex-grow overflow-y-auto custom-scrollbar px-6 pb-8 lg:py-8">
                        <div className="max-w-5xl mx-auto">
                            <div className="flex items-center gap-3">
                                <h2 className="text-base md:text-lg font-black text-stone-900 dark:text-white uppercase tracking-widest">
                                    {isFallbackMode ? t('spotsNearby') : t('spotsFound', { count: filteredSpots.length })}
                                </h2>
                            </div>
                            {searchCriteria?.location && !isFallbackMode && (
                                <span className="text-brand-orange font-black text-sm">
                                    {t('in')} {searchCriteria.location}
                                </span>
                            )}
                        </div>

                        {/* Fallback Banner */}
                        {isFallbackMode && searchCriteria?.location && (
                            <div className="mb-8 mt-4 p-6 bg-stone-100 dark:bg-stone-900 rounded-2xl border-l-4 border-brand-orange flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                                <div className="p-2 bg-white dark:bg-stone-800 rounded-full shadow-sm shrink-0">
                                    <Search size={20} className="text-brand-orange" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-stone-900 dark:text-white text-lg mb-1">
                                        {t('noExactMatchesTitle') || `No spots found in "${searchCriteria.location}"`}
                                    </h3>
                                    <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">
                                        {t('showingNearbyMessage') || "We couldn't find any matches in that exact location, so we're showing you some highly-rated spots nearby instead."}
                                    </p>
                                </div>
                            </div>
                        )}

                        {filteredSpots.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-stone-900 rounded-[3rem] shadow-sm border border-stone-100 dark:border-stone-800">
                                <div className="text-6xl mb-6">🏕️</div>
                                <h3 className="text-2xl font-bold text-stone-500 mb-2">{t('noSpotsFoundHere')}</h3>
                                <p className="text-stone-400 mb-6">{t('adjustFilters')}</p>
                                <button
                                    onClick={() => { setActiveCategory(Category.ALL); setSearchCriteria(null); }}
                                    className="text-brand-orange font-black hover:underline px-8 py-3 rounded-2xl border-2 border-brand-orange/20 hover:bg-brand-orange/5 transition-all"
                                >
                                    {t('resetFilters')}
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                                {filteredSpots.map(spot => (
                                    <SpotCard
                                        key={spot.id}
                                        spot={spot}
                                        onMouseEnter={() => setHoveredSpotId(spot.id)}
                                        onMouseLeave={() => setHoveredSpotId(null)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Map (Mobile: Fixed Background) */}
                <div className="flex-grow relative fixed inset-0 top-[80px] lg:static lg:inset-auto lg:top-auto z-0 lg:z-auto">
                    <div className="absolute inset-0">
                        <MapView
                            spots={filteredSpots}
                            hoveredSpotId={hoveredSpotId}
                            onBoundsChange={handleBoundsChange}
                            searchCenter={explicitSearchCenter}
                        />
                    </div>

                    {/* Fallback Message Overlay */}
                    {isFallbackMode && (
                        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="bg-stone-900/90 backdrop-blur text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 border border-stone-800/50">
                                <span className="text-lg">📍</span>
                                <div>
                                    <p className="font-bold text-xs leading-none">{t('nearby') || 'Nearby'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Map Controls / Overlays */}
                    <div className="absolute top-40 lg:top-6 left-1/2 -translate-x-1/2 z-10 transition-all duration-300">
                        <button
                            onClick={() => {
                                setMapBounds(null);
                                setMobileListExpanded(false); // Minimize list to show map update
                            }}
                            className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-md text-stone-900 dark:text-white px-8 py-3 rounded-full shadow-2xl border border-stone-200/50 dark:border-stone-800/50 font-black text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 group"
                        >
                            <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse"></span>
                            {t('searchAsIMove')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
