import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '../contexts/I18nContext';

interface GooglePlacesAutocompleteProps {
  onPlaceSelected: (place: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    lat: number;
    lng: number;
    formattedAddress: string;
  }) => void;
  initialValue?: string;
  placeholder?: string;
}

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  onPlaceSelected,
  initialValue = '',
  placeholder
}) => {
  const { t } = useI18n();
  const inputPlaceholder = placeholder || t('searchDestinations');
  const [value, setValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualLocation, setManualLocation] = useState({
    city: '',
    state: '',
    country: '',
    lat: '',
    lng: '',
  });
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Fetch suggestions using Geocoding API (no legacy API needed!)
  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&components=country:sa|country:ae|country:kw|country:qa|country:bh|country:om&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        setSuggestions(data.results.slice(0, 5)); // Show top 5 results
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setSuggestions([]);
    }
  };

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value]);

  const handleSelectSuggestion = (suggestion: any) => {
    const { address_components, formatted_address, geometry } = suggestion;

    let address = '';
    let city = '';
    let state = '';
    let country = '';
    let zipCode = '';

    address_components.forEach((component: any) => {
      const types = component.types;

      if (types.includes('street_number')) {
        address = component.long_name + ' ';
      }
      if (types.includes('route')) {
        address += component.long_name;
      }
      if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        state = component.long_name;
      }
      if (types.includes('country')) {
        country = component.long_name;
      }
      if (types.includes('postal_code')) {
        zipCode = component.long_name;
      }
    });

    const lat = geometry.location.lat;
    const lng = geometry.location.lng;

    setValue(formatted_address);
    setShowSuggestions(false);
    setSuggestions([]);

    onPlaceSelected({
      address: address.trim() || formatted_address,
      city,
      state,
      country,
      zipCode,
      lat,
      lng,
      formattedAddress: formatted_address,
    });
  };

  const handleManualSubmit = () => {
    if (manualLocation.city && manualLocation.country && manualLocation.lat && manualLocation.lng) {
      const formattedAddress = `${manualLocation.city}, ${manualLocation.state ? manualLocation.state + ', ' : ''}${manualLocation.country}`;
      onPlaceSelected({
        address: formattedAddress,
        city: manualLocation.city,
        state: manualLocation.state,
        country: manualLocation.country,
        zipCode: '',
        lat: parseFloat(manualLocation.lat),
        lng: parseFloat(manualLocation.lng),
        formattedAddress,
      });
      setValue(formattedAddress);
      setShowManualEntry(false);
    }
  };

  if (showManualEntry) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
          <p className="text-sm font-bold text-yellow-800 mb-2">
            {t('googleMapsUnavailable')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder={t('city')}
              value={manualLocation.city}
              onChange={(e) => setManualLocation({ ...manualLocation, city: e.target.value })}
              className="px-3 py-2 border-2 border-brand-sand-dark rounded-lg text-sm font-bold"
            />
            <input
              type="text"
              placeholder={t('stateProvince')}
              value={manualLocation.state}
              onChange={(e) => setManualLocation({ ...manualLocation, state: e.target.value })}
              className="px-3 py-2 border-2 border-brand-sand-dark rounded-lg text-sm font-bold"
            />
            <input
              type="text"
              placeholder={t('country')}
              value={manualLocation.country}
              onChange={(e) => setManualLocation({ ...manualLocation, country: e.target.value })}
              className="px-3 py-2 border-2 border-brand-sand-dark rounded-lg text-sm font-bold"
            />
            <input
              type="number"
              step="0.000001"
              placeholder={t('latitude')}
              value={manualLocation.lat}
              onChange={(e) => setManualLocation({ ...manualLocation, lat: e.target.value })}
              className="px-3 py-2 border-2 border-brand-sand-dark rounded-lg text-sm font-bold"
            />
            <input
              type="number"
              step="0.000001"
              placeholder={t('longitude')}
              value={manualLocation.lng}
              onChange={(e) => setManualLocation({ ...manualLocation, lng: e.target.value })}
              className="px-3 py-2 border-2 border-brand-sand-dark rounded-lg text-sm font-bold"
            />
          </div>
          <button
            type="button"
            onClick={handleManualSubmit}
            className="mt-3 px-4 py-2 bg-brand-orange text-white rounded-lg font-bold hover:bg-brand-brown-medium w-full"
          >
            {t('setLocation')}
          </button>
          <p className="text-xs text-brand-orange mt-2">
            {t('tipGetCoordinates')} <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="underline">{t('googleMaps')}</a> (right-click on map → coordinates)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 relative">
      <div className="relative z-50">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={inputPlaceholder}
          className="w-full px-4 py-3 border-2 border-brand-sand-dark rounded-lg text-base font-bold text-brand-brown-dark placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-all relative z-10"
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xl pointer-events-none z-20">
          📍
        </div>

        {/* Custom Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-brand-sand-dark rounded-lg shadow-2xl z-[9999] max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="px-4 py-3 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="font-bold text-brand-brown-dark text-sm">
                  {suggestion.formatted_address}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowManualEntry(true)}
        className="text-xs text-brand-orange hover:text-brand-brown-dark font-bold underline"
      >
        {t('cantFindLocation')}
      </button>
    </div>
  );
};

export default GooglePlacesAutocomplete;
