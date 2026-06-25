import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Map as MapIcon, RotateCcw, List } from 'lucide-react';
import { motion, useAnimation, PanInfo, useDragControls } from 'framer-motion';
import { useI18n } from '../contexts/I18nContext';
import SearchBar, { SearchFilters } from '../components/SearchBar';
import CategoryBar from '../components/CategoryBar';
import SpotCard from '../components/SpotCard';
import MapView from '../components/MapView';
import clsx from 'clsx';

import { Category } from '../types';

export interface SpotListing {
    id: string;
    title: string;
    description: string;
    price: number;
    location: string;
    type: Category;
    images: string[];
    coordinates?: {
        lat: number;
        lng: number;
    };
    rating?: number;
    reviews?: number;
    amenities?: string[];
    hostId?: string;
}

interface HomePageProps {
    spots: SpotListing[];
}

// Haversine formula to calculate distance
const getDistKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
};

const getDrivingTime = (km: number) => {
    // Approx 60km/h average in rough terrain/mixed
    const hours = km / 60;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
};

const HomePage: React.FC<HomePageProps> = ({ spots = [] }) => {
    const { t, lang } = useI18n();
    const [searchParams, setSearchParams] = useSearchParams();

    const controls = useAnimation();
    const dragControls = useDragControls();
    const listContentRef = useRef<HTMLDivElement>(null);

    // State
    const [activeCategory, setActiveCategory] = useState<Category>(Category.ALL);
    const [searchCriteria, setSearchCriteria] = useState<SearchFilters | null>(null);
    const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);
    const [explicitSearchCenter, setExplicitSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
    const [mapPanCenter, setMapPanCenter] = useState<{ lat: number; lng: number } | null>(null);
    const [mobileListState, setMobileListState] = useState<'minimized' | 'half' | 'full'>('half');

    // Search As I Move State
    const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);
    const [filteredByBounds, setFilteredByBounds] = useState<SpotListing[] | null>(null);
    const [isBoundsFallback, setIsBoundsFallback] = useState(false);

    // User Location
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    // Reliable Desktop Check
    const useMediaQuery = (query: string) => {
        const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
        useEffect(() => {
            const media = window.matchMedia(query);
            if (media.matches !== matches) {
                setMatches(media.matches);
            }
            const listener = () => setMatches(media.matches);
            media.addEventListener('change', listener);
            return () => media.removeEventListener('change', listener);
        }, [matches, query]);
        return matches;
    };
    const isDesktop = useMediaQuery('(min-width: 1024px)');

    const isSwipingRef = useRef(false);

    // Drawer Cycle State
    const prevListState = useRef<'minimized' | 'half' | 'full'>('minimized');

    const handleDrawerClick = () => {
        if (isDesktop) return;

        setMobileListState(current => {
            if (current === 'full') {
                prevListState.current = 'full';
                return 'half';
            }
            if (current === 'minimized') {
                prevListState.current = 'minimized';
                return 'half';
            }

            // Current is half
            if (prevListState.current === 'full') {
                prevListState.current = 'half';
                return 'minimized';
            } else {
                prevListState.current = 'half';
                return 'full';
            }
        });
    };

    // Sync Animation with State
    useEffect(() => {
        const animateDrawer = async () => {
            // ... existing logic can stay or be empty as we use variants now
        };
    }, [mobileListState, controls]);

    // Geolocation
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUserLocation(loc);
                    // If no explicit search yet, center on user
                    if (!searchParams.get('lat')) {
                        setExplicitSearchCenter(loc);
                        setMapPanCenter(loc);
                    }
                },
                (error) => {
                    console.log("Geolocation error:", error);
                }
            );
        }
    }, []);

    // Update body class for mobile nav hiding
    useEffect(() => {
        if (mobileListState === 'minimized' || mobileListState === 'half') {
            document.body.classList.add('mobile-list-minimized');
        } else {
            document.body.classList.remove('mobile-list-minimized');
        }
        return () => {
            document.body.classList.remove('mobile-list-minimized');
        };
    }, [mobileListState]);

    // Handle initial URL params
    useEffect(() => {
        const cat = searchParams.get('category');
        // Check manually against enum values since we can't easily iterate enum keys in TS without values
        const validCategories = Object.values(Category);
        if (cat && validCategories.includes(cat as Category)) {
            setActiveCategory(cat as Category);
        }

        const loc = searchParams.get('location');
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        const type = searchParams.get('type');

        if (loc || (lat && lng) || type) { // Added type check
            setSearchCriteria({
                location: loc || '',
                lat: lat ? parseFloat(lat) : undefined,
                lng: lng ? parseFloat(lng) : undefined,
                type: type || undefined,
                checkIn: '',
                checkOut: '',
                guests: { adults: 1, children: 0, infants: 0 },
                priceRange: [0, 10000]
            });
            // Pan map to search location if lat/lng are present
            if (lat && lng) {
                const center = { lat: parseFloat(lat), lng: parseFloat(lng) };
                setMapPanCenter(center);
                // Slight delay to allow map to settle/mount if needed
                setTimeout(() => setExplicitSearchCenter(center), 100);
            }

            // Sync CategoryBar with Search Type
            if (type) {
                if (type === 'rv_services') {
                    setActiveCategory(Category.RV_SERVICES);
                } else {
                    const matchedCategory = validCategories.find(c => c.toLowerCase() === type.toLowerCase());
                    if (matchedCategory) {
                        setActiveCategory(matchedCategory);
                    }
                }
            }
        }
        // Start expanded on search/load
        // setMobileListState('half'); 
    }, [searchParams]);

    // Filtering Logic
    // 1. "Global" Filtered Data - Used for the MAP (shows all matches regardless of viewport)
    const mapSpots = useMemo(() => {
        let filtered = spots;

        // Filter by Category
        if (activeCategory !== Category.ALL) {
            filtered = filtered.filter(s => s.category === activeCategory);
        }

        // Filter by Search Criteria (Text or Location)
        if (searchCriteria) {
            if (searchCriteria.lat && searchCriteria.lng) {
                // Geo-search
                const exactMatches = filtered.filter(s => {
                    if (!s.coordinates) return false;
                    const dist = getDistKm(searchCriteria.lat!, searchCriteria.lng!, s.coordinates.lat, s.coordinates.lng);
                    return dist <= 20;
                });

                if (exactMatches.length > 0) {
                    filtered = exactMatches;
                } else {
                    const nearbyMatches = filtered.filter(s => {
                        if (!s.coordinates) return false;
                        const dist = getDistKm(searchCriteria.lat!, searchCriteria.lng!, s.coordinates.lat, s.coordinates.lng);
                        return dist <= 120;
                    });
                    if (nearbyMatches.length > 0) filtered = nearbyMatches;
                    else filtered = [];
                }
            } else if (searchCriteria.location) {
                // Text search
                const lowerLoc = searchCriteria.location.toLowerCase();
                filtered = filtered.filter(s =>
                    s.location.toLowerCase().includes(lowerLoc) ||
                    s.name.toLowerCase().includes(lowerLoc)
                );
            }
        }
        return filtered;
    }, [spots, activeCategory, searchCriteria]);

    // 2. "Viewport" Filtered Data - Used for the LIST (shows only what's likely visible/relevant)
    const displayedData = useMemo(() => {
        let filtered = mapSpots; // Start with the global filtered set

        // Apply Bounds Filter (Search As I Move)
        if (filteredByBounds) {
            filtered = filtered.filter(s => filteredByBounds.some(fb => fb.id === s.id));
            return { spots: filtered, isFallback: isBoundsFallback };
        }

        return { spots: filtered, isFallback: false };

    }, [mapSpots, filteredByBounds, isBoundsFallback]);

    // Map Interaction Handlers
    const handleBoundsChange = (bounds: google.maps.LatLngBounds) => {
        setMapBounds(bounds);
    };

    const handleSearchAsIMove = () => {
        if (!mapBounds) return;

        let results = spots.filter(s => {
            if (activeCategory !== Category.ALL && s.category !== activeCategory) return false;
            if (!s.coordinates) return false;
            return mapBounds.contains(new google.maps.LatLng(s.coordinates.lat, s.coordinates.lng));
        });

        // Fallback: If 0 in visible bounds, check 120km from center
        if (results.length === 0) {
            const center = mapBounds.getCenter();
            const nearby = spots.filter(s => {
                if (activeCategory !== Category.ALL && s.category !== activeCategory) return false;
                if (!s.coordinates) return false;
                return getDistKm(center.lat(), center.lng(), s.coordinates.lat, s.coordinates.lng) <= 120;
            });

            if (nearby.length > 0) {
                results = nearby;
                setIsBoundsFallback(true);
            } else {
                setIsBoundsFallback(false);
            }
        } else {
            setIsBoundsFallback(false);
        }

        // Set these spots as the explicit filtered set
        setFilteredByBounds(results);

        // NOTE: We do NOT update explicitSearchCenter here.
        // Updating it would trigger the map useEffect which pans the map back to the center,
        // fighting the user's drag. We just update the results.

        // Clear text search if any, so we strictly honor the map view
        if (searchCriteria?.location) {
            setSearchCriteria(null);
        }
    };

    // Handlers
    const handleSearch = (filters: SearchFilters) => {
        setSearchCriteria(filters);
        if (filters.lat && filters.lng) {
            const center = { lat: filters.lat, lng: filters.lng };
            setExplicitSearchCenter(center);
            setMapPanCenter(center);
        }
        // Reset mobile list to expanded when searching so user sees results
        setMobileListState('half');
    };

    const handleSpotClick = (spot: SpotListing) => {
        console.log("Spot clicked:", spot.id);
    };

    const handleMarkerClick = (spotOrId: SpotListing | string) => {
        const spotId = typeof spotOrId === 'string' ? spotOrId : spotOrId.id;
        const spot = spots.find(s => s.id === spotId);
        if (spot) {
            setHoveredSpotId(spotId);
            if (window.innerWidth < 1024) {
                // Peek list when marker clicked - set to minimized
                setMobileListState('minimized');
            }
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden pt-[132px] md:pt-32 lg:pt-24 relative">

            {/* 2026 Ambient Background - Subtle & Premium */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20 pointer-events-none overflow-hidden">
                <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] bg-brand-orange/10 rounded-full blur-[100px] animate-pulse-slow mix-blend-multiply dark:mix-blend-screen"></div>
                <div className="absolute top-[40%] -right-[10%] w-[40vw] h-[40vw] bg-emerald-400/10 rounded-full blur-[120px] animate-float delay-1000 mix-blend-multiply dark:mix-blend-screen"></div>
            </div>

            {/* Category Bar - HIDDEN ON MOBILE */}
            <div className="hidden md:block relative z-30 bg-white/80 dark:bg-stone-950/80 backdrop-blur-xl border-b border-stone-200/50 dark:border-stone-800 py-2 px-6 shadow-sm transition-all">
                <div className="max-w-7xl mx-auto">
                    <CategoryBar
                        selected={activeCategory}
                        onSelect={(cat) => activeCategory === cat ? setActiveCategory(Category.ALL) : setActiveCategory(cat)}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow flex flex-row overflow-hidden relative z-10">

                {/* Left Side (List) - Mobile Swipeable Airbnb-Style */}
                <motion.div
                    className={clsx(
                        "flex flex-col bg-white dark:bg-stone-950 transition-colors rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border-t border-white/10",
                        "fixed left-0 right-0 bottom-0 max-h-[92vh]", // Allow it to go almost top
                        "lg:static lg:w-[60%] xl:w-[55%] lg:overflow-y-auto custom-scrollbar lg:bg-white lg:dark:bg-stone-950 lg:rounded-none lg:shadow-none lg:border-none lg:!h-full lg:!transform-none lg:!max-h-full"
                    )}
                    initial={false}
                    animate={isDesktop ? 'desktop' : mobileListState}
                    variants={{
                        minimized: { y: 'calc(100% - 130px)', height: 'calc(100vh - 160px)', opacity: 1, pointerEvents: 'auto' }, // Lowered height for spot view
                        half: { y: '50%', height: 'calc(100vh - 160px)', opacity: 1, pointerEvents: 'auto' },
                        full: { y: 0, height: 'calc(100vh - 160px)', opacity: 1, pointerEvents: 'auto' },
                        desktop: { y: 0, height: '100%', opacity: 1, pointerEvents: 'auto' }
                    }}
                    // SNAPPY & CONTROLLED: Standard mass, optimized damping for speed without bounce
                    transition={{ type: 'spring', damping: 40, stiffness: 350, mass: 1 }}
                    // DRAG REMOVED - Click only interaction as per user request
                    drag={false}
                    // IMPORTANT: Add z-index to sit ABOVE the map but below navbar
                    style={{ zIndex: 40 }}
                >

                    {/* CLICK HANDLE AREA - The header triggers the state cycle */}
                    <div
                        onClick={handleDrawerClick}
                        className={clsx(
                            "drawer-handle lg:hidden sticky top-0 z-30 bg-white dark:bg-stone-950/95 backdrop-blur-md transition-all touch-none border-b border-stone-100 dark:border-stone-800",
                            "py-4 rounded-t-[2rem] cursor-pointer active:bg-stone-50 md:active:bg-transparent"
                        )}
                    >
                        <button
                            className="w-full flex flex-col items-center gap-2 pointer-events-none"
                        >
                            <div className="w-16 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full mb-1" />
                            <span className="font-bold text-sm text-stone-900 dark:text-white">
                                {displayedData.spots.length > 0 ? `${displayedData.spots.length} spots` : "No spots"}
                            </span>
                        </button>
                    </div>

                    {/* Content List */}
                    <div
                        ref={listContentRef}
                        className="flex-grow overflow-y-auto overflow-x-hidden scrollbar-none lg:custom-scrollbar px-4 pt-4 pb-32 lg:py-8 overscroll-contain"
                    >
                        <div className="max-w-5xl mx-auto mb-6 md:mb-8 pt-2">
                            <h2 className="text-xl md:text-3xl font-black text-stone-900 dark:text-white tracking-tight leading-tight">
                                {displayedData.isFallback ? (t('nearby') || 'Nearby Spots') : (t('spotsFound', { count: displayedData.spots.length }) || `${displayedData.spots.length} spots found`)}
                            </h2>
                        </div>

                        {displayedData.spots.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-4">🏜️</div>
                                <h3 className="font-bold text-stone-500">No spots found</h3>
                                <button onClick={() => { setActiveCategory(Category.ALL); setSearchCriteria(null); }} className="text-brand-orange font-bold mt-2">Clear filters</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-6">
                                {displayedData.spots.map(spot => {
                                    const refLoc = userLocation || explicitSearchCenter || (mapBounds ? { lat: mapBounds.getCenter().lat(), lng: mapBounds.getCenter().lng() } : null);
                                    return (
                                        <div key={spot.id} id={`spot-card-${spot.id}`}>
                                            <SpotCard
                                                spot={spot}
                                                onMouseEnter={() => setHoveredSpotId(spot.id)}
                                                onMouseLeave={() => setHoveredSpotId(null)}
                                                distance={refLoc && spot.coordinates
                                                    ? `${getDistKm(refLoc.lat, refLoc.lng, spot.coordinates.lat, spot.coordinates.lng).toFixed(1)} km`
                                                    : undefined}
                                                drivingTime={refLoc && spot.coordinates
                                                    ? getDrivingTime(getDistKm(refLoc.lat, refLoc.lng, spot.coordinates.lat, spot.coordinates.lng))
                                                    : undefined}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Right Side (Map) - Visble on Mobile (Background) and Desktop (Side) */}
                <div className="absolute inset-x-0 inset-y-0 lg:static lg:block lg:flex-grow lg:h-full z-0 order-first lg:order-last">
                    <MapView
                        spots={mapSpots} // <--- use globally filtered spots (fixes disappearance glitch)
                        searchCenter={explicitSearchCenter}
                        onBoundsChange={handleBoundsChange}
                        onDragEnd={handleSearchAsIMove}
                        onMarkerClick={handleMarkerClick}
                        hoveredSpotId={hoveredSpotId}
                        userLocation={userLocation || undefined}
                    />

                    {isBoundsFallback && (
                        <div className="absolute top-24 lg:top-4 left-1/2 transform -translate-x-1/2 z-10">
                            <button
                                onClick={handleSearchAsIMove}
                                className="bg-white/90 backdrop-blur-md px-6 py-2 rounded-full shadow-lg text-sm font-bold text-stone-800 border border-stone-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <RotateCcw size={14} />
                                {t('searchThisArea') || 'Search this area'}
                            </button>
                        </div>
                    )}
                </div>

            </div>

            {/* Floating Map Toggle Button (Mobile Only) - Visible ONLY when List is FULLY Expanded */}
            <div className={clsx(
                "fixed bottom-36 left-1/2 -translate-x-1/2 transition-all duration-300 transform lg:hidden z-[100]",
                mobileListState === 'full' ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-90 pointer-events-none"
            )}>
                <button
                    onClick={() => setMobileListState('half')}
                    className="bg-brand-orange text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold border border-white/20 scale-100 active:scale-95 transition-transform"
                >
                    <MapIcon size={18} />
                    <span>{t('map') || 'Map'}</span>
                </button>
            </div>

            {/* Floating List Toggle Button (Mobile Only) - Visible ONLY when List is Minimized/Half */}
            <div className={clsx(
                "fixed bottom-36 left-1/2 -translate-x-1/2 transition-all duration-300 transform lg:hidden z-[100]",
                mobileListState === 'minimized' ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-90 pointer-events-none"
            )}>
                <button
                    onClick={() => setMobileListState('full')}
                    className="bg-brand-orange text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold scale-100 active:scale-95 transition-transform animate-pulse-subtle"
                >
                    <List size={18} />
                    <span>{t('list') || 'List'}</span>
                </button>
            </div>

        </div>
    );
};

export default HomePage;
