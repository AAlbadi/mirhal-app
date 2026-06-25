import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Users, X, ChevronRight, ChevronLeft, Loader2, Minus, Plus, Locate } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import DateRangeCalendar from './DateRangeCalendar';

import clsx from 'clsx';


import { createPortal } from 'react-dom';
import { useJsApiLoader } from '@react-google-maps/api';

const libraries: ("places")[] = ["places"];

export interface SearchFilters {
  location: string;
  lat?: number;
  lng?: number;
  type?: string;
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
    infants: number;
  };
}

interface SearchBarProps {
  initialFilters?: Partial<SearchFilters>;
  onSearch?: (filters: SearchFilters) => void;
  variant?: 'floating' | 'navbar';
  isFlat?: boolean; // New prop for unified header
}

const SearchBar: React.FC<SearchBarProps> = ({ initialFilters, onSearch, variant = 'floating', isFlat = false }) => {
  const { t, dir, lang } = useI18n();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeStep, setActiveStep] = useState<'location' | 'type' | null>(null);

  const [filters, setFilters] = useState<SearchFilters>({
    location: initialFilters?.location || '',
    type: initialFilters?.type || '',
    // checkIn/checkOut/guests removed as per user request
    checkIn: '',
    checkOut: '',
    guests: { adults: 1, children: 0, infants: 0 },
  });

  const [suggestions, setSuggestions] = useState<Array<{ label: string; lat: number; lon: number }>>([]);
  const [isLoadingSuggest, setIsLoadingSuggest] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | undefined>();

  const searchInputRef = useRef<HTMLInputElement>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const popularDestinations = [
    { label: lang === 'ar' ? 'دبي، الإمارات' : 'Dubai, UAE', lat: 25.2048, lon: 55.2708 },
    { label: lang === 'ar' ? 'الرياض، السعودية' : 'Riyadh, KSA', lat: 24.7136, lon: 46.6753 },
    { label: lang === 'ar' ? 'الدوحة، قطر' : 'Doha, Qatar', lat: 25.2854, lon: 51.5310 },
    { label: lang === 'ar' ? 'مسقط، عمان' : 'Muscat, Oman', lat: 23.5880, lon: 58.3829 },
    { label: lang === 'ar' ? 'أبو ظبي، الإمارات' : 'Abu Dhabi, UAE', lat: 24.4539, lon: 54.3773 },
    { label: lang === 'ar' ? 'العلا، السعودية' : 'Al Ula, KSA', lat: 26.6190, lon: 37.9300 },
  ];

  const spotTypes = [
    { id: '', label: t('catAll'), icon: '🗺️' },
    { id: 'desert', label: t('catDesert'), icon: '🐪' },
    { id: 'beach', label: t('catBeach'), icon: '🏖️' },
    { id: 'mountain', label: t('catMountain'), icon: '⛰️' },
    { id: 'PaidCamping', label: t('catPaidCamping'), icon: '🏕️' },
    { id: 'rv_services', label: t('catServices'), icon: '🚐' },
  ];

  const handleUseMyLocation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!navigator.geolocation) return;

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFilters(prev => ({
          ...prev,
          lat: latitude,
          lng: longitude,
          location: t('useMyLocation')
        }));
        setIsLoadingLocation(false);
        setActiveStep('type');
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsLoadingLocation(false);
      }
    );
  };

  // Handle click outside to collapse
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is inside search pill (searchBarRef) or expanded portal (expandedRef)
      const clickedInsidePill = searchBarRef.current && searchBarRef.current.contains(target);
      const clickedInsidePortal = expandedRef.current && expandedRef.current.contains(target);

      if (!clickedInsidePill && !clickedInsidePortal) {
        setIsExpanded(false);
        setActiveStep(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // GCC Region Bounds for location bias
  const GCC_BOUNDS = {
    north: 32.5,  // Northern Saudi Arabia
    south: 16.0,  // Southern Oman
    east: 60.0,   // Eastern Oman
    west: 34.5    // Western Saudi Arabia
  };

  // Get user's current location for proximity bias
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Fallback to Dubai center if geolocation fails
          setUserLocation({ lat: 25.2048, lng: 55.2708 });
        }
      );
    }
  }, []);

  // Smart Location Autocomplete with Google Places
  useEffect(() => {
    if (!filters.location || filters.location.length < 2 || activeStep !== 'location' || !isLoaded) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        setIsLoadingSuggest(true);

        if (!filters.location || filters.location.length < 3) {
          setSuggestions([]);
          setIsLoadingSuggest(false);
          return;
        }

        // Use Client-Side AutocompleteService (Better for Mobile/Web consistency)
        if (window.google && window.google.maps && window.google.maps.places) {
          const service = new window.google.maps.places.AutocompleteService();
          const geocoder = new window.google.maps.Geocoder();

          // Bias towards GCC but don't strictly restrict
          const request: google.maps.places.AutocompletionRequest = {
            input: filters.location,
            // sessionToken: ... (optional)
            // locationRestriction: {
            //    north: 32.5, south: 16.0, east: 60.0, west: 34.5
            // } as google.maps.LatLngBoundsLiteral
          };

          service.getPlacePredictions(request, (predictions, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
              // We need lat/lng, but Autocomplete only returns place_id.
              // For the dropdown, we usually just need the label.
              // BUT current logic expects lat/lon for the click handler.
              // So we must geocode the first few results or just show labels and geocode on click.
              // Current UI expects { label, lat, lon }.

              // Strategy: Just show predictions. Geocode ON CLICK.
              // But to keep compatible strictly with current UI which might expect lat/lon immediately:
              // Let's actually use Geocoder for suggestions if we need coords properly, 
              // OR rework the UI to geocode on click.
              // The currrent UI maps results to { label, lat, lon }.

              // Simpler fallback: Use Geocoder directly for "Search" behavior which returns coords.
              geocoder.geocode({ address: filters.location }, (results, status) => {
                if (status === 'OK' && results) {
                  const mapped = results.slice(0, 5).map(r => ({
                    label: r.formatted_address,
                    lat: r.geometry.location.lat(),
                    lon: r.geometry.location.lng()
                  }));
                  setSuggestions(mapped);
                } else {
                  setSuggestions([]);
                }
                setIsLoadingSuggest(false);
              });
            } else {
              // Fallback to basic geocode if autocomplete fails or returns nothing
              geocoder.geocode({ address: filters.location }, (results, status) => {
                if (status === 'OK' && results) {
                  const mapped = results.slice(0, 5).map(r => ({
                    label: r.formatted_address,
                    lat: r.geometry.location.lat(),
                    lon: r.geometry.location.lng()
                  }));
                  setSuggestions(mapped);
                } else {
                  setSuggestions([]);
                }
                setIsLoadingSuggest(false);
              });
            }
          });
        }
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
        setIsLoadingSuggest(false);
      }
    }, 300);
  }, [filters.location, activeStep, lang, isLoaded, userLocation]);

  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!filters.location) return;

    setIsSearching(true);
    try {
      // If coordinates not already set, try to use the first suggestion even if loose match
      // The user hit search on this text, so they likely mean the top result (e.g. "Kuwait")
      let searchFilters = { ...filters };

      console.log('Search initiated:', { location: filters.location, hasCoords: !!(searchFilters.lat && searchFilters.lng), suggestionsCount: suggestions.length });

      if (!searchFilters.lat || !searchFilters.lng) {
        if (suggestions.length > 0) {
          // Trust the auto-complete if available
          console.log('Using suggestion:', suggestions[0]);
          searchFilters.lat = suggestions[0].lat;
          searchFilters.lng = suggestions[0].lon;
        } else if (searchFilters.location) {
          // Fallback: Use Client-Side Geocoding (More reliable than backend proxy for Referrer keys)
          console.log('No suggestions, geocoding via Client SDK:', searchFilters.location);
          try {
            // Ensure google is available
            if (window.google && window.google.maps) {
              const geocoder = new window.google.maps.Geocoder();
              const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
                geocoder.geocode({ address: searchFilters.location }, (results, status) => {
                  if (status === 'OK' && results) {
                    resolve(results);
                  } else {
                    reject(status);
                  }
                });
              });

              if (result[0]) {
                searchFilters.lat = result[0].geometry.location.lat();
                searchFilters.lng = result[0].geometry.location.lng();
                console.log('Client Geocoded to:', { lat: searchFilters.lat, lng: searchFilters.lng });

                // Update location name to match formal address
                // searchFilters.location = result[0].formatted_address; 
              }
            }
          } catch (e) {
            console.error("Client Geocoding failed", e);

            // EMERGENCY FALLBACK: Hardcoded coordinates for major GCC cities
            // This ensures the app works for main locations even if the API Key is restricted
            const lowerLoc = searchFilters.location.toLowerCase();
            const fallbacks: Record<string, { lat: number, lng: number }> = {
              'dubai': { lat: 25.2048, lng: 55.2708 },
              'دبي': { lat: 25.2048, lng: 55.2708 },
              'abudhabi': { lat: 24.4539, lng: 54.3773 },
              'abu dhabi': { lat: 24.4539, lng: 54.3773 },
              'أبوظبي': { lat: 24.4539, lng: 54.3773 },
              'أبو ظبي': { lat: 24.4539, lng: 54.3773 },
              'riyadh': { lat: 24.7136, lng: 46.6753 },
              'الرياض': { lat: 24.7136, lng: 46.6753 },
              'jeddah': { lat: 21.5433, lng: 39.1728 },
              'جدة': { lat: 21.5433, lng: 39.1728 },
              'doha': { lat: 25.2854, lng: 51.5310 },
              'الدوحة': { lat: 25.2854, lng: 51.5310 },
              'manama': { lat: 26.2285, lng: 50.5860 },
              'المنامة': { lat: 26.2285, lng: 50.5860 },
              'kuwait': { lat: 29.3759, lng: 47.9774 },
              'الكويت': { lat: 29.3759, lng: 47.9774 },
              'muscat': { lat: 23.5880, lng: 58.3829 },
              'مسقط': { lat: 23.5880, lng: 58.3829 },
              'salalah': { lat: 17.0151, lng: 54.0924 },
              'صلالة': { lat: 17.0151, lng: 54.0924 },
              'al ula': { lat: 26.6190, lng: 37.9300 },
              'العلا': { lat: 26.6190, lng: 37.9300 }
            };

            for (const [key, coords] of Object.entries(fallbacks)) {
              if (lowerLoc.includes(key)) {
                searchFilters.lat = coords.lat;
                searchFilters.lng = coords.lng;
                console.log('✅ Used Fallback Coordinates for:', key);
                break;
              }
            }
          }
        }
      }

      console.log('Final search filters:', searchFilters);

      if (onSearch) {
        await onSearch(searchFilters);
      } else {
        const queryParams = new URLSearchParams();
        if (searchFilters.location) queryParams.set('location', searchFilters.location);
        if (searchFilters.type) queryParams.set('type', searchFilters.type);
        if (searchFilters.lat) queryParams.set('lat', searchFilters.lat.toString());
        if (searchFilters.lng) queryParams.set('lng', searchFilters.lng.toString());
        navigate(`/?${queryParams.toString()}`);
      }

      setIsExpanded(false);
      setActiveStep(null);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStepClick = (step: 'location' | 'type') => {
    setIsExpanded(true);
    setActiveStep(step);
  };

  return (
    <div
      ref={searchBarRef}
      className={clsx(
        "transition-all duration-500 ease-in-out font-outfit",
        isExpanded ? "relative z-[110]" : "relative mx-auto w-full max-w-md z-[100]"
      )}
      dir={dir}
    >
      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[999] animate-in fade-in duration-500"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Collapsed Pill - Premium Glass Look */}
      {!isExpanded && (
        <div
          onClick={() => {
            setIsExpanded(true);
            setActiveStep('location');
          }}
          className={clsx(
            "group flex items-center transition-all duration-300 cursor-pointer",
            isFlat
              ? "bg-stone-50/50 dark:bg-stone-800/30 border border-stone-100 dark:border-stone-800/50 rounded-xl w-full h-[36px] shadow-none p-0.5"
              : "bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border border-stone-200/50 dark:border-stone-800/50 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-1 h-[42px]"
          )}
        >
          <div className={clsx("flex-1 flex items-center overflow-hidden", isFlat ? "px-2.5" : "px-4")}>
            <div className="flex flex-col min-w-0 leading-none justify-center">
              <span className={clsx(
                "font-black text-stone-900 dark:text-white truncate tracking-tight",
                isFlat ? "text-[11px]" : "text-[12px]"
              )}>
                {filters.location || t('exploreGCCSpots')}
              </span>
              <div className={clsx(
                "flex items-center gap-1.5 text-stone-400 font-bold uppercase tracking-[0.05em] mt-0.5",
                isFlat ? "text-[8px]" : "text-[10px]"
              )}>
                <span>{filters.type || t('anyType') || 'Any Type'}</span>
              </div>
            </div>
          </div>
          <div className={clsx(
            "bg-brand-orange text-white rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-brand-orange/20 md:group-hover:scale-105 transition-all duration-300",
            isFlat ? "w-7 h-7" : "w-[34px] h-[34px]"
          )}>
            <Search size={isFlat ? 12 : 16} strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Expanded Flow - Portaled to Body to avoid Stacking Context Clipping */}
      {isExpanded && createPortal(
        <div ref={expandedRef} className="relative z-[9999] font-outfit" dir={dir}>
          {/* Mobile Layout - Airbnb Style Card Stack (Refined & Fixed) */}
          <div className="md:hidden fixed inset-0 z-[9999] bg-stone-100 dark:bg-stone-950 flex flex-col font-sans animate-in slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between shrink-0 bg-transparent relative z-10">
              <button
                onClick={() => { setIsExpanded(false); setActiveStep(null); }}
                className="p-4 -mr-4 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
                aria-label="Close search"
              >
                <X size={20} strokeWidth={2.5} className="text-stone-900 dark:text-white" />
              </button>
              <div className="flex gap-6 font-semibold text-stone-600 dark:text-stone-400 text-sm">
                <button className="text-stone-900 dark:text-white border-b-2 border-stone-900 dark:border-white pb-1">
                  {t('stays')}
                </button>
                {/* Placeholder for Experiences if needed later */}
              </div>
              <div className="w-8" /> {/* Spacer for centering */}
            </div>

            {/* Scrollable Content (Cards) */}
            <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-4">

              {/* WHERE Card */}
              <div className={clsx(
                "bg-white dark:bg-stone-900 rounded-3xl overflow-hidden shadow-sm transition-all duration-300",
                activeStep === 'location' ? "p-6 shadow-xl ring-1 ring-stone-900/5" : "p-4 cursor-pointer hover:bg-white/80"
              )} onClick={() => setActiveStep('location')}>
                {(activeStep !== 'location') ? (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-stone-500">{t('where')}</span>
                    <span className="text-sm font-bold text-stone-900 dark:text-white truncate max-w-[200px]">{filters.location || t('searchDestinations')}</span>
                  </div>
                ) : (
                  <div className="animate-in fade-in duration-300">
                    <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-4">{t('where')}</h2>
                    <div className="relative mb-6">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-900 dark:text-stone-400" size={20} strokeWidth={2.5} />
                      <input
                        autoFocus
                        type="text"
                        placeholder={t('searchDestinations')}
                        value={filters.location}
                        onChange={(e) => setFilters({ ...filters, location: e.target.value, lat: undefined, lng: undefined })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && filters.location) {
                            handleSearch();
                          }
                        }}
                        className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 py-5 pl-12 pr-4 rounded-xl font-bold text-stone-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition-all shadow-sm"
                      />
                    </div>
                    {/* Suggestions Area */}
                    <div className="space-y-4">

                      <div className="flex overflow-x-auto gap-3 pb-2 -mx-2 px-2 no-scrollbar">
                        {['Nearby', 'Dubai', 'Abu Dhabi', 'Oman'].map(region => (
                          <button
                            key={region}
                            onClick={(e) => { e.stopPropagation(); setFilters({ ...filters, location: region }); }}
                            className="shrink-0 px-6 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full text-sm font-bold shadow-sm whitespace-nowrap text-stone-900 dark:text-white"
                          >
                            {region}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-1">
                        {/* Use My Location Button */}
                        <div
                          onClick={handleUseMyLocation}
                          className="flex items-center gap-4 py-5 border-b border-stone-100 dark:border-stone-800 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors rounded-lg px-2 -mx-2"
                        >
                          <div className="bg-brand-orange/10 p-2 rounded-lg">
                            {isLoadingLocation ? (
                              <Loader2 size={18} className="text-brand-orange animate-spin" />
                            ) : (
                              <Locate size={18} className="text-brand-orange" />
                            )}
                          </div>
                          <span className="font-bold text-brand-orange">
                            {isLoadingLocation ? t('gettingLocation') : t('useMyLocation')}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 mt-4">{t('popularDestinations')}</p>
                        {(suggestions.length > 0 ? suggestions : popularDestinations).slice(0, 5).map((s, idx) => (
                          <div
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setFilters({ ...filters, location: s.label, lat: s.lat, lng: s.lon });
                              setTimeout(() => setActiveStep('type'), 200);
                            }}
                            className="flex items-center gap-4 py-5 border-b border-stone-100 dark:border-stone-800 last:border-0 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors rounded-lg px-2 -mx-2"
                          >
                            <div className="bg-stone-100 dark:bg-stone-800 p-2 rounded-lg">
                              <MapPin size={18} className="text-stone-700 dark:text-stone-300" />
                            </div>
                            <span className="font-semibold text-stone-800 dark:text-stone-200">{s.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* TYPE Card */}
              <div className={clsx(
                "bg-white dark:bg-stone-900 rounded-3xl overflow-hidden shadow-sm transition-all duration-300",
                activeStep === 'type' ? "p-6 shadow-xl ring-1 ring-stone-900/5" : "p-4 cursor-pointer hover:bg-white/80"
              )} onClick={() => setActiveStep('type')}>
                {(activeStep !== 'type') ? (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-stone-500">{t('spotType') || 'Type'}</span>
                    <span className="text-sm font-bold text-stone-900 dark:text-white capitalize">{filters.type || t('anyType') || 'Any'}</span>
                  </div>
                ) : (
                  <div className="animate-in fade-in duration-300">
                    <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-6">{t('chooseSpotType') || 'Choose a Vibe'}</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {spotTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilters({ ...filters, type: type.id });
                          }}
                          className={clsx(
                            "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all",
                            filters.type === type.id
                              ? "border-stone-900 bg-stone-900 text-white dark:border-white dark:bg-white dark:text-stone-900"
                              : "border-stone-100 bg-stone-50 text-stone-600 hover:border-stone-300 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300"
                          )}
                        >
                          <span className="text-2xl">{type.icon}</span>
                          <span className="font-bold text-sm tracking-wide">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Footer Bar - FIXED at bottom - SAFE AREA */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 p-4 px-6 flex items-center justify-between pb-safe z-[999999]">
              <button
                onClick={() => {
                  setFilters({ location: '', type: '', checkIn: '', checkOut: '', guests: { adults: 1, children: 0, infants: 0 } });
                }}
                className="font-bold text-stone-900 dark:text-white underline text-sm p-4 -ml-4 rounded-lg active:bg-stone-100 dark:active:bg-stone-800 transition-colors"
              >
                {t('clearAll')}
              </button>

              <button
                onClick={handleSearch}
                className="flex items-center gap-2 bg-gradient-to-r from-stone-900 to-stone-800 dark:from-white dark:to-stone-200 text-white dark:text-stone-900 px-10 py-4 h-14 rounded-2xl font-bold text-base shadow-xl active:scale-95 transition-all touch-manipulation"
              >
                <Search size={18} strokeWidth={3} />
                {activeStep === 'type' ? (t('search') || 'Search') : (t('next') || 'Next')}
              </button>
            </div>
          </div>

          {/* Desktop Layout - Updated Floating Pill (No Dates/Guests) */}
          {/* Backdrop for desktop */}
          <div
            className="hidden md:block fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[999]"
            onClick={() => setIsExpanded(false)}
          />

          <div className="hidden md:block fixed top-0 left-1/2 -translate-x-1/2 w-[95vw] max-w-[600px] z-[1000] animate-in fade-in slide-in-from-top-6 duration-500 pt-10">
            <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-3xl rounded-[2.5rem] p-3 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-white/20 dark:border-white/5">
              <div className="flex flex-col md:flex-row items-center bg-stone-50 dark:bg-stone-950/40 rounded-[2rem] overflow-hidden relative">

                {/* Location Step */}
                <div
                  onClick={() => setActiveStep('location')}
                  className={clsx(
                    "flex-[1.4] w-auto px-8 py-5 cursor-pointer transition-all duration-300 relative group min-w-0",
                    activeStep === 'location'
                      ? "bg-white dark:bg-stone-800 shadow-2xl z-20 scale-[1.02] rounded-2xl"
                      : "hover:bg-white/40 dark:hover:bg-stone-800/20"
                  )}
                >
                  <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-brand-orange mb-2">
                    {t('where')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('searchDestinations')}
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    className="w-full bg-transparent text-lg font-black text-stone-800 dark:text-white focus:outline-none placeholder-stone-300 dark:placeholder-stone-700 truncate"
                    autoFocus={activeStep === 'location'}
                  />
                  {filters.location && activeStep === 'location' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setFilters({ ...filters, location: '' }); }}
                      className="absolute inset-inline-end-6 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                    >
                      <X size={16} strokeWidth={3} />
                    </button>
                  )}
                </div>

                <div className="w-px h-12 bg-stone-200 dark:bg-stone-800 opacity-50 shrink-0"></div>

                {/* Type Step */}
                <div
                  onClick={() => setActiveStep('type')}
                  className={clsx(
                    "flex-1 w-auto px-8 py-5 cursor-pointer transition-all duration-300 relative group min-w-0",
                    activeStep === 'type'
                      ? "bg-white dark:bg-stone-800 shadow-2xl z-20 scale-[1.02] rounded-2xl"
                      : "hover:bg-white/40 dark:hover:bg-stone-800/20"
                  )}
                >
                  <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-stone-400 mb-2">
                    {t('spotType') || 'Type'}
                  </label>
                  <div className="text-lg font-black text-stone-800 dark:text-white truncate capitalize">
                    {filters.type || t('anyType') || 'Any'}
                  </div>
                </div>

                {/* Search Button Zone */}
                <div className="p-2 w-auto shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSearch(); }}
                    disabled={isSearching}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-brand-orange to-orange-600 text-white px-6 py-4 rounded-2xl font-black text-lg transition-all shadow-[0_10px_40px_rgba(244,117,33,0.3)] hover:shadow-[0_10px_40px_rgba(244,117,33,0.5)] hover:-translate-y-1 active:scale-95 group disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSearching ? (
                      <Loader2 size={24} strokeWidth={4} className="animate-spin" />
                    ) : (
                      <>
                        <span className="hidden md:inline text-sm uppercase tracking-widest">{t('search') || 'Search'}</span>
                        <Search size={24} strokeWidth={4} className="group-hover:rotate-12 transition-transform duration-500" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Desktop Popups */}
              <div className="mt-4 relative">
                {/* Location Suggestions - HIGHER Z-INDEX */}
                {activeStep === 'location' && (
                  <div className="absolute top-full left-0 w-[400px] mt-2 bg-white dark:bg-stone-900 rounded-[2rem] shadow-3xl border border-stone-100/50 dark:border-stone-800/50 p-6 animate-in fade-in slide-in-from-top-4 duration-500 z-[99999] max-h-[60vh] overflow-y-auto">

                    {/* Use My Location Button */}
                    <button
                      onClick={handleUseMyLocation}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-800 text-left transition-all group mb-4"
                    >
                      <div className="p-2 bg-brand-orange/10 rounded-xl text-brand-orange group-hover:bg-brand-orange/20 transition-colors">
                        {isLoadingLocation ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Locate size={18} />
                        )}
                      </div>
                      <span className="font-bold text-brand-orange text-base">
                        {isLoadingLocation ? t('gettingLocation') : t('useMyLocation')}
                      </span>
                    </button>

                    {/* ... same suggestions reuse ... */}
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400 mb-4 px-2">
                      {t('popularDestinations') || 'Popular Areas'}
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {(suggestions.length > 0 ? suggestions : popularDestinations).map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => { setFilters({ ...filters, location: s.label }); setActiveStep('type'); }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-800 text-left transition-all group"
                        >
                          <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-xl text-stone-500 group-hover:bg-brand-orange/10 group-hover:text-brand-orange transition-colors">
                            <MapPin size={18} />
                          </div>
                          <span className="font-bold text-stone-800 dark:text-stone-100 text-base">{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Type Dropdown */}
                {activeStep === 'type' && (
                  <div className="absolute top-full right-0 w-[350px] mt-2 bg-white dark:bg-stone-900 rounded-[2rem] shadow-3xl border border-stone-100/50 dark:border-stone-800/50 p-6 animate-in fade-in slide-in-from-top-4 duration-300 z-[120]">
                    <div className="grid grid-cols-2 gap-2">
                      {spotTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilters({ ...filters, type: type.id });
                            setTimeout(() => handleSearch(), 200);
                          }}
                          className={clsx(
                            "flex flex-col items-center justify-center gap-1 p-5 md:p-3 rounded-xl border transition-all hover:bg-stone-50",
                            filters.type === type.id
                              ? "border-stone-900 bg-stone-900 text-white dark:border-white dark:bg-white dark:text-stone-900"
                              : "border-stone-100 text-stone-600 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300"
                          )}
                        >
                          <span className="text-xl">{type.icon}</span>
                          <span className="font-bold text-xs tracking-wide">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};


interface GuestRowProps {
  label: string;
  description: string;
  count: number;
  onUpdate: (delta: number) => void;
  min?: number;
}

const GuestRow: React.FC<GuestRowProps> = ({ label, description, count, onUpdate, min = 0 }) => (
  <div className="flex items-center justify-between">
    <div>
      <p className="font-bold text-stone-900 dark:text-white">{label}</p>
      <p className="text-xs text-stone-500">{description}</p>
    </div>
    <div className="flex items-center gap-4">
      <button
        onClick={() => count > min && onUpdate(-1)}
        disabled={count <= min}
        className="w-12 h-12 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-600 dark:text-stone-400 disabled:opacity-30 hover:border-stone-900 dark:hover:border-white transition-colors"
      >
        <Minus size={16} />
      </button>
      <span className="w-4 text-center font-bold dark:text-white">{count}</span>
      <button
        onClick={() => onUpdate(1)}
        className="w-12 h-12 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-600 dark:text-stone-400 hover:border-stone-900 dark:hover:border-white transition-colors"
      >
        <Plus size={16} />
      </button>
    </div>
  </div>
);

export default SearchBar;
