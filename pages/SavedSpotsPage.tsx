
import React, { useState, useMemo, useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import SpotCard from '../components/SpotCard';
import MapView from '../components/MapView';
import { SpotListing, Trail, Category } from '../types';
import { Heart, Map as MapIcon, Grid } from 'lucide-react';
import { getApiUrl } from '../utils/api';

interface SavedSpotsPageProps {
    spots: SpotListing[];
}

const SavedSpotsPage: React.FC<SavedSpotsPageProps> = ({ spots }) => {
    const { t } = useI18n();
    const { favorites } = useFavorites();
    const { mongoUser } = useAuth();
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
    const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);
    const [likedTrails, setLikedTrails] = useState<Trail[]>([]);
    const [loadingTrails, setLoadingTrails] = useState(true);

    // Fetch Trails
    useEffect(() => {
        const fetchTrails = async () => {
            try {
                const apiUrl = getApiUrl();
                const res = await fetch(`${apiUrl}/api/trails`);
                if (res.ok) {
                    const data = await res.json();
                    setLikedTrails((data.trails || []).filter((t: Trail) =>
                        t.likedBy?.includes(mongoUser?._id)
                    ));
                }
            } catch (err) {
                console.error('Error fetching trails for favorites:', err);
            } finally {
                setLoadingTrails(false);
            }
        };

        if (mongoUser?._id) {
            fetchTrails();
        } else {
            setLoadingTrails(false);
        }
    }, [mongoUser]);

    const savedSpots = useMemo(() =>
        spots.filter(s => favorites.includes(s.id)),
        [spots, favorites]);

    const mappedTrails: SpotListing[] = useMemo(() => likedTrails.map(t => ({
        id: t._id,
        name: t.title,
        location: t.location,
        coordinates: t.waypoints?.[0]?.coordinates || { lat: 25.2048, lng: 55.2708 }, // Fallback to Dubai if no points
        rating: 5, // Default for now
        reviewCount: t.likes || 0,
        photos: t.photos || [],
        features: [`${t.length} km`, t.difficulty],
        description: t.description,
        hostId: t.authorId?._id || 'system',
        category: Category.MOUNTAIN, // Generic, or infer
        type: 'Trail',
        emoji: '🥾',
        price: 0
    })), [likedTrails]);

    const combinedItems = useMemo(() => [...savedSpots, ...mappedTrails], [savedSpots, mappedTrails]);

    if (!loadingTrails && combinedItems.length === 0) {
        return (
            <div className="pt-48 pb-20 px-6 min-h-[70vh] flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-stone-100 dark:bg-stone-900 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <Heart size={40} className="text-brand-orange/20" fill="currentColor" />
                </div>
                <h1 className="serif-heading text-3xl font-black mb-3 text-stone-900 dark:text-white">
                    {t('noFavorites')}
                </h1>
                <p className="text-stone-500 text-base max-w-sm font-medium leading-relaxed mb-8">
                    {t('exploreSpotsToSave')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <a
                        href="/"
                        className="px-8 py-3 bg-brand-orange text-white rounded-xl font-bold text-base shadow-lg hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
                    >
                        {t('exploreGCCSpots')}
                    </a>
                    <a
                        href="/trails"
                        className="px-8 py-3 bg-white dark:bg-stone-800 text-stone-900 dark:text-white rounded-xl font-bold text-base shadow-lg hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
                    >
                        Explore Trails
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="pt-48 min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col overflow-hidden">
            {/* Header Section */}
            <div className="px-6 py-10 max-w-7xl mx-auto w-full flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="serif-heading text-5xl font-black text-stone-900 dark:text-white mb-2">
                        {t('savedSpotsTitle')}
                    </h1>
                    <p className="text-stone-500 font-medium text-lg">
                        {savedSpots.length} Spots • {likedTrails.length} Trails
                    </p>
                </div>

                <div className="flex bg-white dark:bg-stone-900 p-1.5 rounded-2xl shadow-lg border border-stone-100 dark:border-stone-800">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all ${viewMode === 'grid' ? 'bg-brand-orange text-white' : 'text-stone-400 hover:text-stone-700 dark:hover:text-white'}`}
                    >
                        <Grid size={18} />
                        {t('showList')}
                    </button>
                    <button
                        onClick={() => setViewMode('map')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all ${viewMode === 'map' ? 'bg-brand-orange text-white' : 'text-stone-400 hover:text-stone-700 dark:hover:text-white'}`}
                    >
                        <MapIcon size={18} />
                        {t('showMap')}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-grow relative h-full">
                {viewMode === 'grid' ? (
                    <div className="max-w-7xl mx-auto px-6 pb-20">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {combinedItems.map(item => (
                                <SpotCard key={item.id} spot={item} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 h-[70vh]">
                        <MapView
                            spots={combinedItems}
                            hoveredSpotId={hoveredSpotId}
                        // Simplified map for saved spots: no bounds syncing to URL
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SavedSpotsPage;
