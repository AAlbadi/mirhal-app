import React from 'react';
import { useI18n } from '../contexts/I18nContext';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Compass, X, MapPin } from 'lucide-react';

interface LocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    location: {
        lat: number;
        lng: number;
        address?: string;
    };
    locationLink?: string;
    title: string;
}

const libraries: ("places")[] = ["places"];

const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, location, title, locationLink }) => {
    const { t, dir } = useI18n();

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries,
    });

    if (!isOpen) return null;

    const handleOpenMaps = () => {
        if (locationLink && locationLink.length > 5) {
            window.open(locationLink, '_blank');
        } else {
            window.open(`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-md" dir={dir}>
            <div className="fixed inset-0" onClick={onClose} />
            <div className="flex min-h-screen items-center justify-center p-4 relative z-10 pointer-events-none">
                <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-[2.5rem] shadow-2xl overflow-hidden pointer-events-auto border border-stone-200 dark:border-stone-800 animate-slide-up">

                    {/* Header */}
                    <div className="bg-stone-50 dark:bg-stone-950 px-8 py-6 flex justify-between items-center border-b border-stone-100 dark:border-stone-800">
                        <div className="flex items-center gap-3">
                            <div className="bg-brand-orange/10 p-2 rounded-xl text-brand-orange">
                                <Compass size={24} />
                            </div>
                            <h2 className="text-2xl font-bold serif-heading text-stone-900 dark:text-white">
                                {t('navigate') || 'Get Directions'}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8">
                        <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">{title}</h3>
                        <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 mb-8 font-medium">
                            <MapPin size={18} />
                            <p>{location.address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`}</p>
                        </div>

                        {/* Map Container */}
                        <div className="w-full h-64 bg-stone-100 dark:bg-stone-800 rounded-3xl mb-8 overflow-hidden border border-stone-200 dark:border-stone-700 relative shadow-inner">
                            {isLoaded ? (
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                    center={{ lat: location.lat, lng: location.lng }}
                                    zoom={14}
                                    options={{
                                        disableDefaultUI: true,
                                        zoomControl: true,
                                        styles: [
                                            {
                                                featureType: "all",
                                                elementType: "geometry",
                                                stylers: [{ saturation: -20 }]
                                            }
                                        ]
                                    }}
                                >
                                    <Marker position={{ lat: location.lat, lng: location.lng }} />
                                </GoogleMap>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-400 font-medium">
                                    {t('loadingMap')}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleOpenMaps}
                            className="btn-tactile w-full py-5 bg-brand-orange text-white rounded-2xl font-black text-xl shadow-lg hover:shadow-brand-orange/30 flex items-center justify-center gap-3"
                        >
                            <Compass size={24} strokeWidth={2.5} />
                            {t('openInMaps')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LocationModal;
