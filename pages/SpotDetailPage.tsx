
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, ShieldCheck, Compass, Share, Heart, X, Wifi, Flame, Droplets, Mountain, Tent, Car, Info, Copy, Check, Upload, Phone } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { getApiUrl } from '../utils/api';
import Navbar from '../components/Navbar';
import { uploadMultipleImages } from '../utils/uploadImage';
import LocationModal from '../components/LocationModal';
import ReviewModal from '../components/ReviewModal';
import ReportModal from '../components/ReportModal';
import ReviewCard from '../components/ReviewCard';
import ShareButton from '../components/ShareButton';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { SpotListing, User, Review, Category } from '../types';

const libraries: ("places")[] = ["places"];

interface SpotDetailPageProps {
    spots: SpotListing[];
    users: User[];
}

const SpotDetailPage: React.FC<SpotDetailPageProps> = ({ spots, users }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t, dir, lang } = useI18n();
    const { currentUser: user } = useAuth();
    const { toggleFavorite, isFavorite } = useFavorites();
    const requireAuth = useRequireAuth();

    const [spot, setSpot] = useState<SpotListing | null>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [showGallery, setShowGallery] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    const isLiked = spot ? isFavorite(spot.id) : false;
    const [showOriginal, setShowOriginal] = useState(false);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries
    });

    // Load Spot Logic
    useEffect(() => {
        const loadSpot = async () => {
            if (!id) { setLoading(false); return; }

            try {
                const apiUrl = getApiUrl();
                const res = await fetch(`${apiUrl}/api/vehicles/${id}`);
                if (!res.ok) throw new Error('Spot not found');
                const data = await res.json();
                const v = data.vehicle || data;

                // Category mapping
                const type = (v.type || '').toLowerCase();
                const features = (v.amenities || v.features || []).map((f: string) => f.toLowerCase());
                let category = Category.ALL;
                if (type.includes('tent')) category = Category.TENTS;
                else if (type.includes('rv') || type.includes('camper')) category = Category.RVS;
                else if (features.includes('desert')) category = Category.DESERT;
                else if (features.includes('mountain')) category = Category.MOUNTAIN;

                setSpot({
                    id: v._id || v.id,
                    name: v.title || v.name || 'Untitled Spot',
                    nameAr: v.titleAr,
                    location: typeof v.location === 'string' ? v.location : (v.location?.formattedAddress || `${v.location?.city || ''}, ${v.location?.state || ''}`),
                    locationAr: v.locationAr || v.location?.addressAr,
                    city: v.city || v.location?.city,
                    state: v.state || v.location?.state,
                    country: v.country || v.location?.country,
                    coordinates: v.coordinates || v.location?.coordinates || { lat: 0, lng: 0 },
                    locationLink: v.locationLink || v.location?.locationLink,
                    rating: v.rating?.average || 0,
                    reviewCount: v.rating?.count || 0,
                    photos: v.images || v.photos || [],
                    features: v.amenities || v.features || [],
                    description: v.description || '',
                    descriptionAr: v.descriptionAr,
                    hostId: v.hostId?._id || v.hostId,
                    category: category,
                    price: v.price || 0
                });
            } catch (err: any) {
                const found = spots.find(s => s.id === id);
                if (found) setSpot(found);
            } finally {
                setLoading(false);
            }
        };
        loadSpot();
    }, [id, spots]);

    const fetchReviews = async () => {
        if (!spot?.id) return;
        try {
            const apiUrl = getApiUrl();
            const res = await fetch(`${apiUrl}/api/reviews/vehicle/${spot.id}`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data.reviews || []);
            }
        } catch (err) { console.error(err); }
    };

    // Load Reviews
    useEffect(() => {
        if (spot?.id) {
            fetchReviews();
        }
    }, [spot?.id]);

    const renderFeatureIcon = (feature: string) => {
        const f = feature.toLowerCase();
        if (f.includes('wifi')) return <Wifi size={20} />;
        if (f.includes('fire') || f.includes('pit')) return <Flame size={20} />;
        if (f.includes('water')) return <Droplets size={20} />;
        if (f.includes('mountain')) return <Mountain size={20} />;
        if (f.includes('tent')) return <Tent size={20} />;
        if (f.includes('4x4') || f.includes('drive')) return <Car size={20} />;
        return <Compass size={20} />;
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center animate-pulse">
            <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-stone-100 rounded-full mb-4"></div>
                <div className="h-4 w-32 bg-stone-100 rounded"></div>
            </div>
        </div>
    );

    if (!spot) return (
        <div className="min-h-screen bg-white flex items-center justify-center text-center p-8">
            <div>
                <h2 className="text-3xl font-bold text-brand-dark mb-4">{t('spotNotFound')}</h2>
                <button onClick={() => navigate('/')} className="px-6 py-3 bg-brand-orange text-white rounded-xl font-bold">{t('goHome')}</button>
            </div>
        </div>
    );

    const host = users.find(u => u.id === spot.hostId) || { id: 'host', name: 'Community Host', avatarUrl: `https://ui-avatars.com/api/?name=Host&background=random`, isVerified: true, rating: 4.9, reviewCount: 12 };

    return (
        <div className="min-h-screen bg-white text-brand-dark font-sans pb-32 relative">
            <Navbar />

            {/* Mobile Fixed Back Button (Floating) - Shiny Orange Update */}
            <div className="md:hidden fixed top-44 left-4 z-[100]">
                <button
                    onClick={() => navigate(-1)}
                    className="p-3 bg-gradient-to-br from-brand-orange to-orange-600 text-white rounded-full shadow-[0_8px_20px_rgba(249,115,22,0.4)] border border-white/20 active:scale-95 transition-all hover:scale-110"
                    aria-label={t('goBack')}
                >
                    <ArrowLeft size={22} strokeWidth={3} />
                </button>
            </div>

            {/* Premium Photo Gallery (Airbnb Style) */}
            {/* Added pt-48 on mobile to clear the fixed Navbar and Filter bar */}
            <div className="max-w-7xl mx-auto px-4 pt-48 md:pt-24 pb-8">
                <div className="relative h-[300px] md:h-[550px] rounded-3xl md:rounded-[2.5rem] overflow-hidden grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-3 group shadow-2xl shadow-stone-200 dark:shadow-none">
                    {/* Main Large Photo */}
                    <div className="relative overflow-hidden md:col-span-2 md:row-span-2 h-full">
                        <img
                            src={spot.photos[0] || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4'}
                            alt={spot.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer"
                        />
                    </div>

                    {/* Smaller Photos */}
                    {[1, 2, 3, 4].map((idx) => (
                        <div key={idx} className="relative overflow-hidden hidden md:block">
                            <img
                                src={spot.photos[idx] || `https://picsum.photos/seed/${spot.id}-${idx}/600/400`}
                                alt={`${spot.name} ${idx}`}
                                className="w-full h-full object-cover hover:scale-110 transition-transform duration-700 cursor-pointer"
                            />
                            {idx === 4 && (
                                <button
                                    onClick={() => setShowGallery(true)}
                                    className="absolute bottom-6 right-6 bg-brand-cream/90 backdrop-blur-md px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 border-none outline-none hover:scale-105 transition-transform text-brand-dark"
                                >
                                    <svg className="w-4 h-4 translate-y-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m7 6H4" /></svg>
                                    {t('showAll')} {spot.photos.length} {t('photosCount')}
                                </button>
                            )}
                        </div>
                    ))}

                    {/* Mobile Only: Show All Button */}
                    <button
                        onClick={() => setShowGallery(true)}
                        className="md:hidden absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl font-black text-xs shadow-lg flex items-center gap-2 border-none active:scale-95 transition-all text-stone-900"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 6h16M4 12h16m7 6H4" /></svg>
                        {spot.photos.length} {t('photosCount')}
                    </button>

                    {/* Desktop Back Button (Inside Gallery) */}
                    <div className="hidden md:block absolute top-8 left-8 z-10">
                        <button onClick={() => navigate(-1)} className="p-4 bg-white/30 backdrop-blur-xl hover:bg-white/60 rounded-full text-white hover:text-brand-dark transition-all shadow-2xl border-none outline-none group-hover:scale-110">
                            <ArrowLeft size={24} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Title Section */}
            {/* Quick Title Section - Densified */}
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Details */}
                <div className="md:col-span-2 space-y-6">
                    {/* Title Section */}
                    <div className="border-b border-stone-100 pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex gap-2 mb-2">
                                    <span className="px-2 py-0.5 bg-brand-orange text-white text-[10px] font-bold uppercase tracking-widest rounded-md">
                                        {spot.type ? spot.type.replace('_', ' ') : 'Campsite'}
                                    </span>
                                    {(spot.category === 'glamping' || spot.category === 'Glamping') && (
                                        <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-md flex items-center gap-1">
                                            <span className="text-yellow-400">★</span> Guest Favorite
                                        </span>
                                    )}
                                </div>
                                <h1 className="serif-heading text-2xl md:text-4xl font-black text-stone-900 mb-1 leading-tight">
                                    {(lang === 'ar' && !showOriginal && spot.nameAr) ? spot.nameAr : spot.name}
                                </h1>
                                <div className="flex items-center gap-1 text-stone-500 font-medium text-sm md:text-base">
                                    <MapPin size={16} className="text-brand-orange" />
                                    {spot.location}
                                    <span className="mx-1">•</span>
                                    <span className="text-brand-dark font-bold flex items-center gap-1">
                                        <span className="text-brand-orange">★</span> {spot.rating || 5}
                                    </span>
                                    <span className="text-stone-400">({spot.reviewCount || 1} reviews)</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <ShareButton title={spot.name} text={`Check out ${spot.name} on Mirhal`} />
                                <button
                                    onClick={() => requireAuth(() => spot && toggleFavorite(spot.id))}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors font-bold text-xs"
                                >
                                    <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                                    {isLiked ? t('saved') : t('save')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Host Info - Compact */}
                    <div className="flex items-center justify-between py-2 border-b border-stone-100">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img
                                    src={host.avatarUrl}
                                    alt={host.name}
                                    className="w-10 h-10 rounded-full object-cover border border-stone-100"
                                />
                                {host.isVerified && (
                                    <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full">
                                        <svg className="w-3 h-3 text-brand-orange" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-stone-900 leading-none mb-0.5">
                                    {spot.type === 'rv_rental' ? 'RV owned by' : 'Campsite reported by'} <br />
                                    <span className="text-base">{host.name}</span>
                                </h3>
                                <p className="text-xs text-stone-500">Verified community member</p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="serif-heading text-lg font-bold">{t('spotDetails')}</h2>
                            {/* Translation Toggle */}
                            {(lang === 'ar' && spot.descriptionAr) && (
                                <button
                                    onClick={() => setShowOriginal(!showOriginal)}
                                    className="text-xs font-bold text-brand-orange hover:text-orange-700 flex items-center gap-1 transition-colors"
                                >
                                    {showOriginal ? (
                                        <>
                                            <span className="text-xl">✨</span> {t('translate') || 'Translate to Arabic'}
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-stone-400 font-normal">Translated by AI • </span> {t('showOriginal') || 'Show Original'}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                        <p className="text-stone-600 leading-relaxed text-sm whitespace-pre-line">
                            {(lang === 'ar' && !showOriginal && spot.descriptionAr) ? spot.descriptionAr : spot.description}
                        </p>
                    </div>

                    {/* Features Grid - Compact */}
                    <div>
                        <h2 className="serif-heading text-lg font-bold mb-3">{t('featuresAndTerrain')}</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {spot.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-stone-600 bg-stone-50 p-2 rounded-lg">
                                    <div className="text-stone-400">
                                        {renderFeatureIcon(feature)}
                                    </div>
                                    <span className="text-sm font-medium">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-[300px] md:h-[400px] rounded-2xl md:rounded-[3rem] overflow-hidden bg-white relative group border border-stone-100 shadow-xl">
                        {isLoaded ? (
                            // Check if coordinates are valid (not 0,0)
                            spot.coordinates.lat !== 0 || spot.coordinates.lng !== 0 ? (
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                    center={spot.coordinates}
                                    zoom={13}
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
                                    <Marker position={spot.coordinates} />
                                </GoogleMap>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 font-medium bg-stone-50">
                                    <MapPin size={48} className="mb-2 opacity-20" />
                                    <span>{t('locationNotAvailable') || 'Location map not available'}</span>
                                </div>
                            )
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400 font-medium">
                                {t('loadingMap')}
                            </div>
                        )}
                        <div className="absolute top-4 right-4 md:top-6 md:right-6">
                            {/* Only show expand button if we have valid coords */}
                            {(spot.coordinates.lat !== 0 || spot.coordinates.lng !== 0) && (
                                <button
                                    onClick={() => setIsLocationModalOpen(true)}
                                    className="px-4 py-2 md:px-6 md:py-3 bg-white rounded-xl md:rounded-2xl font-black shadow-xl md:shadow-2xl hover:scale-105 transition-transform flex items-center gap-2 md:gap-3 text-stone-900 border border-stone-100 outline-none text-xs md:text-base"
                                >
                                    <MapPin className="text-brand-orange w-4 h-4 md:w-auto md:h-auto" />
                                    {t('expandMap')}
                                </button>
                            )}
                        </div>
                    </div>

                    <div id="reviews" className="space-y-8 md:space-y-12">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="serif-heading text-2xl md:text-4xl font-bold text-stone-900">{t('communityReviews')}</h3>
                                <p className="text-stone-500 font-bold mt-1 text-sm md:text-base">{t('whatExplorersAreSaying')}</p>
                            </div>
                            <button
                                onClick={() => requireAuth(() => setShowReviewModal(true))}
                                className="px-5 py-2.5 md:px-8 md:py-4 bg-stone-900 text-white rounded-full font-black hover:bg-stone-800 transition-all border-none outline-none shadow-xl shadow-stone-900/20 text-xs md:text-base"
                            >
                                {t('writeAReview')}
                            </button>
                        </div>

                        {/* Existing Reviews */}
                        <div className="grid grid-cols-1 gap-4 md:gap-6">
                            {reviews.length > 0 ? (
                                reviews.map((r, i) => (
                                    <ReviewCard key={r._id || i} review={r} />
                                ))
                            ) : (
                                <div className="col-span-full py-8 md:py-12 text-center text-stone-400 font-bold border-2 border-dashed border-stone-200 rounded-2xl md:rounded-[3rem] text-sm md:text-base">
                                    {t('noReviewsMessage')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sticky Info Card */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 md:top-28 p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] bg-brand-dark text-white shadow-2xl">
                        <div className="flex items-baseline justify-between mb-6 md:mb-8 pb-6 md:pb-8 border-b border-white/10">
                            <div>
                                <span className="text-3xl md:text-5xl font-black text-brand-orange">{spot.price > 0 ? `${spot.price} AED` : t('freeLabel')}</span>
                                <span className="text-white/60 font-medium ml-2 uppercase text-[10px] md:text-xs tracking-widest">{spot.price > 0 ? t('perNight') : t('campingLabel')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Star size={16} className="text-brand-orange md:w-[18px] md:h-[18px]" fill="currentColor" />
                                <span className="font-bold text-sm md:text-base">{spot.rating}</span>
                                <span className="text-white/40 text-xs md:text-base">({spot.reviewCount})</span>
                            </div>
                        </div>

                        <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                            <div className="flex flex-col gap-1 md:gap-2 p-4 md:p-5 rounded-2xl bg-white/5 border border-white/10 text-right" dir={dir}>
                                <span className="text-white/40 text-[10px] md:text-xs font-black uppercase tracking-wider">{t('accessRequirements')}</span>
                                <span className="font-bold text-base md:text-lg">{t('publicLandOpenAccess')}</span>
                            </div>
                            <div className="flex flex-col gap-1 md:gap-2 p-4 md:p-5 rounded-2xl bg-white/5 border border-white/10 text-right" dir={dir}>
                                <span className="text-white/40 text-[10px] md:text-xs font-black uppercase tracking-wider">{t('permitStatus')}</span>
                                <span className="font-bold text-base md:text-lg">{t('noPermitRequired')}</span>
                            </div>

                            {spot.price > 0 && spot.contactPhone && (
                                <div className="flex flex-col gap-1 md:gap-2 p-4 md:p-5 rounded-2xl bg-white/5 border border-white/10 text-right" dir={dir}>
                                    <span className="text-white/40 text-[10px] md:text-xs font-black uppercase tracking-wider">{t('hostContact') || 'Host Contact'}</span>
                                    <a href={`tel:${spot.contactPhone}`} className="font-bold text-base md:text-lg hover:text-brand-orange transition-colors flex items-center justify-end gap-2">
                                        <Phone size={16} className="md:w-[18px] md:h-[18px]" />
                                        {spot.contactPhone}
                                    </a>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setIsLocationModalOpen(true)}
                            className="w-full py-4 md:py-5 bg-brand-orange text-white rounded-xl md:rounded-2xl font-black text-xl md:text-2xl shadow-xl hover:shadow-brand-orange/40 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3 md:gap-4 border-none outline-none"
                        >
                            <Compass size={24} className="md:w-7 md:h-7" strokeWidth={3} />
                            {t('openNavigation')}
                        </button>

                        <p className="text-center text-[10px] md:text-xs text-white/40 mt-4 md:mt-6 font-medium leading-relaxed">
                            {t('leaveNoTraceNote')}
                        </p>

                        {/* Report Button */}
                        <div className="mt-6 flex justify-center border-t border-white/10 pt-4">
                            <button
                                onClick={() => setShowReportModal(true)}
                                className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider group"
                            >
                                <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-red-500/20 transition-colors">
                                    <ShieldCheck className="w-4 h-4 group-hover:text-red-400" />
                                </div>
                                <span>Report Listing</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <LocationModal
                isOpen={isLocationModalOpen}
                onClose={() => setIsLocationModalOpen(false)}
                location={spot.coordinates}
                locationLink={spot.locationLink}
                title={spot.name}
            />

            {
                spot && showReviewModal && (
                    <ReviewModal
                        onClose={() => setShowReviewModal(false)}
                        onSubmit={fetchReviews}
                        spotId={spot.id}
                        spotName={spot.name}
                    />
                )
            }

            {
                spot && showReportModal && (
                    <ReportModal
                        onClose={() => setShowReportModal(false)}
                        spotId={spot.id}
                        spotName={spot.name}
                    />
                )
            }

            {/* Gallery Modal */}
            {
                showGallery && (
                    <div className="fixed inset-0 z-[200] bg-white animate-in fade-in zoom-in duration-300 overflow-y-auto">
                        <div className="max-w-5xl mx-auto px-4 py-20 relative">
                            <button
                                onClick={() => setShowGallery(false)}
                                className="fixed top-8 left-8 p-4 bg-white rounded-full hover:scale-110 transition-transform border-none outline-none z-10 text-brand-dark"
                            >
                                <X size={24} />
                            </button>
                            <h2 className="serif-heading text-4xl font-bold mb-12 text-brand-dark">{t('allPhotos')}</h2>
                            <div className="columns-1 md:columns-2 gap-6 space-y-6">
                                {spot.photos.map((p, i) => (
                                    <img key={i} src={p} alt="" className="w-full rounded-3xl shadow-xl" />
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default SpotDetailPage;
