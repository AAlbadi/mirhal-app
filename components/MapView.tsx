
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView, InfoWindow, Marker, MarkerClusterer } from '@react-google-maps/api';
import type { SpotListing } from '../types';
import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { Star, MapPin, Layers } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const libraries: ("places")[] = ["places"];

interface MapViewProps {
    spots: SpotListing[];
    onMarkerClick?: (spot: SpotListing) => void;
    onBoundsChange?: (bounds: google.maps.LatLngBounds, zoom: number) => void;
    onDragEnd?: () => void;
    searchCenter?: { lat: number; lng: number } | null;
    hoveredSpotId?: string | null;
    zoom?: number;
    userLocation?: { lat: number; lng: number } | null;
}

const mapContainerStyle = {
    width: '100%',
    height: '100%',
};

const getCategoryEmoji = (storedEmoji?: string, category?: string, spotNameAndType?: string): string => {
    // Priority 1: Use emoji from database (set from Google Sheet)
    if (storedEmoji && storedEmoji !== '🐪') return storedEmoji;

    // Priority 2: Auto-detect from name (fallback for spots not in sheet)
    const c = (category || '').toLowerCase();
    const name = (spotNameAndType || '').toLowerCase();

    // Beach detection
    if (name.includes('beach') || name.includes('coast') || name.includes('island') ||
        name.includes('sealine') || name.includes('fins') || name.includes('khiran') ||
        name.includes('ghariya') || name.includes('fuwairit') || name.includes('durrat') ||
        c.includes('beach')) {
        return '🏖️';
    }

    // Mountain detection (Jebel = mountain in Arabic)
    if (name.includes('jebel') || name.includes('mountain') || name.includes('ridge') ||
        name.includes('mutla') || name.includes('qahwan') ||
        c.includes('mountain')) {
        return '⛰️';
    }

    // Desert detection
    if (name.includes('desert') || name.includes('sakhir') || name.includes('salmi') ||
        name.includes('tree of life') || name.includes('sand') ||
        c.includes('desert')) {
        return '🐪';
    }

    // Tent/Camping
    if (name.includes('camp') || c.includes('tent')) return '⛺';
    if (c.includes('glamp')) return '✨';

    // If stored emoji is desert, trust it
    if (storedEmoji === '🐪') return '🐪';

    // Default to desert for GCC region
    return '🐪';
};

