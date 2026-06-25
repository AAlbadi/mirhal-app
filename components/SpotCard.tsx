import React, { useState } from 'react';
import clsx from 'clsx';
import { Star, MapPin, Heart, ShieldCheck, ChevronLeft, ChevronRight, Footprints, Home } from 'lucide-react';
import { SpotListing } from '../types';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useRequireAuth } from '../hooks/useRequireAuth';

interface SpotCardProps {
    spot: SpotListing & { type?: string }; // explicit type extension
    theme?: 'light' | 'dark';
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    distance?: string; // e.g. "12 km"
    drivingTime?: string; // e.g. "15 min"
}

const SpotCard: React.FC<SpotCardProps> = ({ spot, theme = 'light', onMouseEnter, onMouseLeave, distance, drivingTime }) => {
    const navigate = useNavigate();
    const { t, lang } = useI18n();
    const { toggleFavorite, isFavorite } = useFavorites();
    const requireAuth = useRequireAuth();
    const liked = isFavorite(spot.id);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const isTrail = spot.type === 'Trail';
    const displayName = (lang === 'ar' && spot.nameAr) ? spot.nameAr : spot.name;
    const displayLocation = (lang === 'ar' && (spot.locationAr || spot.city)) ? (spot.locationAr || spot.city) : spot.location;
    const photos = spot.photos && spot.photos.length > 0 ? spot.photos : ['https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&q=80&w=600'];

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setCurrentImageIndex((prev) => (prev + 1) % photos.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setCurrentImageIndex((prev) => (prev - 1 + photos.length) % photos.length);
    };

    const handleNavigate = () => {
        if (isTrail) {
            navigate(`/trails/${spot.id}`);
        } else {
            navigate(`/spot/${spot.id}`);
        }
    };

    const startPos = React.useRef({ x: 0, y: 0 });

    const handlePointerDown = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
        // Handle both mouse/pointer and touch events
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        startPos.current = { x: clientX, y: clientY };
    };

    const handleInteraction = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
        const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as React.MouseEvent).clientY;

        const diffX = Math.abs(clientX - startPos.current.x);
        const diffY = Math.abs(clientY - startPos.current.y);

        // If moved more than 10px, consider it a scroll/drag and ignore click
        if (diffX > 10 || diffY > 10) return;

        handleNavigate();
    };

    return (
        <div
            onPointerDown={handlePointerDown}
            onTouchStart={handlePointerDown}
            onPointerUp={handleInteraction}
            onMouseUp={handleInteraction}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className="group relative rounded-xl md:rounded-2xl overflow-hidden flex flex-row md:flex-col h-[90px] md:h-full border border-white/40 dark:border-white/10 shadow-sm transition-all duration-300 cursor-pointer bg-white/60 dark:bg-stone-900/60 backdrop-blur-xl hover:-translate-y-1 hover:shadow-md ring-1 ring-white/20 dark:ring-white/5 hover:ring-brand-orange/30"
        >
            {/* 2026 Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    requireAuth(() => toggleFavorite(spot.id));
                }}
                className={clsx(
                    "absolute top-1.5 right-1.5 md:top-3 md:right-3 z-10 p-1.5 md:p-2 rounded-full shadow-sm transition-all hover:scale-110 active:scale-90",
                    liked
                        ? "bg-gradient-to-br from-brand-orange to-orange-600 text-white shadow-brand-orange/30"
                        : "bg-white/80 backdrop-blur-md text-stone-400 hover:text-brand-orange hover:bg-white"
                )}
            >
                <Heart size={12} strokeWidth={2.5} fill={liked ? "currentColor" : "none"} className="md:w-4 md:h-4" />
            </button>

            <div className="relative w-[90px] md:w-full h-full md:h-[160px] lg:h-[180px] overflow-hidden shrink-0 bg-stone-100 dark:bg-stone-800">
                <img
                    src={photos[currentImageIndex]}
                    alt={displayName}
                    loading="lazy"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&q=80&w=800';
                    }}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 will-change-transform"
                />

                {/* Carousel Controls - Keep hidden mainly or very subtle */}

                {/* Badge Overlay - Reduced Size */}
                <div className="hidden md:block absolute top-3 left-3 pointer-events-none z-10">
                    <div className={clsx(
                        "px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-md backdrop-blur-md border border-white/10",
                        isTrail
                            ? "bg-emerald-600/90 text-white shadow-emerald-900/20"
                            : (spot.type === 'PaidCamping' ? "bg-amber-900/95 text-white shadow-amber-900/20" : "bg-stone-900/95 text-brand-orange shadow-black/30")
                    )}>
                        {isTrail ? <Footprints size={10} className="animate-pulse" /> : (spot.type === 'PaidCamping' ? <Home size={10} className="text-amber-400" /> : <ShieldCheck size={10} className="text-brand-orange" fill="currentColor" />)}
                        <span className={clsx("text-[9px] font-bold tracking-wider uppercase text-white")}>
                            {isTrail ? (t('verifiedTrail') || 'Verified') : (spot.type === 'PaidCamping' ? `${spot.price} AED` : t('verifiedSpot'))}
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-2 md:p-3 flex flex-col flex-grow justify-center md:justify-start">
                <div className="flex justify-between items-start mb-0.5">
                    <h3 className="text-xs md:text-sm font-bold leading-tight text-stone-900 dark:text-white line-clamp-1 group-hover:text-brand-orange transition-colors">
                        {displayName}
                    </h3>
                    <div className={clsx("hidden md:flex items-center gap-1 font-bold shrink-0", isTrail ? "text-emerald-600" : "text-stone-900 bg-brand-orange/10 px-1.5 py-0.5 rounded")}>
                        {isTrail ? <Footprints size={10} fill="currentColor" /> : <Star size={10} className="text-brand-orange" fill="currentColor" />}
                        <span className="text-xs">{spot.rating || t('newRating')}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1 text-stone-500 text-[9px] md:text-[10px] mb-1 md:mb-2 bg-stone-50 dark:bg-stone-800/50 w-fit px-1 py-0.5 rounded">
                    <MapPin size={10} className={clsx(isTrail ? "text-emerald-600" : "text-stone-700")} />
                    <span className="font-medium line-clamp-1">{displayLocation}</span>
                </div>

                {/* Driving Info Badge - Compact */}
                {(distance || drivingTime) && (
                    <div className="flex items-center gap-1.5 mt-auto md:mt-0 mb-0 md:mb-2">
                        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-full px-1.5 py-0.5 border border-stone-200 dark:border-stone-700">
                            {distance && <span className="text-[9px] font-bold">{distance}</span>}
                            {distance && drivingTime && <span className="text-[8px] opacity-50">•</span>}
                            {drivingTime && <span className="text-[9px] font-bold">{drivingTime}</span>}
                        </div>
                    </div>
                )}


                <div className="md:mt-auto flex items-center justify-between pt-0 md:pt-2 md:border-t border-stone-100 dark:border-stone-800/50 mt-0.5">
                    <div>
                        <span className={clsx("text-xs md:text-sm font-black", isTrail ? "text-green-600" : "text-brand-orange")}>
                            {t('freeLabel')}
                        </span>
                    </div>
                    <span className={clsx("hidden md:inline font-bold text-xs group-hover:underline", isTrail ? "text-green-600" : "text-brand-orange")}>
                        {t('detailsArrow')}
                    </span>
                </div>
            </div>
        </div >
    );
};

export default SpotCard;
