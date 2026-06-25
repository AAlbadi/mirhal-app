import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { X, Navigation, Search, Check, MapPin } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

interface LocationPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (location: { lat: number; lng: number; address?: string }) => void;
    initialLocation?: { lat: number; lng: number };
    title?: string;
}

const libraries: ("places")[] = ["places"];

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({ isOpen, onClose, onConfirm, initialLocation, title }) => {
    const { t, lang } = useI18n();
    const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number }>(
        initialLocation || { lat: 25.2048, lng: 55.2708 }
    );
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Array<{ label: string; lat: number; lon: number }>>([]);
    const [isLoadingSuggest, setIsLoadingSuggest] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false); // Add missing state for gettingLocation
    const debounceRef = useRef<number | undefined>();

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey,
        libraries: libraries,
        preventGoogleFontsLoading: true,
    });

    useEffect(() => {
        if (initialLocation) {
            setMarkerPosition(initialLocation);
        }
    }, [initialLocation, isOpen]);

    // Reset when opening
    useEffect(() => {
        if (isOpen && map) {
            // Slight delay to ensure modal transition finished
            setTimeout(() => {
                map.setCenter(markerPosition);
                window.google.maps.event.trigger(map, "resize");
            }, 100);
        }
    }, [isOpen, map]);


    const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
        setMap(mapInstance);
    }, []);

    const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            setMarkerPosition({
                lat: e.latLng.lat(),
                lng: e.latLng.lng(),
            });
        }
    };

    const handleConfirm = () => {
        // Reverse geocoding could go here if we want address
        onConfirm({ ...markerPosition });
        onClose();
    };


    // HTML5 Geolocation - One-Tap GPS
    const getMyLocation = () => {
        setGettingLocation(true);

        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            setGettingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newPos = {
                    lat: parseFloat(position.coords.latitude.toFixed(6)),
                    lng: parseFloat(position.coords.longitude.toFixed(6)),
                };
                setMarkerPosition(newPos);
                if (map) {
                    map.panTo(newPos);
                    map.setZoom(16);
                }
                setGettingLocation(false);
            },
            (error) => {
                console.error("Location error", error);
                setGettingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Autocomplete Logic
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 3) {
            setSuggestions([]);
            return;
        }

        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(async () => {
            setIsLoadingSuggest(true);

            // Using modern Geocoding API via Backend Proxy
            try {
                const hasArabic = /[\u0600-\u06FF]/.test(searchQuery);
                const language = hasArabic ? 'ar' : (lang === 'ar' ? 'ar' : 'en');
                const baseUrl = import.meta.env.PROD ? 'https://mirhal.app' : 'http://localhost:5001';
                const response = await fetch(
                    `${baseUrl}/api/geocode?address=${encodeURIComponent(searchQuery)}&language=${language}`
                );
                const data = await response.json();

                if (data.status === 'OK' && data.results) {
                    const mapped = data.results.slice(0, 5).map((result: any) => ({
                        label: result.formatted_address,
                        lat: result.geometry.location.lat,
                        lon: result.geometry.location.lng
                    }));
                    setSuggestions(mapped);
                } else {
                    setSuggestions([]);
                }
            } catch (error) {
                console.error('Geocoding error:', error);
                setSuggestions([]);
            } finally {
                setIsLoadingSuggest(false);
            }
        }, 500);
    }, [searchQuery, lang]);

    const handleSuggestionClick = (s: { lat: number; lon: number; label: string }) => {
        const newPos = { lat: s.lat, lng: s.lon };
        setMarkerPosition(newPos);
        if (map) {
            map.panTo(newPos);
            map.setZoom(15);
        }
        setSuggestions([]);
        setSearchQuery(''); // Clear search or keep label? maybe keep label briefly but clearing is cleaner
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <h3 className="font-black text-xl text-stone-900 dark:text-white flex items-center gap-2">
                        <MapPin className="text-brand-orange" />
                        {title || t('setLocation') || 'Set Location'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Search & Map */}
                <div className="p-4 flex-1 overflow-y-auto space-y-4">
                    {/* Search Bar */}
                    <div className="relative z-20">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('searchLocationEnglishArabic') || "Search location..."}
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 border-none font-bold focus:ring-2 focus:ring-brand-orange transition-all"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                        {isLoadingSuggest && <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin">⟳</div>}

                        {/* Suggestions */}
                        {suggestions.length > 0 && (
                            <ul className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-100 dark:border-stone-700 overflow-hidden">
                                {suggestions.map((s, i) => (
                                    <li key={i} onClick={() => handleSuggestionClick(s)} className="px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-700 cursor-pointer text-sm font-bold border-b last:border-0 border-stone-100 dark:border-stone-700">
                                        📍 {s.label}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Map Container */}
                    <div className="relative rounded-2xl overflow-hidden border-4 border-brand-orange/20 shadow-inner h-[300px] md:h-[400px]">
                        {isLoaded ? (
                            <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                center={markerPosition}
                                zoom={12}
                                onLoad={onMapLoad}
                                options={{
                                    mapTypeId: 'satellite',
                                    streetViewControl: false,
                                    mapTypeControl: false,
                                    fullscreenControl: false,
                                    zoomControl: true,
                                }}
                            >
                                <Marker
                                    position={markerPosition}
                                    draggable={true}
                                    onDragEnd={onMarkerDragEnd}
                                    animation={google.maps.Animation.DROP}
                                />
                            </GoogleMap>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-stone-100 animate-pulse">
                                Loading Map...
                            </div>
                        )}

                        {/* My Location Button */}
                        <button
                            onClick={getMyLocation}
                            disabled={gettingLocation}
                            className="absolute bottom-4 right-4 bg-white dark:bg-stone-900 p-3 rounded-full shadow-lg text-brand-orange hover:scale-110 active:scale-90 transition-all z-10"
                        >
                            {gettingLocation ? <div className="w-5 h-5 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" /> : <Navigation size={20} />}
                        </button>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-center text-sm font-bold text-blue-600 dark:text-blue-300">
                        Drag the pin to adjust the exact location
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-stone-100 dark:border-stone-800 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 rounded-xl font-black text-stone-600 dark:text-stone-300 hover:bg-stone-200 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleConfirm} className="flex-1 py-3 bg-brand-orange text-white rounded-xl font-black shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                        <Check size={20} />
                        Confirm Location
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LocationPickerModal;