const MapView: React.FC<MapViewProps> = ({ spots, onMarkerClick, onBoundsChange, onDragEnd, searchCenter, hoveredSpotId, zoom, userLocation }) => {
    const { t, lang } = useI18n();
    const [selectedSpot, setSelectedSpot] = useState<SpotListing | null>(null);
    const [internalHoveredSpot, setInternalHoveredSpot] = useState<string | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const initialZoomRef = useRef<number>(6);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [hasFitted, setHasFitted] = useState(false);
    const [mapType, setMapType] = useState<string>('hybrid'); // Default to Hybrid (Satellite + Labels)

    const toggleMapType = () => {
        if (!map) return;
        const next = mapType === 'roadmap' ? 'hybrid' : 'roadmap';
        setMapType(next);
        map.setMapTypeId(next);
    };

    const activeHoverId = hoveredSpotId || internalHoveredSpot;


    // Calculate default center for initial load only - MUST be at top before any conditional returns
    const defaultCenter = useMemo(() => {
        if (spots.length > 0) {
            const lat = spots.reduce((sum, v) => sum + v.coordinates.lat, 0) / spots.length;
            const lng = spots.reduce((sum, v) => sum + v.coordinates.lng, 0) / spots.length;
            console.log('MapView: Calculated defaultCenter from spots', { lat, lng, spotsCount: spots.length });
            return { lat, lng };
        }
        console.log('MapView: Using Dubai fallback for defaultCenter');
        return { lat: 25.2048, lng: 55.2708 }; // Dubai fallback
    }, [spots.length]); // Recalculate when spots load

    // Update isMobile on resize
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Get API key from environment
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey,
        libraries,
        // Using 'en' statically to prevent "Loader must not be called again with different options" error
        // Map labels will still show in user's device language automatically
        language: 'en',
    });

    // Calculate center only when needed (initial load or explicit search)
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(searchCenter || undefined);
    const lastSearchCenterRef = useRef<{ lat: number; lng: number } | null>(null);
    const hasInitializedRef = useRef(false);

    useEffect(() => {
        // Only update mapCenter if searchCenter changes (search action)
        if (searchCenter && searchCenter !== lastSearchCenterRef.current) {
            console.log('MapView: searchCenter changed to', searchCenter);
            setMapCenter(searchCenter);
            // Don't update lastSearchCenterRef here - let the pan effect do it
        } else if (!hasInitializedRef.current && spots.length > 0 && !searchCenter) {
            // Initial load: center on spots
            const lat = spots.reduce((sum, v) => sum + v.coordinates.lat, 0) / spots.length;
            const lng = spots.reduce((sum, v) => sum + v.coordinates.lng, 0) / spots.length;
            setMapCenter({ lat, lng });
            hasInitializedRef.current = true;
        } else if (!hasInitializedRef.current && !searchCenter) {
            // Fallback to GCC/Dubai center only on initial load
            setMapCenter({ lat: 25.2048, lng: 55.2708 });
            hasInitializedRef.current = true;
        }
        // Don't recalculate center after user has interacted
    }, [searchCenter, spots]);

    // Pan map when searchCenter changes
    useEffect(() => {
        console.log('MapView: Pan effect triggered', { map: !!map, searchCenter, lastSearchCenter: lastSearchCenterRef.current });
        if (map && searchCenter && searchCenter !== lastSearchCenterRef.current) {
            console.log('MapView: Panning to searchCenter', searchCenter);

            // If we have spots, fit bounds to include them + search center
            if (spots.length > 0) {
                const bounds = new window.google.maps.LatLngBounds();
                bounds.extend(searchCenter);
                spots.forEach(spot => {
                    if (spot.coordinates) {
                        bounds.extend(new window.google.maps.LatLng(spot.coordinates.lat, spot.coordinates.lng));
                    }
                });
                // Smooth pan instead of snap
                map.panTo(bounds.getCenter());
                // Short delay for fitBounds to allow pan to finish visually
                setTimeout(() => map.fitBounds(bounds), 300);

            } else {
                map.panTo(searchCenter);
                setTimeout(() => {
                    if (map && map.getZoom()! < 9) map.setZoom(9);
                }, 300);
            }

            lastSearchCenterRef.current = searchCenter;
        }
    }, [map, searchCenter]);

    // Handle map idle (after zoom/pan)
    const handleMapIdle = useCallback(() => {
        if (map) {
            const center = map.getCenter();
            if (center) {
                // Sync state with actual map position to prevent snap-back on re-renders
                setLocalMapCenter({ lat: center.lat(), lng: center.lng() });
            }

            if (onBoundsChange) {
                const bounds = map.getBounds();
                const currentZoom = map.getZoom();
                if (bounds && currentZoom !== undefined) {
                    onBoundsChange(bounds, currentZoom);
                }
            }
        }
    }, [map, onBoundsChange]);

    const onLoad = useCallback((mapInstance: google.maps.Map) => {
        console.log('MapView: Map loaded');
        setMap(mapInstance);
    }, []);

    // Initialize map center state - start with Dubai fallback immediately
    const [localMapCenter, setLocalMapCenter] = useState<{ lat: number; lng: number }>({ lat: 25.2048, lng: 55.2708 });
    const hasSetInitialSpotCenter = useRef(false);

    // Update center when spots load (only once)
    useEffect(() => {
        if (!hasSetInitialSpotCenter.current && spots.length > 0) {
            const lat = spots.reduce((sum, v) => sum + v.coordinates.lat, 0) / spots.length;
            const lng = spots.reduce((sum, v) => sum + v.coordinates.lng, 0) / spots.length;
            console.log('MapView: Setting initial center from spots', { lat, lng });
            setLocalMapCenter({ lat, lng });
            hasSetInitialSpotCenter.current = true;
        }
    }, [spots]);

    // Handle explicit search pan


    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    if (loadError) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 p-4 text-center">
                <div className="text-red-500 mb-2">⚠️ Map Load Error</div>
                <p className="text-sm text-stone-600 font-mono bg-stone-100 p-2 rounded">{loadError.message}</p>
                {!apiKey && <p className="text-xs text-red-600 mt-2 font-bold">MISSING GOOGLE MAPS API KEY IN .ENV</p>}
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-stone-100">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-stone-300 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-stone-300 rounded"></div>
                </div>
            </div>
        );
    } // Restore closing brace for if(!isLoaded)

    return (
        <div className="relative w-full h-full">
            <GoogleMap
                key={mapType}
                mapContainerStyle={mapContainerStyle}
                center={localMapCenter} // Use state passed to center prop
                zoom={zoom || 6}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onIdle={handleMapIdle}
                mapTypeId={mapType}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={() => {
                    setIsDragging(false);
                    if (onDragEnd) onDragEnd();
                }}
                options={{
                    mapTypeId: mapType, // Force it in options too
                    streetViewControl: false,
                    mapTypeControl: false, // Disable default control
                    fullscreenControl: false,
                    zoomControl: false, // Cleaner look on mobile
                    gestureHandling: 'greedy',
                    disableDefaultUI: false,
                    clickableIcons: false,
                    scrollwheel: true,
                    mapTypeControlOptions: {
                        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                        position: google.maps.ControlPosition.TOP_LEFT,
                        mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
                    },
                    styles: [
                        {
                            featureType: 'poi',
                            stylers: [{ visibility: 'off' }]
                        },
                        {
                            featureType: 'transit',
                            stylers: [{ visibility: 'off' }]
                        },
                        {
                            featureType: 'water',
                            elementType: 'geometry',
                            stylers: [{ color: '#c9e8ff' }]
                        },
                        {
                            featureType: 'landscape',
                            stylers: [{ color: '#f7f6f1' }]
                        }
                    ]
                }}
            >
                {/* User Location Marker - Modern Pulsing Dot */}
                {userLocation && (
                    <OverlayView position={userLocation} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                        <div className="relative flex items-center justify-center w-8 h-8 -translate-x-1/2 -translate-y-1/2 transform">
                            <div className="absolute inset-0 bg-brand-orange/30 rounded-full animate-ping opacity-75" />
                            <div className="absolute inset-0 bg-brand-orange/20 rounded-full shadow-[0_0_15px_rgba(244,117,33,0.5)]" />
                            <div className="absolute inset-1.5 bg-white rounded-full shadow-md z-10" />
                            <div className="absolute inset-2.5 bg-brand-orange rounded-full z-20" />
                        </div>
                    </OverlayView>
                )}

                {/* NATIVE APP & WEB: Use Clustering for Performance */}
                <MarkerClusterer
                    options={{
                        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
                        // Optional: Custom cluster styling could go here
                    }}
                >
                    {(clusterer) => (
                        <>
                            {spots
                                .filter(spot => spot.coordinates.lat !== 0 || spot.coordinates.lng !== 0)
                                .map((spot) => (
                                    <Marker
                                        key={spot.id}
                                        position={spot.coordinates}
                                        clusterer={clusterer}
                                        onClick={() => {
                                            setSelectedSpot(spot);
                                            if (onMarkerClick) onMarkerClick(spot);
                                        }}
                                        icon={{
                                            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                                                    <defs>
                                                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                                                            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.15)"/>
                                                        </filter>
                                                    </defs>
                                                    <circle cx="20" cy="20" r="14" fill="rgba(255,255,255,0.95)" stroke="${activeHoverId === spot.id ? '#F47521' : 'rgba(255,255,255,0.5)'}" stroke-width="${activeHoverId === spot.id ? '2' : '1'}" filter="url(#shadow)" />
                                                </svg>
                                            `)}`,
                                            scaledSize: new window.google.maps.Size(40, 40),
                                            labelOrigin: new window.google.maps.Point(20, 20)
                                        }}
                                        label={{
                                            text: getCategoryEmoji((spot as any).emoji, (spot as any).category, spot.name + ' ' + (spot.type || '')),
                                            fontSize: '16px',
                                            className: 'marker-emoji-label'
                                        }}
                                        zIndex={activeHoverId === spot.id ? 1000 : 1}
                                    />
                                ))
                            }
                        </>
                    )}
                </MarkerClusterer>

                {selectedSpot && (
                    <OverlayView
                        position={selectedSpot.coordinates}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    >
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 min-w-[280px] z-[60]">
                            <div className="relative group perspective-1000">
                                {/* Close Button Bubble */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedSpot(null);
                                    }}
                                    className="absolute -top-3 -right-3 z-20 bg-white dark:bg-stone-800 text-stone-500 hover:text-red-500 rounded-full p-1.5 shadow-lg border border-stone-100 dark:border-stone-700 transition-all active:scale-95"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>

                                <Link to={`/spot/${selectedSpot.id}`} className="block">
                                    <div className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border border-white/20 dark:border-stone-700 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_30px_60px_rgba(249,115,22,0.15)] w-full">

                                        {/* Image Section */}
                                        <div className="h-40 w-full relative">
                                            <img
                                                src={selectedSpot.photos[0]}
                                                alt={selectedSpot.name}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />

                                            {/* Floating Badge */}
                                            <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10 uppercase tracking-wider flex items-center gap-1">
                                                <span>{getCategoryEmoji((selectedSpot as any).emoji, (selectedSpot as any).category, selectedSpot.name)}</span>
                                                <span>{(selectedSpot as any).category || 'Spot'}</span>
                                            </div>

                                            {/* Rating Pill */}
                                            <div className="absolute top-3 right-3 bg-brand-orange text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                                                <Star size={10} fill="currentColor" />
                                                <span>{selectedSpot.rating || 'New'}</span>
                                            </div>

                                            {/* Bottom Text Overlay */}
                                            <div className="absolute bottom-3 left-4 right-4">
                                                <h3 className="text-white font-black text-lg leading-tight drop-shadow-md truncate">{selectedSpot.name}</h3>
                                                <p className="text-stone-300 text-xs font-medium truncate flex items-center gap-1 mt-0.5">
                                                    <MapPin size={10} />
                                                    {selectedSpot.location}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action Footer */}
                                        <div className="p-3 bg-gradient-to-b from-white to-stone-50 dark:from-stone-900 dark:to-stone-950 flex items-center justify-between gap-3">
                                            <div className="flex items-center -space-x-2 pl-1">
                                                {/* Dummy avatars purely for visual hype */}
                                                <div className="w-6 h-6 rounded-full border-2 border-white dark:border-stone-900 bg-stone-200"></div>
                                                <div className="w-6 h-6 rounded-full border-2 border-white dark:border-stone-900 bg-brand-orange/20 flex items-center justify-center text-[8px] font-bold text-brand-orange">+12</div>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs font-black text-brand-orange group-hover:translate-x-1 transition-transform">
                                                {t('viewDetails') || 'View Details'}
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                </Link>

                                {/* Pointer Triangle */}
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-stone-50 dark:bg-stone-950 transform rotate-45 border-r border-b border-stone-100 dark:border-stone-800 shadow-sm z-10"></div>
                            </div>
                        </div>
                    </OverlayView>
                )}
            </GoogleMap>

            {/* Custom Map Controls - MOVED OUTSIDE GOOGLE MAP COMPONENT FOR RELIABLE CLICKS */}
            <div className="absolute top-32 right-4 z-[500] flex flex-col gap-2 pointer-events-auto">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (userLocation && map) {
                            map.panTo(userLocation);
                            map.setZoom(14);
                        } else if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition((pos) => {
                                const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                                if (map) {
                                    map.panTo(newLoc);
                                    map.setZoom(14);
                                }
                            }, (err) => console.error(err));
                        }
                    }}
                    className="w-10 h-10 bg-white dark:bg-stone-900 rounded-full shadow-xl flex items-center justify-center text-stone-700 dark:text-stone-200 hover:scale-110 active:scale-95 transition-all border border-stone-100 dark:border-stone-800"
                    title="My Location"
                >
                    <MapPin size={20} />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleMapType();
                    }}
                    className="w-10 h-10 bg-white dark:bg-stone-900 rounded-full shadow-xl flex items-center justify-center text-stone-700 dark:text-stone-200 hover:scale-110 active:scale-95 transition-all border border-stone-100 dark:border-stone-800"
                    title="Toggle Satellite View"
                >
                    <Layers size={20} />
                </button>
            </div>
        </div>
    );
};

export default MapView;
