import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { getApiUrl } from '../utils/api';
import { Calendar, MapPin, Star, Heart, Settings, Trash2, LogIn, LogOut } from 'lucide-react';
import SpotCard from '../components/SpotCard';
import UserEditSpotModal from '../components/UserEditSpotModal';
import DeleteAccountModal from '../components/DeleteAccountModal';
import AuthModal from '../components/AuthModal';
import { SpotListing } from '../types';

const UserProfilePage: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const { t } = useI18n();
    const { favorites } = useFavorites();
    const [userSubmissions, setUserSubmissions] = useState<SpotListing[]>([]);
    const [userReviews, setUserReviews] = useState<any[]>([]);
    const [savedSpots, setSavedSpots] = useState<SpotListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingSpot, setEditingSpot] = useState<SpotListing | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'submissions' | 'reviews' | 'favorites' | 'settings'>('submissions');

    useEffect(() => {
        const fetchUserData = async () => {
            if (!currentUser) return;

            try {
                const apiUrl = getApiUrl();
                // Supabase Token
                const { data: { session } } = await import('../supabaseClient').then(m => m.supabase.auth.getSession());
                const token = session?.access_token; // Use Supabase Access Token

                if (!token) throw new Error("No access token found");

                // Fetch ALL vehicles and filter/transform
                const submissionsRes = await fetch(`${apiUrl}/api/vehicles`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (submissionsRes.ok) {
                    const data = await submissionsRes.json();
                    const allVehicles = data.vehicles || [];

                    // Transform vehicles to SpotListing format
                    const transformedSpots = allVehicles.map((v: any) => ({
                        id: v._id || v.id,
                        name: v.title || v.name || 'Untitled',
                        location: v.location?.formattedAddress || v.location?.address || 'Unknown',
                        coordinates: v.location?.coordinates || { lat: 0, lng: 0 },
                        rating: typeof v.rating === 'object' ? (v.rating?.average || 0) : (Number(v.rating) || 0),
                        reviewCount: typeof v.rating === 'object' ? (v.rating?.count || 0) : (v.reviewCount || 0),
                        photos: v.images || v.photos || [],
                        features: v.amenities || v.features || [],
                        description: v.description || '',
                        hostId: typeof v.hostId === 'object' ? v.hostId?._id : v.hostId,
                        category: v.category || 'Camping Spot',
                        approvalStatus: v.approvalStatus || 'approved',
                        price: v.price || 0,
                        contactPhone: v.contactPhone,
                        titleAr: v.titleAr
                    }));

                    // Filter for user's submissions
                    const userSpots = transformedSpots.filter((spot: SpotListing) =>
                        spot.hostId === currentUser.uid
                    );

                    setUserSubmissions(userSpots);

                    // Also set saved spots if we have favorites
                    if (favorites.length > 0) {
                        const favSpots = transformedSpots.filter((spot: SpotListing) =>
                            favorites.includes(spot.id)
                        );
                        setSavedSpots(favSpots);
                    }
                }

                // Reviews - handle gracefully if endpoint doesn't exist
                try {
                    const reviewsRes = await fetch(`${apiUrl}/api/reviews`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (reviewsRes.ok) {
                        const data = await reviewsRes.json();
                        setUserReviews(data.reviews || []);
                    }
                } catch {
                    setUserReviews([]);
                }

                setLoading(false);
            } catch (error) {
                console.error('Error fetching user data:', error);
                setLoading(false);
            }
        };

        fetchUserData();
    }, [currentUser, favorites]);

    if (!currentUser) {
        return (
            <>
                <div className="pt-48 pb-20 px-6 min-h-[70vh] flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-stone-100 dark:bg-stone-900 rounded-full flex items-center justify-center mb-6">
                        <Settings size={40} className="text-brand-orange/30" />
                    </div>
                    <h1 className="serif-heading text-4xl font-black mb-3 text-stone-900 dark:text-white">
                        {t('signInRequired')}
                    </h1>
                    <p className="text-stone-500 dark:text-stone-400 text-lg mb-8 max-w-md">
                        {t('signInToManage')}
                    </p>
                    <button
                        onClick={() => setShowLoginModal(true)}
                        className="px-8 py-4 bg-brand-orange text-white rounded-xl font-bold text-lg shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                    >
                        <LogIn size={24} />
                        {t('signIn')}
                    </button>
                </div>
                {showLoginModal && <AuthModal onClose={() => setShowLoginModal(false)} />}
            </>
        );
    }

    if (loading) {
        return (
            <div className="pt-48 pb-20 px-6 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="text-stone-500 font-medium">{t('loading')}</p>
                </div>
            </div>
        );
    }

    const joinedDate = currentUser.created_at
        ? new Date(currentUser.created_at).toLocaleDateString()
        : 'Unknown';

    return (
        <div className="pt-48 pb-20 min-h-screen bg-stone-50 dark:bg-stone-950">
            <div className="max-w-7xl mx-auto px-6">
                {/* Profile Header */}
                <div className="bg-white dark:bg-stone-900 rounded-[3rem] p-12 mb-8 shadow-xl border border-stone-100 dark:border-stone-800">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-brand-orange/20 shadow-2xl">
                            <img
                                src={currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.user_metadata?.full_name || currentUser.email || 'User')}
                                alt={currentUser.user_metadata?.full_name || 'User'}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <h1 className="serif-heading text-5xl font-black mb-2 text-stone-900 dark:text-white">
                                {currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Explorer'}
                            </h1>
                            <p className="text-stone-500 text-lg mb-4">{currentUser.email}</p>
                            <div className="flex items-center gap-2 text-stone-400 justify-center md:justify-start">
                                <Calendar size={16} />
                                <span className="text-sm font-medium">{t('joinedDate')} {joinedDate}</span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-4xl font-black text-brand-orange mb-1">{userSubmissions.length}</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-stone-400">{t('spotsSubmitted')}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-black text-brand-orange mb-1">{userReviews.length}</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-stone-400">{t('reviewsWritten')}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-black text-brand-orange mb-1">{favorites.length}</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-stone-400">{t('favoriteSpots')}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Tabs */}
                <div className="bg-white dark:bg-stone-900 rounded-[3rem] shadow-xl border border-stone-100 dark:border-stone-800 overflow-hidden">
                    <div className="flex border-b border-stone-100 dark:border-stone-800">
                        <button
                            onClick={() => setActiveTab('submissions')}
                            className={`flex-1 py-6 font-black text-lg transition-all ${activeTab === 'submissions'
                                ? 'bg-brand-orange text-white'
                                : 'text-stone-400 hover:text-stone-900 dark:hover:text-white'
                                }`}
                        >
                            {t('submissions')}
                        </button>
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`flex-1 py-6 font-black text-lg transition-all ${activeTab === 'reviews'
                                ? 'bg-brand-orange text-white'
                                : 'text-stone-400 hover:text-stone-900 dark:hover:text-white'
                                }`}
                        >
                            {t('myReviews')}
                        </button>
                        <button
                            onClick={() => setActiveTab('favorites')}
                            className={`flex-1 py-6 font-black text-lg transition-all ${activeTab === 'favorites'
                                ? 'bg-brand-orange text-white'
                                : 'text-stone-400 hover:text-stone-900 dark:hover:text-white'
                                }`}
                        >
                            {t('favoriteSpots')}
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`flex-1 py-6 font-black text-lg transition-all ${activeTab === 'settings'
                                ? 'bg-brand-orange text-white'
                                : 'text-stone-400 hover:text-stone-900 dark:hover:text-white'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Settings size={20} />
                                {t('settings') || 'Settings'}
                            </div>
                        </button>
                    </div>

                    <div className="p-8">
                        {/* Submissions Tab */}
                        {activeTab === 'submissions' && (
                            <div>
                                {userSubmissions.length === 0 ? (
                                    <div className="text-center py-20">
                                        <MapPin size={64} className="mx-auto mb-6 text-stone-300 dark:text-stone-700" />
                                        <p className="text-2xl font-bold text-stone-400">{t('noSubmissionsYet')}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {userSubmissions.map((spot) => (
                                            <div key={spot.id} className="relative group">
                                                <SpotCard spot={spot} />
                                                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-black uppercase z-10 ${spot.approvalStatus === 'approved' ? 'bg-green-500 text-white' :
                                                    spot.approvalStatus === 'pending' ? 'bg-yellow-500 text-white' :
                                                        'bg-red-500 text-white'
                                                    }`}>
                                                    {t(spot.approvalStatus || 'pending')}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setEditingSpot(spot);
                                                    }}
                                                    className="absolute top-4 right-4 bg-white/90 hover:bg-white text-stone-900 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                                    title="Edit Spot"
                                                >
                                                    <div className="w-5 h-5">✏️</div>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {editingSpot && (
                            <UserEditSpotModal
                                spot={editingSpot}
                                onClose={() => setEditingSpot(null)}
                                onRefresh={() => {
                                    // Trigger refresh by toggling active tab or refetching
                                    // ideally we extract fetchUserData to be callable
                                    window.location.reload(); // Simple refresh for MVP
                                }}
                            />
                        )}

                        {/* Reviews Tab */}
                        {activeTab === 'reviews' && (
                            <div>
                                {userReviews.length === 0 ? (
                                    <div className="text-center py-20">
                                        <Star size={64} className="mx-auto mb-6 text-stone-300 dark:text-stone-700" />
                                        <p className="text-2xl font-bold text-stone-400">{t('noReviewsYet')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {userReviews.map((review, index) => (
                                            <div key={review.id || index} className="bg-stone-50 dark:bg-stone-950 p-6 rounded-2xl border border-stone-100 dark:border-stone-800">
                                                <div className="flex items-center gap-2 mb-3">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            size={20}
                                                            className={star <= review.rating ? 'text-brand-orange fill-current' : 'text-stone-300'}
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-stone-700 dark:text-stone-300 mb-2">{review.comment}</p>
                                                <p className="text-sm text-stone-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Favorites Tab */}
                        {activeTab === 'favorites' && (
                            <div>
                                {savedSpots.length === 0 ? (
                                    <div className="text-center py-20">
                                        <Heart size={64} className="mx-auto mb-6 text-stone-300 dark:text-stone-700" />
                                        <p className="text-2xl font-bold text-stone-400">{t('noFavorites')}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {savedSpots.map((spot) => (
                                            <SpotCard key={spot.id} spot={spot} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Settings Tab */}
                        {activeTab === 'settings' && (
                            <div className="max-w-2xl">
                                <h3 className="text-2xl font-black text-stone-900 dark:text-white mb-6">
                                    Account Settings
                                </h3>

                                {/* Account Info */}
                                <div className="bg-stone-50 dark:bg-stone-950 rounded-2xl p-6 mb-6 border border-stone-100 dark:border-stone-800">
                                    <h4 className="text-lg font-bold text-stone-900 dark:text-white mb-4">
                                        Account Information
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-stone-500 font-medium">Email:</span>
                                            <span className="text-stone-900 dark:text-white font-bold">{currentUser.email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-stone-500 font-medium">Provider:</span>
                                            <span className="text-stone-900 dark:text-white font-bold capitalize">
                                                {currentUser.app_metadata?.provider || 'email'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-stone-500 font-medium">Joined:</span>
                                            <span className="text-stone-900 dark:text-white font-bold">{joinedDate}</span>
                                        </div>
                                    </div>
                                </div>


                                {/* Legal Info */}
                                <div className="bg-stone-50 dark:bg-stone-950 rounded-2xl p-6 mb-6 border border-stone-100 dark:border-stone-800">
                                    <h4 className="text-lg font-bold text-stone-900 dark:text-white mb-4">
                                        Legal
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        <a href="https://mirhal.app/privacy" target="_blank" rel="noopener noreferrer" className="flex justify-between items-center group cursor-pointer">
                                            <span className="text-stone-500 font-medium group-hover:text-stone-900 dark:group-hover:text-white transition-colors">Privacy Policy</span>
                                            <span className="text-stone-400 group-hover:text-brand-orange transition-colors">↗</span>
                                        </a>
                                        <a href="https://mirhal.app/terms" target="_blank" rel="noopener noreferrer" className="flex justify-between items-center group cursor-pointer">
                                            <span className="text-stone-500 font-medium group-hover:text-stone-900 dark:group-hover:text-white transition-colors">Terms of Service</span>
                                            <span className="text-stone-400 group-hover:text-brand-orange transition-colors">↗</span>
                                        </a>
                                    </div>
                                </div>

                                {/* Sign Out Section */}
                                <div className="bg-stone-50 dark:bg-stone-950 rounded-2xl p-6 mb-6 border border-stone-100 dark:border-stone-800 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-lg font-bold text-stone-900 dark:text-white mb-1">
                                            Sign Out
                                        </h4>
                                        <p className="text-sm text-stone-500">
                                            Log out of your account on this device.
                                        </p>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="px-6 py-2 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-900 dark:text-white rounded-xl font-bold transition-all flex items-center gap-2"
                                    >
                                        <LogOut size={18} />
                                        {t('signOut')}
                                    </button>
                                </div>

                                {/* Danger Zone */}
                                <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-6 border-2 border-red-200 dark:border-red-900">
                                    <h4 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                                        <Trash2 size={20} />
                                        Danger Zone
                                    </h4>
                                    <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                                        Once you delete your account, there is no going back. Please be certain.
                                    </p>
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all flex items-center gap-2"
                                    >
                                        <Trash2 size={18} />
                                        Delete My Account
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Delete Account Modal */}
                {showDeleteModal && (
                    <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />
                )}
            </div>
        </div>
    );
};

export default UserProfilePage;
