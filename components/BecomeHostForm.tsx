import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../utils/api';
import { useI18n } from '../contexts/I18nContext';
import { MapPin, Image, Upload, X, Navigation, Search } from 'lucide-react';
import { uploadMultipleImages } from '../utils/uploadImage';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const libraries: ("places")[] = ["places"];

interface BecomeHostFormProps {
  onSuccess?: () => void;
}

const BecomeHostForm: React.FC<BecomeHostFormProps> = ({ onSuccess }) => {
  const { currentUser } = useAuth();
  const { t, lang } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const [formData, setFormData] = useState({
    spotName: '',
    terrainType: '' as 'Desert' | 'Beach' | 'Mountain' | 'PaidCamping' | 'Rv Services' | '',
    emoji: '',
    description: '',
    coordinates: { lat: '', lng: '' },
    price: '',
    contactPhone: '',
  });

  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number }>({ lat: 25.2048, lng: 55.2708 }); // Default to Dubai
  const [suggestions, setSuggestions] = useState<Array<{ label: string; lat: number; lon: number }>>([]);
  const [isLoadingSuggest, setIsLoadingSuggest] = useState(false);
  const debounceRef = useRef<number | undefined>();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  // Check if script is already loaded from another component (like MapView or HomePage)
  const isScriptLoaded = window.google?.maps && window.google?.maps?.places;

  const { isLoaded: isScriptLoadHook } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: libraries,
    preventGoogleFontsLoading: true, // Optimization
  });

  const isLoaded = isScriptLoaded || isScriptLoadHook;

  const terrainOptions = [
    { type: 'Desert', emoji: '🐪', label: 'Desert' },
    { type: 'Beach', emoji: '🏖️', label: 'Beach' },
    { type: 'Mountain', emoji: '⛰️', label: 'Mountain' },
    { type: 'PaidCamping', emoji: '🏕️', label: 'Istiraha / Paid Camping' },
    { type: 'Rv Services', emoji: '🚐', label: 'Rv Services' },
  ];

  // HTML5 Geolocation - One-Tap GPS
  const getMyLocation = () => {
    setGettingLocation(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
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
        setFormData(prev => ({
          ...prev,
          coordinates: {
            lat: newPos.lat.toString(),
            lng: newPos.lng.toString(),
          }
        }));
        if (map) {
          map.panTo(newPos);
          map.setZoom(16);
        }
        setGettingLocation(false);
      },
      (error) => {
        setError(`Location error: ${error.message}`);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // GCC Region Bounds for location bias
  const GCC_BOUNDS = {
    north: 32.5,
    south: 16.0,
    east: 60.0,
    west: 34.5
  };

  // Get user location for 300km radius bias
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
          setUserLocation({ lat: 25.2048, lng: 55.2708 }); // Dubai fallback
        }
      );
    }
  }, []);

  // Smart Google Places Autocomplete (matches SearchBar)
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2 || !isLoaded) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        setIsLoadingSuggest(true);

        if (!searchQuery || searchQuery.length < 3) {
          setSuggestions([]);
          setIsLoadingSuggest(false);
          return;
        }

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
            lon: result.geometry.location.lng,
            details: result // Store full details
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
    }, 300);
  }, [searchQuery, isLoaded, lang, userLocation]);

  const handleSuggestionClick = (suggestion: { label: string, lat: number, lon: number }) => {
    const newPos = { lat: suggestion.lat, lng: suggestion.lon };

    // Update marker
    setMarkerPosition(newPos);

    // Update form
    setFormData(prev => ({
      ...prev,
      coordinates: {
        lat: newPos.lat.toFixed(6),
        lng: newPos.lng.toFixed(6),
      }
    }));

    // Update Input
    setSearchQuery(suggestion.label); // Or keep it simple
    setSuggestions([]); // Clear suggestions

    // Move map
    if (map) {
      map.panTo(newPos);
      map.setZoom(16);
    }
  };

  const onMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      setMarkerPosition({ lat: newLat, lng: newLng });
      setFormData(prev => ({
        ...prev,
        coordinates: {
          lat: newLat.toFixed(6),
          lng: newLng.toFixed(6),
        }
      }));
    }
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const handleTerrainSelect = (terrain: typeof terrainOptions[0]) => {
    setFormData(prev => ({
      ...prev,
      terrainType: terrain.type as any,
      emoji: terrain.emoji
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    addFiles(files);
  };

  const addFiles = (files: File[]) => {
    const remainingSlots = 3 - photoFiles.length; // Max 3 photos
    const filesToAdd = files.slice(0, remainingSlots);

    if (filesToAdd.length === 0) return;

    setPhotoFiles(prev => [...prev, ...filesToAdd]);

    filesToAdd.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // For Supabase, we rely on the current session.
      // If user is not logged in, they are 'anonymous' effectively for the app logic,
      // but Supabase requires RLS policy for 'anon' role to write to 'spots' or 'images'.
      // We asked user to make 'images' bucket PUBLIC, so uploads should work without auth if policy allows,
      // or if we just use the public bucket.

      const effectiveUserId = currentUser?.id || 'anonymous';

      // Upload photos first
      let photoUrls: string[] = [];
      if (photoFiles.length > 0) {
        setUploadingPhotos(true);
        try {
          photoUrls = await uploadMultipleImages(
            photoFiles,
            'spots',
            effectiveUserId,
            (progress) => setUploadProgress(progress)
          );
        } catch (uploadError: any) {
          throw new Error(`${t('photoUploadFailed')}: ${uploadError.message}`);
        } finally {
          setUploadingPhotos(false);
        }
      }

      const apiUrl = getApiUrl();

      // Get token if user is logged in
      let token = '';
      if (currentUser) {
        const { data: { session } } = await import('../supabaseClient').then(m => m.supabase.auth.getSession());
        token = session?.access_token || '';
      }

      // Submit spot for admin review
      const response = await fetch(`${apiUrl}/api/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title: formData.spotName,
          description: formData.description || 'No description provided',
          type: formData.terrainType,
          emoji: formData.emoji,
          location: {
            formattedAddress: `${formData.spotName} (User Submitted)`,
            coordinates: {
              lat: parseFloat(formData.coordinates.lat) || 0,
              lng: parseFloat(formData.coordinates.lng) || 0,
            }
          },
          images: photoUrls,
          amenities: [],
          approvalStatus: 'pending',

          price: formData.price ? parseFloat(formData.price) : 0,
          contactPhone: formData.contactPhone,
          year: new Date().getFullYear(),
          sleeps: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details
          ? `${data.error}: ${data.details}`
          : (data.error || 'Failed to submit spot');
        throw new Error(errorMessage);
      }

      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 border-2 border-emerald-200 dark:border-emerald-800 rounded-3xl p-10 text-center shadow-2xl">
        <div className="text-8xl mb-6">✨</div>
        <h3 className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mb-4">
          {t('spotSubmittedTitle')}
        </h3>
        <p className="text-xl text-emerald-800 dark:text-emerald-200 mb-6 font-medium">
          Your spot is under review
        </p>

        <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur rounded-2xl p-6 mb-6 shadow-lg">
          <ul className="text-left space-y-3 text-emerald-700 dark:text-emerald-300">
            <li className="flex items-start gap-3">
              <span className="text-2xl">👨‍💼</span>
              <span>{t('adminReview24to48')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">📧</span>
              <span>{t('youllBeNotifiedEmail')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">📍</span>
              <span>{t('approvedSpotsAppear')}</span>
            </li>
          </ul>
        </div>

        <a
          href="/"
          className="inline-block mt-6 px-8 py-4 bg-brand-orange text-white rounded-2xl font-black hover:scale-105 transition-all"
        >
          Back to Map
        </a>
      </div>
    );
  }



  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-stone-900 dark:text-white mb-2">
          {t('shareSpotTitle')}
        </h2>
        <p className="text-sm md:text-base text-stone-600 dark:text-stone-400">{t('quickSubmissionSubtitle')}</p>
      </div>

      {/* GPS Location with Interactive Map */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 p-4 md:p-6 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-4">
        <label className="block text-xs font-black uppercase tracking-widest text-blue-700 dark:text-blue-300 mb-2">
          <Navigation size={14} className="inline mr-2" />
          {t('step1SetLocation')}
        </label>

        {/* GPS Button and Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
          <button
            type="button"
            onClick={getMyLocation}
            disabled={gettingLocation}
            className="py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {gettingLocation ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t('gettingGPS')}
              </>
            ) : (
              <>
                <Navigation size={18} />
                {t('useMyGPS')}
              </>
            )}
          </button>

          <div className="flex gap-2 w-full">
            {isLoaded && (
              <div className="flex-1 relative">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchLocationEnglishArabic')}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-blue-200 dark:border-blue-800 focus:border-blue-500 outline-none font-medium text-sm"
                  />
                  {isLoadingSuggest && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-orange animate-spin">
                      ⟳
                    </div>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <ul className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-stone-900 rounded-xl shadow-xl border border-stone-200 dark:border-stone-700 max-h-60 overflow-y-auto z-50">
                    {suggestions.map((suggestion, idx) => (
                      <li
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer border-b border-stone-100 dark:border-stone-800 last:border-0 text-sm font-medium text-stone-700 dark:text-stone-300"
                      >
                        📍 {suggestion.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Interactive Map */}
        {isLoaded && (
          <div className="relative">
            <div className="mb-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-300 text-center">
                {t('dragPinToAdjust')}
              </p>
            </div>
            {/* Reduced border and added shadow */}
            <div className="rounded-xl overflow-hidden border-2 border-brand-orange shadow-lg">
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '300px' }}
                center={markerPosition}
                zoom={12}
                onLoad={onMapLoad}
                mapTypeId="satellite"
                options={{
                  streetViewControl: false,
                  mapTypeControl: false, // Cleaner on mobile
                  fullscreenControl: true,
                  zoomControl: true,
                  gestureHandling: 'greedy',
                }}
              >
                <Marker
                  position={markerPosition}
                  draggable={true}
                  onDragEnd={onMarkerDragEnd}
                  title="Drag me to adjust location"
                  animation={google.maps.Animation.DROP}
                  cursor="move"
                  icon={{
                    url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                    scaledSize: new google.maps.Size(40, 40)
                  }}
                />
              </GoogleMap>
            </div>
          </div>
        )}

        {formData.coordinates.lat && formData.coordinates.lng && (
          <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <p className="text-xs font-black text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
              <span className="animate-pulse">📍</span> {t('locationLocked')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/60 dark:bg-stone-900/60 rounded-lg p-1.5">
                <p className="text-[10px] text-stone-500 dark:text-stone-400">{t('latitudeLabel')}</p>
                <p className="font-mono font-bold text-green-700 dark:text-green-400 text-xs">{formData.coordinates.lat}</p>
              </div>
              <div className="bg-white/60 dark:bg-stone-900/60 rounded-lg p-1.5">
                <p className="text-[10px] text-stone-500 dark:text-stone-400">{t('longitudeLabel')}</p>
                <p className="font-mono font-bold text-green-700 dark:text-green-400 text-xs">{formData.coordinates.lng}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Terrain Type Selector */}
      <div>
        <label className="block text-xs font-black uppercase tracking-widest text-stone-700 dark:text-stone-300 mb-2">
          {t('step2WhatType')} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {terrainOptions.map((terrain) => (
            <button
              key={terrain.type}
              type="button"
              onClick={() => handleTerrainSelect(terrain)}
              className={`p-3 md:p-6 rounded-2xl border-2 transition-all ${formData.terrainType === terrain.type
                ? 'bg-brand-orange border-brand-orange text-white scale-[1.02] shadow-lg'
                : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 hover:border-brand-orange'
                }`}
            >
              <div className="text-3xl md:text-5xl mb-1 md:mb-2">{terrain.emoji}</div>
              <div className={`font-black text-[10px] md:text-sm leading-tight ${formData.terrainType === terrain.type ? 'text-white' : 'text-stone-700 dark:text-stone-300'}`}>
                {terrain.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Spot Name */}
      <div>
        <label className="block text-xs font-black uppercase tracking-widest text-stone-700 dark:text-stone-300 mb-2">
          {t('step3NameSpot')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.spotName}
          onChange={(e) => setFormData(prev => ({ ...prev, spotName: e.target.value }))}
          required
          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 focus:border-brand-orange outline-none transition-all text-base font-medium"
          placeholder={t('exampleHiddenBeach')}
        />
      </div>

      {/* Conditional Fields for Paid Camping */}
      {formData.terrainType === 'PaidCamping' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in-up">
          <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
            <label className="block text-xs font-black uppercase tracking-widest text-amber-800 dark:text-amber-200 mb-1">
              Price Per Night (AED) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              required
              placeholder="e.g. 150"
              className="w-full p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-amber-100 dark:border-amber-800 focus:border-amber-500 outline-none font-bold text-amber-900 dark:text-amber-100 text-sm"
            />
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
            <label className="block text-xs font-black uppercase tracking-widest text-amber-800 dark:text-amber-200 mb-1">
              Contact Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
              required
              placeholder="e.g. +971 50 123 4567"
              className="w-full p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-amber-100 dark:border-amber-800 focus:border-amber-500 outline-none font-bold text-amber-900 dark:text-amber-100 text-sm"
            />
          </div>
        </div>
      )}

      {/* Description (Required) */}
      <div>
        <label className="block text-xs font-black uppercase tracking-widest text-stone-700 dark:text-stone-300 mb-2">
          {t('step4ShortDescription')} <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          required
          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 focus:border-brand-orange outline-none transition-all text-base font-medium resize-none"
          placeholder={t('tellUsWhatMakesSpecial')}
        />
      </div>

      {/* Photos (Required, Min 1, Max 3) */}
      <div>
        <label className="block text-sm font-black uppercase tracking-widest text-stone-700 dark:text-stone-300 mb-3">
          <Image size={16} className="inline mr-2" />
          {t('step5AddPhotos')} <span className="text-red-500">*</span> ({t('min1Max3')})
        </label>

        {photoFiles.length < 3 && (
          <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl p-8 text-center hover:border-brand-orange transition-all bg-stone-50/50 dark:bg-stone-900/50">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="photo-upload"
            />
            <label htmlFor="photo-upload" className="cursor-pointer">
              <Upload size={40} className="mx-auto mb-3 text-stone-400" />
              <p className="font-bold text-stone-700 dark:text-stone-300">
                {t('clickToUpload')}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                {photoFiles.length}/3 uploaded
              </p>
            </label>
          </div>
        )}

        {/* Upload Progress */}
        {uploadingPhotos && (
          <div className="mt-4 bg-brand-orange/10 p-4 rounded-2xl">
            <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-orange transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-stone-500 mt-2">Uploading... {Math.round(uploadProgress)}%</p>
          </div>
        )}

        {/* Photo Previews */}
        {photoPreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            {photoPreviews.map((preview, index) => (
              <div key={index} className="relative group aspect-square rounded-xl overflow-hidden">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-4 text-red-700 dark:text-red-400 font-medium text-sm">
          ⚠️ {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !formData.spotName || !formData.terrainType || !formData.coordinates.lat || !formData.description || photoFiles.length === 0 || (formData.terrainType === 'PaidCamping' && (!formData.price || !formData.contactPhone))}
        className="w-full py-5 bg-gradient-to-r from-brand-orange to-orange-600 text-white rounded-2xl font-black text-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            {t('submittingLabel')}
          </>
        ) : (
          <>
            <MapPin size={24} />
            {t('submitForReview')}
          </>
        )}
      </button>

      <p className="text-xs text-center text-stone-500 mt-4">
        {t('requiredFields')}
      </p>
    </form>
  );
};

export default BecomeHostForm;
