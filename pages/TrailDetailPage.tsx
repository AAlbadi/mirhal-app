import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Thermometer, User, Heart, Share2, Navigation, Mountain, CheckCircle, Flag, PlayCircle, StopCircle } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { getApiUrl } from '../utils/api';
import { Trail } from '../types';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

const libraries: ("places")[] = ["places"];

const TrailDetailPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [trail, setTrail] = useState<Trail | null>(null);
    const [loading, setLoading] = useState(true);
    const { t } = useI18n();

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey,
        libraries: libraries,
        preventGoogleFontsLoading: true,
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    useEffect(() => {
        const fetchTrail = async () => {
            if (!id) return;
            try {
                const apiUrl = getApiUrl();
                const res = await fetch(`${apiUrl}/api/trails/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setTrail(data.trail);
                }
            } catch (err) {
                console.error('Error fetching trail:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTrail();
    }, [id]);

    // Fit bounds when map and trail are ready
    useEffect(() => {
        if (map && trail && trail.waypoints && trail.waypoints.length >= 2) {
            const bounds = new window.google.maps.LatLngBounds();
            trail.waypoints.forEach(wp => {
                if (wp.coordinates) {
                    bounds.extend({ lat: wp.coordinates.lat, lng: wp.coordinates.lng });
                }
            });
            map.fitBounds(bounds);

            // Zoom out slightly so markers aren't on the edge
            const listener = window.google.maps.event.addListener(map, "idle", () => {
                if (map.getZoom()! > 14) map.setZoom(14); // Prevent zooming in too close for short trails
                window.google.maps.event.removeListener(listener);
            });
        }
    }, [map, trail]);

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!trail) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
                <div className="text-center">
                    <h2 className="text-2xl font-black mb-4 text-stone-900 dark:text-white">Trail not found</h2>
                    <button onClick={() => navigate('/trails')} className="text-brand-orange font-bold">Back to Trails</button>
                </div>
            </div>
        );
    }

    const startPoint = trail.waypoints?.find(wp => wp.type === 'Start')?.coordinates;
    const endPoint = trail.waypoints?.find(wp => wp.type === 'End')?.coordinates;
    const waypointsPath = trail.waypoints?.map(wp => wp.coordinates).filter(Boolean) as google.maps.LatLngLiteral[];

    const openGoogleMaps = async () => {
        if (!startPoint || !endPoint) return;
        const origin = `${startPoint.lat},${startPoint.lng}`;
        const destination = `${endPoint.lat},${endPoint.lng}`;
        // Using 'walking' mode for trails
        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;

        // Use Capacitor Browser for native apps, window.open for web
        if (Capacitor.isNativePlatform()) {
            await Browser.open({ url });
        } else {
            window.open(url, '_blank');
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-stone-950 pb-24 pt-48 md:pt-32 font-outfit">

            {/* Header Image */}
            <div className="relative h-72 md:h-96 mx-4 md:mx-8 rounded-[2rem] overflow-hidden shadow-2xl">
                <img
                    src={trail.photos?.[0] || trail.image || 'https://images.unsplash.com/photo-1542401886-65d6c61db217?auto=format&fit=crop&q=80&w=800'}
                    alt={trail.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/20 to-transparent"></div>

                <div className="absolute top-6 left-6 md:top-8 md:left-8">
                    <button onClick={() => navigate(-1)} className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors border border-white/30">
                        <ArrowLeft size={24} />
                    </button>
                </div>

                <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 right-6 text-white">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${trail.difficulty === 'Hard' ? 'bg-red-500' :
                            trail.difficulty === 'Moderate' ? 'bg-orange-500' :
                                'bg-green-500'
                            }`}>
                            {trail.difficulty}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-medium text-stone-300">
                            <MapPin size={12} /> {trail.location}
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none mb-4">{trail.title}</h1>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <img
                                src={trail.authorId?.picture || trail.authorId?.avatarUrl || 'https://i.pravatar.cc/150'}
                                alt={trail.authorId?.name || 'Unknown'}
                                className="w-8 h-8 rounded-full border-2 border-white/20"
                            />
                            <span className="text-sm font-bold">{trail.authorId?.name || 'Explorer'}</span>
                        </div>
                        <div className="h-4 w-px bg-white/20"></div>
                        <div className="flex items-center gap-1 text-sm font-bold">
                            <Heart size={16} fill="white" /> {trail.likes}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-6 relative z-10">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl shadow-xl border border-stone-100 dark:border-stone-800 mb-6">
                    <div className="text-center">
                        <div className="text-xs text-stone-400 uppercase font-bold tracking-wider mb-1">Distance</div>
                        <div className="text-xl font-black text-stone-900 dark:text-white">{trail.length}</div>
                    </div>
                    <div className="text-center border-l border-stone-100 dark:border-stone-800">
                        <div className="text-xs text-stone-400 uppercase font-bold tracking-wider mb-1">Duration</div>
                        <div className="text-xl font-black text-stone-900 dark:text-white">{trail.duration}</div>
                    </div>
                    <div className="text-center border-l border-stone-100 dark:border-stone-800">
                        <div className="text-xs text-stone-400 uppercase font-bold tracking-wider mb-1">Elev Gain</div>
                        <div className="text-xl font-black text-stone-900 dark:text-white">{trail.elevation || '0m'}</div>
                    </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                    <h3 className="text-lg font-black text-stone-900 dark:text-white mb-2">About this Trail</h3>
                    <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                        {trail.description}
                    </p>
                </div>

                {/* Interactive Route Map */}
                <div className="mb-8">
                    <h3 className="text-lg font-black text-stone-900 dark:text-white mb-4">Route Map</h3>
                    <div className="h-80 rounded-[2rem] overflow-hidden shadow-lg border-4 border-white dark:border-stone-800 relative z-0 group">

                        {/* Overlay Button */}
                        <button
                            onClick={openGoogleMaps}
                            className="absolute top-4 right-4 z-10 bg-white dark:bg-stone-900 px-4 py-2 rounded-xl shadow-lg font-bold text-xs flex items-center gap-2 hover:scale-105 transition-transform"
                        >
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Google_Maps_icon_%282020%29.svg/1200px-Google_Maps_icon_%282020%29.svg.png" className="w-4 h-4" alt="Google Maps" />
                            Open Layout
                        </button>

                        {isLoaded && startPoint && endPoint ? (
                            <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                center={startPoint}
                                zoom={12}
                                onLoad={onLoad}
                                options={{
                                    mapTypeId: 'satellite',
                                    streetViewControl: false,
                                    fullscreenControl: true,
                                    mapTypeControl: false,
                                }}
                            >
                                {/* Start Marker */}
                                <Marker
                                    position={startPoint}
                                    onClick={openGoogleMaps}
                                    icon={{
                                        url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                                        scaledSize: new window.google.maps.Size(42, 42)
                                    }}
                                    title="Start Point"
                                />

                                {/* End Marker */}
                                <Marker
                                    position={endPoint}
                                    onClick={openGoogleMaps}
                                    icon={{
                                        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                                        scaledSize: new window.google.maps.Size(42, 42)
                                    }}
                                    title="End Point"
                                />

                                {/* Route Polyline */}
                                <Polyline
                                    path={waypointsPath}
                                    options={{
                                        strokeColor: '#FF6B00', // Brand Orange
                                        strokeOpacity: 0.8,
                                        strokeWeight: 4,
                                        geodesic: true,
                                    }}
                                    onClick={openGoogleMaps}
                                />
                            </GoogleMap>
                        ) : (
                            <div className="w-full h-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                                <span className="text-stone-400 font-bold">Loading Map...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Waypoints */}
                {trail.waypoints && trail.waypoints.length > 0 && (
                    <div className="mb-24">
                        <h3 className="text-lg font-black text-stone-900 dark:text-white mb-4">Waypoints</h3>
                        <div className="space-y-4">
                            {trail.waypoints.map((wp, index) => (
                                <div key={index} className="flex items-center gap-4 bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-100 dark:border-stone-800">
                                    <div className="w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange font-black text-sm">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-stone-900 dark:text-white">{wp.name}</h4>
                                        <span className="text-xs text-stone-400 font-bold uppercase tracking-wider">{wp.type}</span>
                                    </div>
                                    <CheckCircle size={20} className="text-green-500" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-stone-900/90 backdrop-blur-xl border-t border-stone-200 dark:border-stone-800 md:hidden z-50">
                <button onClick={openGoogleMaps} className="w-full bg-brand-orange text-white text-lg font-black py-4 rounded-xl shadow-lg shadow-brand-orange/20 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                    <Navigation size={20} /> Start Navigation
                </button>
            </div>

            {/* Desktop Action */}
            <div className="hidden md:block fixed bottom-8 right-8 z-50">
                <button onClick={openGoogleMaps} className="bg-brand-orange text-white text-lg font-black px-8 py-4 rounded-full shadow-2xl shadow-brand-orange/30 flex items-center gap-3 hover:scale-105 transition-transform">
                    <Navigation size={24} /> Start Navigation
                </button>
            </div>

        </div>
    );
};

export default TrailDetailPage;
